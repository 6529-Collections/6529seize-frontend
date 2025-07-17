# Decisions & Requirements Tracking

This document consolidates all decisions about the stream auction feature, organized by status.

## Decision Status System

- **✅ DECIDED**: Finalized and ready for implementation
- **🔄 DEFERRED**: Postponed with clear rationale and fallback approach  
- **❓ OPEN**: Still needs stakeholder input

---

## ✅ DECIDED

### Auction Parameter Control
**Decision**: Contract-level configuration  
**Details**: Starting price and duration are set at the smart contract level by contract admins  
**Rationale**: Ensures consistency across all auctions and eliminates user decision complexity  
**Implementation**: 
- Starting price: 0.1 ETH (configured in contract)
- Duration: 24 hours (configured in contract)
- No user input required during redirect
- Contract admins can update for future auctions

### Redirect Permanence
**Decision**: No cancellation after redirect  
**Details**: Once a user confirms redirect, the decision is final and irreversible  
**Rationale**: 
- Simplifies system implementation
- Encourages thoughtful decision-making
- Eliminates complex vote restoration logic
**User Impact**: Clear warning in confirmation modal

### Eligibility Persistence
**Decision**: Once eligible, always eligible  
**Details**: Achieving eligibility is permanent - it never expires or gets lost  
**Rationale**: 
- Rewards achievement
- Reduces user anxiety
- Simplifies tracking logic

### Collection Management
**Decision**: Dedicated collection within Stream for memes wave auctions  
**Details**: Create "Memes Wave Auctions" collection within Stream architecture  
**Rationale**: 
- Preserves memes identity
- Maintains stream integration
- Creates focused collecting experience
**Dependencies**: Smart contract team to create new collection

### Discovery & Navigation  
**Decision**: Collections integration as primary discovery mechanism  
**Details**: 
- Primary access through Collections section (`/collections/stream-auctions`)
- Active auctions carousel on index page
- Contextual links from memes drops
**Rationale**: Leverages existing user mental models for NFT browsing

### Error Handling Strategy
**Decision**: Manual intervention with pending state  
**Process**: 
1. Immediate leaderboard removal
2. Auction enters pending state  
3. Team member contacts creator via DM
4. Manual verification and setup (1-3 days)
**Rationale**: Balances automation with quality control

### Data Consistency
**Decision**: Immediate atomic redirect operation  
**Details**: 
- Drop immediately removed from leaderboard
- Votes refunded to all voters
- No intermediate states
**Technical**: Single database transaction ensures consistency

### Notification Integration
**Decision**: Dedicated notification types for all auction events  
**Implementation**: New `ApiNotificationCause` enum values for:
- Eligibility achieved
- Bid received
- Outbid alerts  
- Auction ending
- Auction won
- New auctions from followed creators

### Mobile Experience
**Decision**: Native touch-optimized experience  
**Key Features**:
- Dynamic bid increment buttons
- Single-tap rebidding from notifications
- Streamlined wallet connection handling
**Rationale**: Mobile users need speed for competitive bidding

---

## 🔄 DEFERRED

### Voting Thresholds
**Status**: DEFERRED  
**Reason**: Requires analysis of existing memes wave data and user behavior patterns  
**Timeline**: Phase 2 - after initial implementation and data collection  
**Fallback**: 100 votes over 7 days with 3.5+ average rating  
**Dependencies**: 
- Historical voting data analysis
- A/B testing framework
**Next Steps**: 
1. Analyze voting patterns
2. Define test groups
3. Implement measurement

### Eligibility Timing  
**Status**: DEFERRED  
**Reason**: Timing parameters depend on voting threshold decisions  
**Timeline**: Phase 2 - concurrent with voting threshold analysis  
**Fallback**: 
- Eligibility checks start 24 hours after submission
- No deadline to decide on redirect
**Dependencies**: Voting threshold decisions, user research

### Permission Management
**Status**: DEFERRED  
**Reason**: Requires security review and operational procedures  
**Timeline**: Phase 1 - must be resolved before backend implementation  
**Fallback**: 
- Use existing tdhSigner from Stream
- Maintain current admin structure
- Manual contract upgrades via multisig
**Dependencies**: Security audit, operational runbook

### Performance & Caching
**Status**: DEFERRED  
**Reason**: Need production load patterns to optimize  
**Timeline**: Phase 3 - after production deployment  
**Fallback**: 
- Static metadata: 1-hour cache
- Dynamic state: 1-minute cache  
- WebSocket for real-time updates
**Dependencies**: Load testing, monitoring setup

---

## ❓ OPEN QUESTIONS

### Business Questions

1. **Auction Reserve Prices**
   - Should we allow reserve prices?
   - If yes, who sets them?
   - Impact on auction dynamics?

2. **Creator Royalties**
   - Royalty percentage for secondary sales?
   - How to enforce on-chain?
   - Split with platform?

3. **Promotion Tools**
   - Can creators promote their auctions?
   - Integration with social platforms?
   - Featured auction slots?

### Technical Questions

4. **Webhook Requirements**
   - Which external systems need webhooks?
   - Real-time vs batch updates?
   - Retry strategies?

5. **Analytics Tracking**
   - What metrics to track?
   - Privacy considerations?
   - Dashboard requirements?

### UX Questions  

6. **Auction Extensions**
   - Last-minute bid extensions?
   - How long to extend?
   - User expectations?

7. **Failed Auction Handling**
   - What if no bids received?
   - Return to memes wave?
   - Try again options?

---

## Decision Log

### Recent Updates
- **2024-01-15**: Decided on contract-level auction parameters
- **2024-01-14**: Confirmed no redirect cancellation
- **2024-01-13**: Deferred voting thresholds pending analysis

### Upcoming Decisions Needed
1. Reserve price policy (by Phase 1)
2. Webhook architecture (by Phase 2)  
3. Analytics requirements (by Phase 2)

---

[Back to README →](../README.md)  
[See eligibility details →](eligibility.md)  
[Review auction parameters →](auction-parameters.md)