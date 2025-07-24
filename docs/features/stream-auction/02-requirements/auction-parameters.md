# Auction Parameters

This document defines the parameters and rules for stream auctions created from memes wave redirects.

## Core Parameters

### Starting Price
**Value**: 0.1 ETH  
**Set By**: Smart contract configuration  
**Changeable**: Only by contract admins for future auctions  
**Rationale**: Low enough to encourage participation, high enough to be meaningful

### Auction Duration  
**Value**: 24 hours  
**Set By**: Smart contract configuration  
**Changeable**: Only by contract admins for future auctions  
**Rationale**: Balances urgency with giving all time zones opportunity to participate

### Minimum Bid Increment
**Calculation**: 10% of current bid  
**Rounding**: Increasingly aggressive at higher values
- Under 1 ETH: Round to 0.05 ETH
- 1-10 ETH: Round to 0.1 ETH  
- 10-100 ETH: Round to 0.5 ETH
- Over 100 ETH: Round to 1 ETH
**Rationale**: Prevents micro-bidding while keeping increments reasonable

## Bidding Mechanics

### Bid Replacement
- Only one active bid per user per auction
- New bid must exceed current highest by minimum increment
- Previous bid automatically refunded when outbid
- No bid history maintained (only current highest)

### Automatic Refunds
When outbid, the previous bidder:
- Receives immediate ETH refund
- Gets single notification
- No longer has active bid
- Must actively re-bid to participate again

### End of Auction
- Auctions end exactly 24 hours after start
- No extensions for last-minute bids
- Winner must claim NFT (not automatic)
- No time limit on claiming

## Settlement Process

### For Winners
1. Auction ends with them as highest bidder
2. Receive notification to claim
3. Execute claim transaction
4. NFT transferred to wallet
5. Creator receives payment

### For Creators
1. Payment sent automatically on claim
2. Platform fee deducted (if any)
3. Royalties set for secondary sales
4. Transaction recorded on-chain

### Failed Auctions
**Scenario**: No bids received  
**Current Approach**: Manual handling
- Auction expires without winner
- Team contacts creator for next steps
- Options may include re-listing or return to wave

## Contract Configuration

### Adjustable by Admins
```solidity
contract StreamAuctions {
    uint256 public defaultStartingPrice = 0.1 ether;
    uint256 public defaultDuration = 24 hours;
    uint256 public minBidIncrementBps = 1000; // 10%
    
    // Only admins can update these
    function setDefaultStartingPrice(uint256 _price) external onlyAdmin {
        defaultStartingPrice = _price;
    }
}
```

### Fixed Parameters
- Collection ID: Set at deployment
- Royalty structure: Hardcoded in contract
- Platform fee: Contract-level constant

## Special Considerations

### Gas Optimization
- Refunds processed in same transaction as new bid
- Claim separated from bidding to reduce gas
- Events emitted for indexing

### Security Features  
- Reentrancy guards on all bid functions
- Pull pattern for claims
- Overflow protection on calculations

### Edge Cases Handled
1. **Bid at exact end time**: Timestamp comparison determines inclusion
2. **Multiple bids same block**: First in block wins
3. **Contract paused**: All bids rejected, existing refunded
4. **Creator is bidder**: Allowed but not recommended

## Future Considerations

### Potential Enhancements
- Dynamic duration based on activity
- Reserve prices (currently not supported)
- Buy-it-now prices
- Batch auctions for multiple items

### Upgrade Path
- Parameters adjustable without contract upgrade
- New features require contract deployment
- Backwards compatibility maintained

---

[Back to decisions →](decisions.md)  
[See technical implementation →](../04-technical/smart-contracts/integration.md)  
[Understand eligibility →](eligibility.md)