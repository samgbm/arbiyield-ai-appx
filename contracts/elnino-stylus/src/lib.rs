//! El Niño Climate Resilience — Arbitrum Stylus core
//!
//! Holds parametric farmer insurance policies and immutable aid-logistics
//! checkpoint hashes. Increment 6 adds tamper-proof logistics provenance.

#![cfg_attr(not(any(test, feature = "export-abi")), no_main)]
extern crate alloc;

use alloc::{string::String, vec::Vec};

use alloy_primitives::{Address, B256, U256};
use stylus_sdk::alloy_sol_types::sol;
use stylus_sdk::{
    prelude::*,
    storage::{
        StorageAddress, StorageB256, StorageBool, StorageMap, StorageString,
        StorageU256, StorageVec,
    },
};

/// Designated Climate Data Relayer / admin (MetaMask Arbitrum Sepolia).
pub const CLIMATE_RELAYER_ADMIN: Address = alloy_primitives::address!(
    "0xca76951A11A9adE6553ef54AB1d1260f08c3460d"
);

/// Severe flood threshold in millimeters (ENFEN / SENAMHI style feed).
pub const FLOOD_THRESHOLD_MM: u64 = 50;

sol! {
    /// Emitted when a farmer's parametric coverage is disbursed (simulated USDC).
    event PayoutDisbursed(address indexed farmer, string location, uint256 amount);
    /// Emitted when an aid shipment checkpoint hash is sealed on-chain.
    event AidCheckpointLogged(bytes32 indexed batch_hash, string location, uint256 timestamp);
}

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
    /// Authorized climate-data relayer (admin).
    admin: StorageAddress,
    /// `mapping(address => FarmerPolicy) policies`
    policies: StorageMap<Address, FarmerPolicy>,
    /// Iterable registry of registered farmer addresses (mappings alone are not iterable).
    farmer_ids: StorageVec<StorageAddress>,
    /// `mapping(bytes32 => AidCheckpoint) aid_batches`
    aid_batches: StorageMap<B256, AidCheckpoint>,
}

fn err(msg: &str) -> Vec<u8> {
    msg.as_bytes().to_vec()
}

/// External ABI surface (`#[public]` is Stylus SDK 0.10's equivalent of `#[external]`).
#[public]
impl ElNinoResilience {
    /// One-time init: lock in the designated Climate Data Relayer admin address.
    pub fn initialize(&mut self) -> Result<(), Vec<u8>> {
        if self.admin.get() != Address::ZERO {
            return Err(err("already initialized"));
        }
        self.admin.set(CLIMATE_RELAYER_ADMIN);
        Ok(())
    }

    /// Returns the authorized climate relayer / admin.
    pub fn get_admin(&self) -> Address {
        self.admin.get()
    }

    /// Register many farmers in a single Stylus transaction (Walkthrough 2 / NFR-3).
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

            let already_tracked = {
                let existing = self.policies.getter(*farmer);
                !existing.location_id.get_string().is_empty()
                    || existing.is_active.get()
                    || existing.coverage_amount.get() != U256::ZERO
            };

            {
                let mut policy = self.policies.setter(*farmer);
                policy.farmer_address.set(*farmer);
                policy.location_id.set_str(location);
                policy.coverage_amount.set(coverage);
                policy.is_active.set(true);
            }

            if !already_tracked {
                self.farmer_ids.push(*farmer);
            }
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

    /// Climate Data Relay: if regional rainfall meets the flood threshold, disburse
    /// coverage to every active farmer at that `location_id` (zero-click payout).
    ///
    /// Returns the number of farmers paid. ERC-20 transfer is simulated via
    /// `PayoutDisbursed` + deactivating the policy (prevents double payouts).
    pub fn process_climate_relay(
        &mut self,
        location_id: String,
        rainfall_mm: U256,
    ) -> Result<U256, Vec<u8>> {
        self.require_admin()?;

        if rainfall_mm < U256::from(FLOOD_THRESHOLD_MM) {
            return Err(err("Threshold not met"));
        }

        let mut paid_count = U256::ZERO;
        let n = self.farmer_ids.len();

        for i in 0..n {
            let Some(farmer) = self.farmer_ids.get(i) else {
                continue;
            };

            let (policy_location, coverage, is_active) = {
                let policy = self.policies.getter(farmer);
                (
                    policy.location_id.get_string(),
                    policy.coverage_amount.get(),
                    policy.is_active.get(),
                )
            };

            if !is_active || policy_location != location_id {
                continue;
            }

            {
                let mut policy = self.policies.setter(farmer);
                policy.is_active.set(false);
            }

            self.vm().log(PayoutDisbursed {
                farmer,
                location: policy_location,
                amount: coverage,
            });

            paid_count += U256::from(1);
        }

        Ok(paid_count)
    }

    /// Seal an aid-route checkpoint hash (Walkthrough 1 / NFR-1 immutability).
    ///
    /// Reverts if `batch_hash` was already logged — historical provenance cannot
    /// be overwritten. Timestamp is taken from the EVM block clock via the Stylus VM.
    pub fn log_aid_checkpoint(
        &mut self,
        batch_hash: B256,
        location_name: String,
    ) -> Result<(), Vec<u8>> {
        let existing_ts = self.aid_batches.getter(batch_hash).timestamp.get();
        if existing_ts > U256::ZERO {
            return Err(err(
                "log_aid_checkpoint: batch_hash already logged (immutable)",
            ));
        }

        let timestamp = U256::from(self.vm().block_timestamp());

        {
            let mut checkpoint = self.aid_batches.setter(batch_hash);
            checkpoint.batch_hash.set(batch_hash);
            checkpoint.location_name.set_str(&location_name);
            checkpoint.timestamp.set(timestamp);
            checkpoint.is_flagged.set(false);
        }

        self.vm().log(AidCheckpointLogged {
            batch_hash,
            location: location_name,
            timestamp,
        });

        Ok(())
    }

    /// QR / UI verification: `(location_name, timestamp, is_flagged)`.
    pub fn verify_aid_batch(&self, batch_hash: B256) -> (String, U256, bool) {
        let checkpoint = self.aid_batches.getter(batch_hash);
        (
            checkpoint.location_name.get_string(),
            checkpoint.timestamp.get(),
            checkpoint.is_flagged.get(),
        )
    }

    /// Mark a shipment as compromised / route-deviated (admin / automated flagger).
    pub fn flag_aid_batch(&mut self, batch_hash: B256) -> Result<(), Vec<u8>> {
        self.require_admin()?;

        let existing_ts = self.aid_batches.getter(batch_hash).timestamp.get();
        if existing_ts == U256::ZERO {
            return Err(err("flag_aid_batch: unknown batch_hash"));
        }

        let mut checkpoint = self.aid_batches.setter(batch_hash);
        checkpoint.is_flagged.set(true);
        Ok(())
    }
}

impl ElNinoResilience {
    fn require_admin(&self) -> Result<(), Vec<u8>> {
        let admin = self.admin.get();
        if admin == Address::ZERO {
            return Err(err("contract not initialized"));
        }
        if self.vm().msg_sender() != admin {
            return Err(err("unauthorized relayer"));
        }
        Ok(())
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use alloy_primitives::address;
    use stylus_sdk::testing::*;

    fn setup_initialized(vm: &TestVM) -> ElNinoResilience {
        let mut contract = ElNinoResilience::from(vm);
        vm.set_sender(CLIMATE_RELAYER_ADMIN);
        contract.initialize().expect("initialize");
        contract
    }

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
        assert!(policy.is_active);
        assert_eq!(checkpoint.batch_hash, B256::repeat_byte(0xab));
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

        assert!(String::from_utf8_lossy(&err).contains("length mismatch"));
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

    #[test]
    fn test_climate_relay_trigger() {
        let vm = TestVM::default();
        let mut contract = setup_initialized(&vm);

        let farmer = address!("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
        // 100 USDC with 6 decimals.
        let coverage = U256::from(100_000_000u64);

        contract
            .batch_register_farmers(
                alloc::vec![farmer],
                alloc::vec![String::from("Piura")],
                alloc::vec![coverage],
            )
            .expect("register Piura farmer");

        // Action 1 — below flood threshold.
        let below = contract
            .process_climate_relay(String::from("Piura"), U256::from(30))
            .expect_err("30mm should fail threshold");
        assert!(
            String::from_utf8_lossy(&below).contains("Threshold not met"),
            "unexpected: {}",
            String::from_utf8_lossy(&below)
        );

        let (_, _, still_active) = contract.get_policy(farmer);
        assert!(still_active, "policy must stay active when threshold fails");

        // Action 2 — severe rainfall (85mm).
        let paid = contract
            .process_climate_relay(String::from("Piura"), U256::from(85))
            .expect("85mm should trigger payouts");
        assert_eq!(paid, U256::from(1));

        let (location, amount, active) = contract.get_policy(farmer);
        assert_eq!(location, "Piura");
        assert_eq!(amount, coverage);
        assert!(!active, "policy must deactivate after payout");
    }

    #[test]
    fn test_climate_relay_rejects_unauthorized_caller() {
        let vm = TestVM::default();
        let mut contract = setup_initialized(&vm);

        let farmer = address!("0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb");
        contract
            .batch_register_farmers(
                alloc::vec![farmer],
                alloc::vec![String::from("Piura")],
                alloc::vec![U256::from(100_000_000u64)],
            )
            .unwrap();

        vm.set_sender(address!("0x1111111111111111111111111111111111111111"));
        let err = contract
            .process_climate_relay(String::from("Piura"), U256::from(85))
            .expect_err("spoofed relayer must fail");
        assert!(String::from_utf8_lossy(&err).contains("unauthorized"));
    }

    #[test]
    fn test_aid_logistics_tracker() {
        let vm = TestVM::default();
        // TestVM defaults timestamp to 0; set a realistic block time for provenance.
        vm.set_block_timestamp(1_720_000_000);
        let mut contract = setup_initialized(&vm);

        // Deterministic SHA-256-style payload for the QR / bag seal.
        let batch_hash = B256::from([
            0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88, 0x99, 0xaa, 0xbb, 0xcc, 0xdd, 0xee,
            0xff, 0x00, 0x10, 0x20, 0x30, 0x40, 0x50, 0x60, 0x70, 0x80, 0x90, 0xa0, 0xb0, 0xc0,
            0xd0, 0xe0, 0xf0, 0x01,
        ]);

        // Action 1 — log checkpoint at Lima Port.
        contract
            .log_aid_checkpoint(batch_hash, String::from("Lima Port"))
            .expect("first log should succeed");

        // Action 2 — verify provenance.
        let (location, timestamp, flagged) = contract.verify_aid_batch(batch_hash);
        assert_eq!(location, "Lima Port");
        assert!(timestamp > U256::ZERO);
        assert!(!flagged);

        // Immutability — second log with same hash must revert.
        let overwrite = contract
            .log_aid_checkpoint(batch_hash, String::from("Piura Warehouse"))
            .expect_err("overwrite must revert");
        assert!(
            String::from_utf8_lossy(&overwrite).contains("immutable"),
            "unexpected: {}",
            String::from_utf8_lossy(&overwrite)
        );

        // Action 3 — admin flags compromised shipment.
        contract
            .flag_aid_batch(batch_hash)
            .expect("admin flag should succeed");

        // Action 4 — verify flagged state.
        let (location2, timestamp2, flagged2) = contract.verify_aid_batch(batch_hash);
        assert_eq!(location2, "Lima Port");
        assert_eq!(timestamp2, timestamp);
        assert!(flagged2);
    }
}
