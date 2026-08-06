//! MeleePMM — Single Shared Parimutuel Market Maker (Arbitrum Stylus)
//!
//! Solves classic parimutuel late-capital dilution by recording each buyer's
//! `minimum_return_floor` from pool state **at entry**. If their outcome wins,
//! claim payout is `max(pro_rata, minimum_return_floor)`.

#![cfg_attr(not(any(test, feature = "export-abi")), no_main)]
extern crate alloc;

use alloy_primitives::{Address, U256, U8};
use stylus_sdk::alloy_sol_types::sol;
use stylus_sdk::call::transfer::transfer_eth;
use stylus_sdk::{
    prelude::*,
    storage::{
        StorageAddress, StorageBool, StorageMap, StorageU256, StorageU8,
    },
};

sol! {
    event MarketCreated(uint256 indexed marketId, address indexed creator, uint256 endTimestamp);
    event SharesBought(
        uint256 indexed marketId,
        address indexed buyer,
        uint8 outcomeId,
        uint256 amount,
        uint256 shares,
        uint256 minimumReturnFloor
    );
    event MarketResolved(uint256 indexed marketId, uint8 winningOutcome);
    event WinningsClaimed(
        uint256 indexed marketId,
        address indexed claimer,
        uint256 payout,
        uint256 floor
    );
    event SharesCashedOut(
        uint256 indexed marketId,
        address indexed user,
        uint8 outcomeId,
        uint256 shares,
        uint256 payout
    );
}

/// Outcome 0 = No, Outcome 1 = Yes.
pub const OUTCOME_NO: u8 = 0;
pub const OUTCOME_YES: u8 = 1;

/// Per-outcome liquidity accounting.
#[storage]
pub struct OutcomePool {
    /// ETH deposited into this outcome.
    pool: StorageU256,
    /// Shares outstanding for this outcome (1:1 with ETH for this MVP).
    shares: StorageU256,
}

/// A user's stake on a single outcome inside one market.
#[storage]
pub struct Position {
    /// Shares owned on this outcome.
    shares: StorageU256,
    /// Outcome-pool size immediately after this position's last buy (audit trail).
    entry_pool_state: StorageU256,
    /// Guaranteed minimum ETH payout if this outcome wins (anti-dilution floor).
    minimum_return_floor: StorageU256,
    /// Whether winnings were already withdrawn.
    claimed: StorageBool,
}

/// One parimutuel market hosted by the shared PMM.
#[storage]
pub struct Market {
    creator: StorageAddress,
    end_timestamp: StorageU256,
    resolved: StorageBool,
    winning_outcome: StorageU8,
    total_pool: StorageU256,
    /// outcome_id (0/1) → pool state
    outcomes: StorageMap<U256, OutcomePool>,
    /// user → outcome_id → position
    positions: StorageMap<Address, StorageMap<U256, Position>>,
}

/// Single shared contract hosting many Melee prediction markets.
#[storage]
#[entrypoint]
pub struct MeleePMM {
    /// Auto-incrementing market id (next id to assign).
    market_count: StorageU256,
    /// market_id → Market
    markets: StorageMap<U256, Market>,
    /// Optional global oracle (in addition to each market's creator).
    oracle: StorageAddress,
}

fn err(msg: &str) -> Vec<u8> {
    msg.as_bytes().to_vec()
}

fn require(cond: bool, msg: &str) -> Result<(), Vec<u8>> {
    if cond {
        Ok(())
    } else {
        Err(err(msg))
    }
}

/// Anti-dilution floor at entry:
/// `floor = amount * total_after / outcome_pool_after`
///
/// Interprets the buyer's locked claim as if the market resolved **immediately**
/// after their purchase. Later same-side capital can lower global pro-rata odds,
/// but this floor never decreases. Late opposing capital only improves payouts.
fn compute_entry_floor(amount: U256, total_after: U256, pool_after: U256) -> U256 {
    if amount.is_zero() {
        return U256::ZERO;
    }
    if pool_after.is_zero() {
        return amount;
    }
    amount.saturating_mul(total_after) / pool_after
}

#[public]
impl MeleePMM {
    /// One-time (or oracle-rotated) oracle setter.
    /// Anyone may set while oracle is zero; afterward only the current oracle.
    pub fn set_oracle(&mut self, new_oracle: Address) -> Result<(), Vec<u8>> {
        let caller = self.vm().msg_sender();
        let current = self.oracle.get();
        require(
            current == Address::ZERO || current == caller,
            "not oracle",
        )?;
        require(new_oracle != Address::ZERO, "zero oracle")?;
        self.oracle.set(new_oracle);
        Ok(())
    }

    pub fn get_oracle(&self) -> Address {
        self.oracle.get()
    }

    pub fn market_count(&self) -> U256 {
        self.market_count.get()
    }

    /// Create a new YES/NO market. Returns the new `market_id`.
    pub fn create_market(&mut self, end_timestamp: u64) -> Result<U256, Vec<u8>> {
        let now = U256::from(self.vm().block_timestamp());
        let end = U256::from(end_timestamp);
        require(end > now, "end must be future")?;

        let id = self.market_count.get();
        let creator = self.vm().msg_sender();

        {
            let mut market = self.markets.setter(id);
            market.creator.set(creator);
            market.end_timestamp.set(end);
            market.resolved.set(false);
            market.winning_outcome.set(U8::ZERO);
            market.total_pool.set(U256::ZERO);

            // Initialize both outcome buckets.
            market
                .outcomes
                .setter(U256::from(OUTCOME_NO))
                .pool
                .set(U256::ZERO);
            market
                .outcomes
                .setter(U256::from(OUTCOME_NO))
                .shares
                .set(U256::ZERO);
            market
                .outcomes
                .setter(U256::from(OUTCOME_YES))
                .pool
                .set(U256::ZERO);
            market
                .outcomes
                .setter(U256::from(OUTCOME_YES))
                .shares
                .set(U256::ZERO);
        }

        self.market_count.set(id + U256::from(1));

        self.vm().log(MarketCreated {
            marketId: id,
            creator,
            endTimestamp: end,
        });

        Ok(id)
    }

    /// Payable buy. Mints 1:1 shares and locks an anti-dilution floor from
    /// the pool snapshot at entry (after this deposit).
    #[payable]
    pub fn buy_shares(&mut self, market_id: U256, outcome_id: u8) -> Result<(), Vec<u8>> {
        require(
            outcome_id == OUTCOME_NO || outcome_id == OUTCOME_YES,
            "bad outcome",
        )?;

        let amount = self.vm().msg_value();
        require(amount > U256::ZERO, "zero value")?;

        let buyer = self.vm().msg_sender();
        let now = U256::from(self.vm().block_timestamp());
        let outcome_key = U256::from(outcome_id);

        let (floor, shares_bought, entry_pool) = {
            let market = self.markets.getter(market_id);
            require(market.creator.get() != Address::ZERO, "no market")?;
            require(!market.resolved.get(), "resolved")?;
            require(now < market.end_timestamp.get(), "market ended")?;

            let pool_before = market.outcomes.get(outcome_key).pool.get();
            let total_before = market.total_pool.get();

            let pool_after = pool_before + amount;
            let total_after = total_before + amount;
            let floor = compute_entry_floor(amount, total_after, pool_after);

            (floor, amount, pool_after)
        };

        // Mutate pools + position.
        {
            let mut market = self.markets.setter(market_id);

            let total = market.total_pool.get();
            market.total_pool.set(total + amount);

            {
                let mut outcome = market.outcomes.setter(outcome_key);
                let pool = outcome.pool.get();
                let shares = outcome.shares.get();
                outcome.pool.set(pool + amount);
                outcome.shares.set(shares + shares_bought);
            }

            let mut user_positions = market.positions.setter(buyer);
            let mut position = user_positions.setter(outcome_key);
            let prev_shares = position.shares.get();
            let prev_floor = position.minimum_return_floor.get();

            // Accumulate shares + floors across multiple buys (tranche accounting).
            position.shares.set(prev_shares + shares_bought);
            position.entry_pool_state.set(entry_pool);
            position
                .minimum_return_floor
                .set(prev_floor + floor);
            // claimed stays false unless previously claimed (should be empty).
        }

        self.vm().log(SharesBought {
            marketId: market_id,
            buyer,
            outcomeId: outcome_id,
            amount,
            shares: shares_bought,
            minimumReturnFloor: floor,
        });

        Ok(())
    }

    /// Resolve market. Callable by market creator or global oracle.
    pub fn resolve_market(
        &mut self,
        market_id: U256,
        winning_outcome: u8,
    ) -> Result<(), Vec<u8>> {
        require(
            winning_outcome == OUTCOME_NO || winning_outcome == OUTCOME_YES,
            "bad outcome",
        )?;

        let caller = self.vm().msg_sender();
        let now = U256::from(self.vm().block_timestamp());

        {
            let market = self.markets.getter(market_id);
            require(market.creator.get() != Address::ZERO, "no market")?;
            require(!market.resolved.get(), "already resolved")?;
            require(now >= market.end_timestamp.get(), "too early")?;

            let creator = market.creator.get();
            let oracle = self.oracle.get();
            require(
                caller == creator || (oracle != Address::ZERO && caller == oracle),
                "not authorized",
            )?;
        }

        {
            let mut market = self.markets.setter(market_id);
            market.resolved.set(true);
            market.winning_outcome.set(U8::from(winning_outcome));
        }

        self.vm().log(MarketResolved {
            marketId: market_id,
            winningOutcome: winning_outcome,
        });

        Ok(())
    }

    /// Pre-resolution cashout: redeem the caller's shares 1:1 for ETH and
    /// clear their position (forfeits upside / floor on that outcome).
    pub fn cashout_shares(
        &mut self,
        market_id: U256,
        outcome_id: u8,
    ) -> Result<(), Vec<u8>> {
        require(
            outcome_id == OUTCOME_NO || outcome_id == OUTCOME_YES,
            "bad outcome",
        )?;

        let user = self.vm().msg_sender();
        let outcome_key = U256::from(outcome_id);

        let (shares, payout) = {
            let market = self.markets.getter(market_id);
            require(market.creator.get() != Address::ZERO, "no market")?;
            require(!market.resolved.get(), "resolved")?;

            let user_positions = market.positions.get(user);
            let position = user_positions.get(outcome_key);
            require(!position.claimed.get(), "already claimed")?;
            let shares = position.shares.get();
            require(shares > U256::ZERO, "no shares")?;

            // 1:1 mint ⇒ redeem stake; user forgoes resolution upside.
            let payout = shares;
            let outcome = market.outcomes.get(outcome_key);
            let outcome_pool = outcome.pool.get();
            let outcome_shares = outcome.shares.get();
            let total = market.total_pool.get();
            require(outcome_pool >= payout, "pool underflow")?;
            require(outcome_shares >= shares, "shares underflow")?;
            require(total >= payout, "total underflow")?;

            (shares, payout)
        };

        {
            let mut market = self.markets.setter(market_id);

            let total = market.total_pool.get();
            market.total_pool.set(total - payout);

            {
                let mut outcome = market.outcomes.setter(outcome_key);
                let pool = outcome.pool.get();
                let o_shares = outcome.shares.get();
                outcome.pool.set(pool - payout);
                outcome.shares.set(o_shares - shares);
            }

            let mut user_positions = market.positions.setter(user);
            let mut position = user_positions.setter(outcome_key);
            position.shares.set(U256::ZERO);
            position.minimum_return_floor.set(U256::ZERO);
            position.entry_pool_state.set(U256::ZERO);
        }

        if payout > U256::ZERO {
            transfer_eth(self.vm(), user, payout)?;
        }

        self.vm().log(SharesCashedOut {
            marketId: market_id,
            user,
            outcomeId: outcome_id,
            shares,
            payout,
        });

        Ok(())
    }

    /// Claim winnings for the winning outcome.
    /// Payout = max(pro_rata_share_of_total_pool, minimum_return_floor).
    pub fn claim_winnings(&mut self, market_id: U256) -> Result<(), Vec<u8>> {
        let claimer = self.vm().msg_sender();

        let (payout, floor, shares) = {
            let market = self.markets.getter(market_id);
            require(market.resolved.get(), "not resolved")?;

            let winning = U256::from(market.winning_outcome.get());
            let user_positions = market.positions.get(claimer);
            let position = user_positions.get(winning);
            require(!position.claimed.get(), "already claimed")?;

            let shares = position.shares.get();
            require(shares > U256::ZERO, "no winning shares")?;

            let floor = position.minimum_return_floor.get();
            let win_pool = market.outcomes.get(winning).pool.get();
            let total = market.total_pool.get();

            let pro_rata = if win_pool.is_zero() {
                U256::ZERO
            } else {
                shares.saturating_mul(total) / win_pool
            };

            // Anti-dilution: never pay less than the entry-time floor.
            let payout = if pro_rata > floor { pro_rata } else { floor };
            (payout, floor, shares)
        };

        require(shares > U256::ZERO, "no shares")?;

        {
            let mut market = self.markets.setter(market_id);
            let winning = U256::from(market.winning_outcome.get());
            let mut user_positions = market.positions.setter(claimer);
            let mut position = user_positions.setter(winning);
            position.claimed.set(true);
            // Zero shares to prevent re-entrancy style double accounting.
            position.shares.set(U256::ZERO);
        }

        if payout > U256::ZERO {
            transfer_eth(self.vm(), claimer, payout)?;
        }

        self.vm().log(WinningsClaimed {
            marketId: market_id,
            claimer,
            payout,
            floor,
        });

        Ok(())
    }

    // ─── Views ───────────────────────────────────────────────────────────

    pub fn get_market(
        &self,
        market_id: U256,
    ) -> (Address, U256, bool, u8, U256, U256, U256) {
        let market = self.markets.get(market_id);
        let yes = market.outcomes.get(U256::from(OUTCOME_YES)).pool.get();
        let no = market.outcomes.get(U256::from(OUTCOME_NO)).pool.get();
        (
            market.creator.get(),
            market.end_timestamp.get(),
            market.resolved.get(),
            market.winning_outcome.get().to::<u8>(),
            market.total_pool.get(),
            yes,
            no,
        )
    }

    pub fn get_position(
        &self,
        market_id: U256,
        user: Address,
        outcome_id: u8,
    ) -> (U256, U256, U256, bool) {
        let market = self.markets.get(market_id);
        let user_positions = market.positions.get(user);
        let position = user_positions.get(U256::from(outcome_id));
        (
            position.shares.get(),
            position.entry_pool_state.get(),
            position.minimum_return_floor.get(),
            position.claimed.get(),
        )
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use stylus_sdk::testing::*;

    fn future_ts(vm: &TestVM) -> u64 {
        vm.block_timestamp() + 86_400
    }

    #[test]
    fn create_and_buy_sets_floor() {
        let vm = TestVM::default();
        let mut c = MeleePMM::from(&vm);

        let id = c.create_market(future_ts(&vm)).unwrap();
        assert_eq!(id, U256::ZERO);

        vm.set_value(U256::from(100));
        c.buy_shares(id, OUTCOME_YES).unwrap();

        let (shares, entry_pool, floor, claimed) =
            c.get_position(id, vm.msg_sender(), OUTCOME_YES);
        assert_eq!(shares, U256::from(100));
        assert_eq!(entry_pool, U256::from(100));
        // Alone in pool: floor = 100 * 100 / 100 = 100
        assert_eq!(floor, U256::from(100));
        assert!(!claimed);
    }

    #[test]
    fn late_same_side_capital_does_not_reduce_early_floor() {
        let vm = TestVM::default();
        let mut c = MeleePMM::from(&vm);
        let id = c.create_market(future_ts(&vm)).unwrap();

        // Early buyer
        vm.set_value(U256::from(100));
        c.buy_shares(id, OUTCOME_YES).unwrap();
        let early_floor = c.get_position(id, vm.msg_sender(), OUTCOME_YES).2;

        // Opposing liquidity improves odds context
        // (simulate another account by just buying No from same test sender —
        //  floors are per-outcome, so Yes floor stays.)
        vm.set_value(U256::from(100));
        c.buy_shares(id, OUTCOME_NO).unwrap();

        // Late same-side capital
        vm.set_value(U256::from(800));
        c.buy_shares(id, OUTCOME_YES).unwrap();

        let (_, _, floor_after, _) = c.get_position(id, vm.msg_sender(), OUTCOME_YES);
        // Early tranche floor (100) must still be included in accumulated floor.
        assert!(floor_after >= early_floor);
    }

    #[test]
    fn resolve_and_claim_respects_floor() {
        let vm = TestVM::default();
        let mut c = MeleePMM::from(&vm);
        let end = future_ts(&vm);
        let id = c.create_market(end).unwrap();

        vm.set_value(U256::from(50));
        c.buy_shares(id, OUTCOME_YES).unwrap();
        vm.set_value(U256::from(50));
        c.buy_shares(id, OUTCOME_NO).unwrap();

        vm.set_block_timestamp(end);
        c.resolve_market(id, OUTCOME_YES).unwrap();

        let before = c.get_position(id, vm.msg_sender(), OUTCOME_YES);
        assert!(before.2 > U256::ZERO); // floor

        c.claim_winnings(id).unwrap();
        let after = c.get_position(id, vm.msg_sender(), OUTCOME_YES);
        assert!(after.3); // claimed
        assert_eq!(after.0, U256::ZERO);
    }

    #[test]
    fn cashout_shares_redeems_pre_resolution() {
        let vm = TestVM::default();
        let mut c = MeleePMM::from(&vm);
        let id = c.create_market(future_ts(&vm)).unwrap();

        vm.set_value(U256::from(100));
        c.buy_shares(id, OUTCOME_YES).unwrap();

        c.cashout_shares(id, OUTCOME_YES).unwrap();

        let (shares, _, floor, _) = c.get_position(id, vm.msg_sender(), OUTCOME_YES);
        assert_eq!(shares, U256::ZERO);
        assert_eq!(floor, U256::ZERO);

        let market = c.get_market(id);
        assert_eq!(market.4, U256::ZERO); // total_pool
        assert_eq!(market.5, U256::ZERO); // yes pool
    }
}
