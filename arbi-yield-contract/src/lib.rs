//! ArbiYield AI — Strategy Executor (Arbitrum Stylus)
//!
//! On-chain notary: strategy `id` + `creator` only.
//! Human-readable copy, KPIs, and execution steps live in Supabase
//! matched by strategy id.

#![cfg_attr(not(any(test, feature = "export-abi")), no_main)]
extern crate alloc;

use alloc::{string::String, vec::Vec};

use alloy_primitives::{Address, U256};
use stylus_sdk::alloy_sol_types::sol;
use stylus_sdk::{
    prelude::*,
    storage::{
        StorageAddress, StorageMap, StorageString, StorageU256, StorageVec,
    },
};

sol! {
    event StrategyExecuted(address indexed user, string strategyName, uint256 expectedYield);
    event StrategyCreated(address indexed creator, string id);
}

/// Minimal on-chain yield strategy record.
#[storage]
pub struct YieldStrategy {
    id: StorageString,
    creator: StorageAddress,
}

/// Persistent storage for the AI Yield Strategy Executor.
#[storage]
#[entrypoint]
pub struct StrategyExecutor {
    /// Global count of strategies created / executed across all users.
    total_strategies_executed: StorageU256,
    /// Creator address → list of their on-chain strategy records.
    strategies_by_owner: StorageMap<Address, StorageVec<YieldStrategy>>,
    /// Global registry so the hub can list every strategy without knowing owners.
    all_strategy_ids: StorageVec<StorageString>,
    /// `mapping(id => creator)` for O(1) creator lookups.
    creator_by_id: StorageMap<String, StorageAddress>,
}

fn err(msg: &str) -> Vec<u8> {
    msg.as_bytes().to_vec()
}

#[public]
impl StrategyExecutor {
    /// Register a strategy id for the caller. All other fields stay off-chain.
    pub fn create_strategy(&mut self, id: String) -> Result<(), Vec<u8>> {
        if id.is_empty() {
            return Err(err("create_strategy: empty id"));
        }
        if self.creator_by_id.get(id.clone()) != Address::ZERO {
            return Err(err("create_strategy: id already registered"));
        }

        let creator = self.vm().msg_sender();

        let total = self.total_strategies_executed.get();
        self.total_strategies_executed
            .set(total + U256::from(1));

        {
            let mut list = self.strategies_by_owner.setter(creator);
            let mut row = list.grow();
            row.id.set_str(&id);
            row.creator.set(creator);
        }

        {
            let mut slot = self.all_strategy_ids.grow();
            slot.set_str(&id);
        }
        self.creator_by_id.setter(id.clone()).set(creator);

        self.vm().log(StrategyCreated {
            creator,
            id: id.clone(),
        });

        // Keep legacy explorer / toast listeners working.
        self.vm().log(StrategyExecuted {
            user: creator,
            strategyName: id,
            expectedYield: U256::ZERO,
        });

        Ok(())
    }

    /// Legacy helper — registers `strategy_name` as the id.
    pub fn execute_strategy(
        &mut self,
        strategy_name: String,
        _expected_yield: U256,
    ) -> Result<(), Vec<u8>> {
        self.create_strategy(strategy_name)
    }

    /// Returns every strategy id + creator (global hub listing).
    pub fn get_all_strategies(&self) -> Vec<(String, Address)> {
        let n = self.all_strategy_ids.len();
        let mut out = Vec::with_capacity(n);
        for i in 0..n {
            let Some(slot) = self.all_strategy_ids.getter(i) else {
                continue;
            };
            let id = slot.get_string();
            let creator = self.creator_by_id.get(id.clone());
            out.push((id, creator));
        }
        out
    }

    /// Returns strategy ids owned by `owner` with creator address.
    pub fn get_strategies_by_owner(&self, owner: Address) -> Vec<(String, Address)> {
        let list = self.strategies_by_owner.getter(owner);
        let n = list.len();
        let mut out = Vec::with_capacity(n);

        for i in 0..n {
            let Some(row) = list.getter(i) else {
                continue;
            };
            out.push((row.id.get_string(), row.creator.get()));
        }

        out
    }

    /// Creator for a strategy id (`address(0)` if unknown).
    pub fn get_strategy_creator(&self, id: String) -> Address {
        self.creator_by_id.get(id)
    }

    /// Returns how many strategies a given user owns on-chain.
    pub fn get_user_strategy_count(&self, user: Address) -> U256 {
        U256::from(self.strategies_by_owner.getter(user).len() as u64)
    }

    /// Returns the global number of strategies created / executed.
    pub fn total_strategies_executed(&self) -> U256 {
        self.total_strategies_executed.get()
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use stylus_sdk::testing::*;

    #[test]
    fn test_create_strategy_stores_id_and_creator() {
        let vm = TestVM::default();
        let mut contract = StrategyExecutor::from(&vm);
        let owner = vm.msg_sender();

        assert_eq!(U256::ZERO, contract.total_strategies_executed());
        assert_eq!(U256::ZERO, contract.get_user_strategy_count(owner));

        contract
            .create_strategy(String::from("safe-usdc-aave"))
            .expect("create");

        assert_eq!(U256::from(1), contract.total_strategies_executed());
        assert_eq!(U256::from(1), contract.get_user_strategy_count(owner));

        let by_owner = contract.get_strategies_by_owner(owner);
        assert_eq!(by_owner.len(), 1);
        assert_eq!(by_owner[0].0, "safe-usdc-aave");
        assert_eq!(by_owner[0].1, owner);

        let all = contract.get_all_strategies();
        assert_eq!(all.len(), 1);
        assert_eq!(all[0].0, "safe-usdc-aave");
        assert_eq!(all[0].1, owner);
        assert_eq!(
            contract.get_strategy_creator(String::from("safe-usdc-aave")),
            owner
        );
    }

    #[test]
    fn test_duplicate_id_reverts() {
        let vm = TestVM::default();
        let mut contract = StrategyExecutor::from(&vm);
        contract
            .create_strategy(String::from("dup"))
            .expect("first");
        let err = contract
            .create_strategy(String::from("dup"))
            .expect_err("duplicate");
        assert!(String::from_utf8_lossy(&err).contains("already registered"));
    }

    #[test]
    fn test_execute_strategy_increments_counts() {
        let vm = TestVM::default();
        let mut contract = StrategyExecutor::from(&vm);

        contract
            .execute_strategy(String::from("safe-usdc-yield"), U256::from(500))
            .unwrap();
        assert_eq!(U256::from(1), contract.total_strategies_executed());

        contract
            .execute_strategy(String::from("arb-loop"), U256::from(1200))
            .unwrap();
        assert_eq!(U256::from(2), contract.total_strategies_executed());
        assert_eq!(
            U256::from(2),
            contract.get_user_strategy_count(vm.msg_sender())
        );
    }
}
