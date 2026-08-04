//! ArbiYield AI — Strategy Executor (Arbitrum Stylus)
//!
//! Records AI-generated yield strategy executions on-chain and emits
//! `StrategyExecuted` events for explorers / frontend toasts.

#![cfg_attr(not(any(test, feature = "export-abi")), no_main)]
extern crate alloc;

use alloc::string::String;

use alloy_primitives::{Address, U256};
/// `sol!` is provided by alloy-sol-macro and re-exported through alloy-sol-types
/// (Stylus SDK 0.10.8 does not expose `stylus_sdk::alloy_sol_macro` directly).
use stylus_sdk::alloy_sol_types::sol;
use stylus_sdk::{
    prelude::*,
    storage::{StorageMap, StorageU256},
};

sol! {
    event StrategyExecuted(address indexed user, string strategyName, uint256 expectedYield);
}

/// Persistent storage for the AI Yield Strategy Executor.
#[storage]
#[entrypoint]
pub struct StrategyExecutor {
    /// Global count of strategies executed across all users.
    total_strategies_executed: StorageU256,
    /// Per-user strategy execution counts.
    user_strategies: StorageMap<Address, StorageU256>,
}

#[public]
impl StrategyExecutor {
    /// Execute (record) an AI yield strategy for the caller and emit an event.
    pub fn execute_strategy(&mut self, strategy_name: String, expected_yield: U256) {
        let user = self.vm().msg_sender();

        let total = self.total_strategies_executed.get();
        self.total_strategies_executed
            .set(total + U256::from(1));

        let mut user_count = self.user_strategies.setter(user);
        let current = user_count.get();
        user_count.set(current + U256::from(1));

        self.vm().log(StrategyExecuted {
            user,
            strategyName: strategy_name,
            expectedYield: expected_yield,
        });
    }

    /// Returns how many strategies a given user has executed.
    pub fn get_user_strategy_count(&self, user: Address) -> U256 {
        self.user_strategies.get(user)
    }

    /// Returns the global number of strategies executed.
    pub fn total_strategies_executed(&self) -> U256 {
        self.total_strategies_executed.get()
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use stylus_sdk::testing::*;

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
