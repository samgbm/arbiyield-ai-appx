//! El Niño Climate Resilience — Arbitrum Stylus core
//!
//! Holds parametric farmer insurance policies and immutable aid-logistics
//! checkpoint hashes. Increment 4 adds batch farmer registration.

#![cfg_attr(not(any(test, feature = "export-abi")), no_main)]
extern crate alloc;

use alloc::{string::String, vec::Vec};

use alloy_primitives::{Address, B256, U256};
use stylus_sdk::{
    prelude::*,
    storage::{
        StorageAddress, StorageB256, StorageBool, StorageMap, StorageString,
        StorageU256,
    },
};

/// Parametric insurance policy for a single farmer (Stylus storage).
#[storage]
pub struct FarmerPolicy {
    farmer_address: StorageAddress,
    location_id: StorageString,
    coverage_amount: StorageU256,
    is_active: StorageBool,
}

/// Immutable aid-route checkpoint (Stylus storage).
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
#[storage]
#[entrypoint]
pub struct ElNinoResilience {
    /// `mapping(address => FarmerPolicy) policies`
    policies: StorageMap<Address, FarmerPolicy>,
    /// `mapping(bytes32 => AidCheckpoint) aid_batches`
    #[allow(dead_code)] // Wired in Increment 6.
    aid_batches: StorageMap<B256, AidCheckpoint>,
}

fn err(msg: &str) -> Vec<u8> {
    msg.as_bytes().to_vec()
}

/// External ABI surface (`#[public]` is Stylus SDK 0.10's equivalent of `#[external]`).
#[public]
impl ElNinoResilience {
    /// Register many farmers in a single Stylus transaction (Walkthrough 2 / NFR-3).
    ///
    /// Parallel arrays must share the same length; each farmer gets an active policy.
    pub fn batch_register_farmers(
        &mut self,
        farmers: Vec<Address>,
        locations: Vec<String>,
        coverage_amounts: Vec<U256>,
    ) -> Result<(), Vec<u8>> {
        if farmers.len() != locations.len() || farmers.len() != coverage_amounts.len() {
            return Err(err(
                "batch_register_farmers: farmers, locations, and coverage_amounts length mismatch",
            ));
        }

        for (i, farmer) in farmers.iter().enumerate() {
            let location = &locations[i];
            let coverage = coverage_amounts[i];

            let mut policy = self.policies.setter(*farmer);
            policy.farmer_address.set(*farmer);
            policy.location_id.set_str(location);
            policy.coverage_amount.set(coverage);
            policy.is_active.set(true);
        }

        Ok(())
    }

    /// View a farmer's policy as `(location_id, coverage_amount, is_active)`.
    pub fn get_policy(&self, farmer: Address) -> (String, U256, bool) {
        let policy = self.policies.getter(farmer);
        (
            policy.location_id.get_string(),
            policy.coverage_amount.get(),
            policy.is_active.get(),
        )
    }
}

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
            coverage_amount: U256::from(500_000_000u64),
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
    fn test_batch_register() {
        let vm = TestVM::default();
        let mut contract = ElNinoResilience::from(&vm);

        let farmers = alloc::vec![
            address!("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"),
            address!("0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"),
            address!("0xcccccccccccccccccccccccccccccccccccccccc"),
        ];
        let locations = alloc::vec![
            String::from("PIURA-01"),
            String::from("TUMBES-02"),
            String::from("LAMBAYEQUE-03"),
        ];
        let coverage_amounts = alloc::vec![
            U256::from(100_000_000u64),
            U256::from(200_000_000u64),
            U256::from(300_000_000u64),
        ];

        contract
            .batch_register_farmers(
                farmers.clone(),
                locations.clone(),
                coverage_amounts.clone(),
            )
            .expect("batch register should succeed");

        let (location, coverage, active) = contract.get_policy(farmers[1]);
        assert_eq!(location, locations[1]);
        assert_eq!(coverage, coverage_amounts[1]);
        assert!(active);

        // Spot-check the other two slots as well.
        let (loc0, cov0, active0) = contract.get_policy(farmers[0]);
        assert_eq!(loc0, "PIURA-01");
        assert_eq!(cov0, U256::from(100_000_000u64));
        assert!(active0);

        let (loc2, cov2, active2) = contract.get_policy(farmers[2]);
        assert_eq!(loc2, "LAMBAYEQUE-03");
        assert_eq!(cov2, U256::from(300_000_000u64));
        assert!(active2);
    }

    #[test]
    fn test_batch_register_length_mismatch_reverts() {
        let vm = TestVM::default();
        let mut contract = ElNinoResilience::from(&vm);

        let err = contract
            .batch_register_farmers(
                alloc::vec![address!("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")],
                alloc::vec![String::from("PIURA-01"), String::from("EXTRA")],
                alloc::vec![U256::from(1u64)],
            )
            .expect_err("mismatched vector lengths must revert");

        assert!(
            String::from_utf8_lossy(&err).contains("length mismatch"),
            "unexpected error: {}",
            String::from_utf8_lossy(&err)
        );
    }

    #[test]
    fn test_batch_register_fifty_farmers() {
        let vm = TestVM::default();
        let mut contract = ElNinoResilience::from(&vm);

        let n = 50usize;
        let mut farmers = Vec::with_capacity(n);
        let mut locations = Vec::with_capacity(n);
        let mut coverage_amounts = Vec::with_capacity(n);

        for i in 0..n {
            let mut bytes = [0u8; 20];
            bytes[16..].copy_from_slice(&(i as u32).to_be_bytes());
            farmers.push(Address::from(bytes));
            locations.push(alloc::format!("ZONE-{i:03}"));
            coverage_amounts.push(U256::from(1_000_000u64 * (i as u64 + 1)));
        }

        contract
            .batch_register_farmers(farmers.clone(), locations.clone(), coverage_amounts.clone())
            .expect("50-farmer batch should succeed");

        let mid = 25usize;
        let (location, coverage, active) = contract.get_policy(farmers[mid]);
        assert_eq!(location, locations[mid]);
        assert_eq!(coverage, coverage_amounts[mid]);
        assert!(active);
    }
}
