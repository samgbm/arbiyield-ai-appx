//! El Niño Climate Resilience — Arbitrum Stylus core (Increment 3 scaffold)
//!
//! Holds parametric farmer insurance policies and immutable aid-logistics
//! checkpoint hashes. Business logic (batch onboarding, oracle payouts,
//! logistics append/verify) lands in later increments.
//!
//! Storage layout uses Stylus `#[storage]` types (SDK 0.10 equivalent of the
//! older `sol_storage!` macro). Solidity-style mappings become
//! `StorageMap<K, V>` over persistent slots.

#![cfg_attr(not(any(test, feature = "export-abi")), no_main)]
extern crate alloc;

use alloc::string::String;

use alloy_primitives::{Address, B256, U256};
use stylus_sdk::{
    prelude::*,
    storage::{
        StorageAddress, StorageB256, StorageBool, StorageMap, StorageString,
        StorageU256,
    },
};

/// Parametric insurance policy for a single farmer (Stylus storage).
///
/// Solidity analogue:
/// ```solidity
/// struct FarmerPolicy {
///     address farmerAddress;
///     string locationId;
///     uint256 coverageAmount;
///     bool isActive;
/// }
/// ```
#[storage]
#[allow(dead_code)] // Wired in Increments 4–5 (batch onboarding / oracle payouts).
pub struct FarmerPolicy {
    farmer_address: StorageAddress,
    location_id: StorageString,
    coverage_amount: StorageU256,
    is_active: StorageBool,
}

/// Immutable aid-route checkpoint (Stylus storage).
///
/// Solidity analogue:
/// ```solidity
/// struct AidCheckpoint {
///     bytes32 batchHash;
///     string locationName;
///     uint256 timestamp;
///     bool isFlagged;
/// }
/// ```
#[storage]
#[allow(dead_code)] // Wired in Increment 6 (logistics hashing).
pub struct AidCheckpoint {
    batch_hash: StorageB256,
    location_name: StorageString,
    timestamp: StorageU256,
    is_flagged: StorageBool,
}

/// In-memory / test-friendly view of a farmer policy (not a storage type).
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct FarmerPolicyData {
    pub farmer_address: Address,
    pub location_id: String,
    pub coverage_amount: U256,
    pub is_active: bool,
}

/// In-memory / test-friendly view of an aid checkpoint (not a storage type).
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct AidCheckpointData {
    pub batch_hash: B256,
    pub location_name: String,
    pub timestamp: U256,
    pub is_flagged: bool,
}

/// El Niño Climate Resilience contract state.
///
/// Solidity analogue:
/// ```solidity
/// contract ElNinoResilience {
///     mapping(address => FarmerPolicy) public policies;
///     mapping(bytes32 => AidCheckpoint) public aidBatches;
/// }
/// ```
#[storage]
#[entrypoint]
#[allow(dead_code)] // Public methods land in Increments 4–6.
pub struct ElNinoResilience {
    /// `mapping(address => FarmerPolicy) policies`
    policies: StorageMap<Address, FarmerPolicy>,
    /// `mapping(bytes32 => AidCheckpoint) aid_batches`
    aid_batches: StorageMap<B256, AidCheckpoint>,
}

/// Public ABI surface — intentionally empty until Increments 4–6.
#[public]
impl ElNinoResilience {}

#[cfg(test)]
mod test {
    use super::*;
    use alloy_primitives::address;
    use stylus_sdk::testing::*;

    #[test]
    fn test_in_memory_structs_initialize() {
        let farmer = address!("0x1111111111111111111111111111111111111111");
        let policy = FarmerPolicyData {
            farmer_address: farmer,
            location_id: String::from("PIURA-COOP-01"),
            coverage_amount: U256::from(500_000_000u64), // 500 USDC (6 decimals)
            is_active: true,
        };

        let checkpoint = AidCheckpointData {
            batch_hash: B256::repeat_byte(0xab),
            location_name: String::from("Warehouse A — Piura"),
            timestamp: U256::from(1_720_000_000u64),
            is_flagged: false,
        };

        assert_eq!(policy.farmer_address, farmer);
        assert_eq!(policy.location_id, "PIURA-COOP-01");
        assert_eq!(policy.coverage_amount, U256::from(500_000_000u64));
        assert!(policy.is_active);

        assert_eq!(checkpoint.batch_hash, B256::repeat_byte(0xab));
        assert_eq!(checkpoint.location_name, "Warehouse A — Piura");
        assert!(!checkpoint.is_flagged);
    }

    #[test]
    fn test_storage_mappings_accept_policy_and_checkpoint() {
        let vm = TestVM::default();
        let mut contract = ElNinoResilience::from(&vm);

        let farmer = address!("0x2222222222222222222222222222222222222222");
        {
            let mut policy = contract.policies.setter(farmer);
            policy.farmer_address.set(farmer);
            policy.location_id.set_str("TUMBES-07");
            policy.coverage_amount.set(U256::from(250_000_000u64));
            policy.is_active.set(true);
        }

        let batch = B256::repeat_byte(0xcd);
        {
            let mut checkpoint = contract.aid_batches.setter(batch);
            checkpoint.batch_hash.set(batch);
            checkpoint.location_name.set_str("Checkpoint B — Sullana");
            checkpoint.timestamp.set(U256::from(1_720_000_100u64));
            checkpoint.is_flagged.set(false);
        }

        let policy = contract.policies.getter(farmer);
        assert_eq!(policy.farmer_address.get(), farmer);
        assert_eq!(policy.location_id.get_string(), "TUMBES-07");
        assert_eq!(policy.coverage_amount.get(), U256::from(250_000_000u64));
        assert!(policy.is_active.get());

        let checkpoint = contract.aid_batches.getter(batch);
        assert_eq!(checkpoint.batch_hash.get(), batch);
        assert_eq!(
            checkpoint.location_name.get_string(),
            "Checkpoint B — Sullana"
        );
        assert_eq!(checkpoint.timestamp.get(), U256::from(1_720_000_100u64));
        assert!(!checkpoint.is_flagged.get());
    }
}
