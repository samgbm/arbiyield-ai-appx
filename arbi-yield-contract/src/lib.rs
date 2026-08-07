//! ArbiYield AI — Strategy Executor (Arbitrum Stylus)
//!
//! Stores AI-generated yield strategies on-chain per owner and emits
//! `StrategyExecuted` / `StrategyCreated` events for explorers / frontend.

#![cfg_attr(not(any(test, feature = "export-abi")), no_main)]
extern crate alloc;

use alloc::{string::String, vec::Vec};

use alloy_primitives::{Address, U256};
/// `sol!` is provided by alloy-sol-macro and re-exported through alloy-sol-types
/// (Stylus SDK 0.10.8 does not expose `stylus_sdk::alloy_sol_macro` directly).
use stylus_sdk::alloy_sol_types::sol;
use stylus_sdk::{
    prelude::*,
    storage::{
        StorageAddress, StorageMap, StorageString, StorageU256, StorageVec,
    },
};

sol! {
    event StrategyExecuted(address indexed user, string strategyName, uint256 expectedYield);
    event StrategyCreated(
        address indexed owner,
        string id,
        string name,
        uint256 apy,
        uint256 tvl
    );
}

/// On-chain yield strategy details owned by a wallet.
#[storage]
pub struct YieldStrategy {
    id: StorageString,
    name: StorageString,
    apy: StorageU256,
    tvl: StorageU256,
    owner: StorageAddress,
}

/// Persistent storage for the AI Yield Strategy Executor.
#[storage]
#[entrypoint]
pub struct StrategyExecutor {
    /// Global count of strategies created / executed across all users.
    total_strategies_executed: StorageU256,
    /// Owner address → list of their on-chain `YieldStrategy` records.
    strategies_by_owner: StorageMap<Address, StorageVec<YieldStrategy>>,
}

#[public]
impl StrategyExecutor {
    /// Persist a full yield strategy for the caller.
    pub fn create_strategy(
        &mut self,
        id: String,
        name: String,
        apy: U256,
        tvl: U256,
    ) {
        let owner = self.vm().msg_sender();

        let total = self.total_strategies_executed.get();
        self.total_strategies_executed
            .set(total + U256::from(1));

        let mut list = self.strategies_by_owner.setter(owner);
        let mut row = list.grow();
        row.id.set_str(&id);
        row.name.set_str(&name);
        row.apy.set(apy);
        row.tvl.set(tvl);
        row.owner.set(owner);

        self.vm().log(StrategyCreated {
            owner,
            id: id.clone(),
            name: name.clone(),
            apy,
            tvl,
        });

        // Keep legacy explorer / toast listeners working.
        self.vm().log(StrategyExecuted {
            user: owner,
            strategyName: name,
            expectedYield: apy,
        });
    }

    /// Legacy helper — records a strategy with `tvl = 0` and `id = name`.
    pub fn execute_strategy(&mut self, strategy_name: String, expected_yield: U256) {
        self.create_strategy(
            strategy_name.clone(),
            strategy_name,
            expected_yield,
            U256::ZERO,
        );
    }

    /// Returns every yield strategy stored for `owner`.
    /// Tuple layout: `(id, name, apy, tvl, owner)`.
    pub fn get_strategies_by_owner(
        &self,
        owner: Address,
    ) -> Vec<(String, String, U256, U256, Address)> {
        let list = self.strategies_by_owner.getter(owner);
        let n = list.len();
        let mut out = Vec::with_capacity(n);

        for i in 0..n {
            let Some(row) = list.getter(i) else {
                continue;
            };
            out.push((
                row.id.get_string(),
                row.name.get_string(),
                row.apy.get(),
                row.tvl.get(),
                row.owner.get(),
            ));
        }

        out
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
    fn test_create_strategy_stores_details() {
        let vm = TestVM::default();
        let mut contract = StrategyExecutor::from(&vm);
        let owner = vm.msg_sender();

        assert_eq!(U256::ZERO, contract.total_strategies_executed());
        assert_eq!(U256::ZERO, contract.get_user_strategy_count(owner));

        contract.create_strategy(
            String::from("safe-usdc-aave"),
            String::from("Safe USDC Aave"),
            U256::from(520),
            U256::from(1_250_000),
        );

        assert_eq!(U256::from(1), contract.total_strategies_executed());
        assert_eq!(U256::from(1), contract.get_user_strategy_count(owner));

        let strategies = contract.get_strategies_by_owner(owner);
        assert_eq!(strategies.len(), 1);
        assert_eq!(strategies[0].0, "safe-usdc-aave");
        assert_eq!(strategies[0].1, "Safe USDC Aave");
        assert_eq!(strategies[0].2, U256::from(520));
        assert_eq!(strategies[0].3, U256::from(1_250_000));
        assert_eq!(strategies[0].4, owner);
    }

    #[test]
    fn test_execute_strategy_increments_counts() {
        let vm = TestVM::default();
        let mut contract = StrategyExecutor::from(&vm);

        assert_eq!(U256::ZERO, contract.total_strategies_executed());
        assert_eq!(
            U256::ZERO,
            contract.get_user_strategy_count(vm.msg_sender())
        );

        contract.execute_strategy(String::from("safe-usdc-yield"), U256::from(500));

        assert_eq!(U256::from(1), contract.total_strategies_executed());
        assert_eq!(
            U256::from(1),
            contract.get_user_strategy_count(vm.msg_sender())
        );

        contract.execute_strategy(String::from("arb-loop"), U256::from(1200));

        assert_eq!(U256::from(2), contract.total_strategies_executed());
        assert_eq!(
            U256::from(2),
            contract.get_user_strategy_count(vm.msg_sender())
        );
    }
}
