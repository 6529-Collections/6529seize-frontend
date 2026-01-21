# Smart Contract Integration

This document provides comprehensive technical documentation for integrating with the 6529 Stream Auction smart contracts, including detailed function specifications, event handling, and security considerations.

## Contract Architecture

The auction system consists of four main contracts working together:

```
StreamDrops (Entry Point)
    ↓
StreamMinter (Token Creation)
    ↓
StreamCore (ERC721 Implementation)
    ↓
StreamAuctions (Auction Logic)
```

### Contract Relationships

- **StreamDrops**: Creates drops (auctions/sales) via `mintDrop()` - only accessible by `tdhSigner`
- **StreamMinter**: Handles token minting and auction initialization via `mintAndAuction()`
- **StreamCore**: ERC721 contract that manages NFT collections and tokens
- **StreamAuctions**: Manages bidding, time extensions, and auction claims
- **StreamAdmins**: Permission management for all administrative functions

### Contract Addresses
```typescript
// Mainnet addresses (to be provided)
const STREAM_CONTRACTS = {
  STREAM_CORE: "0x...",      // Core stream functionality
  STREAM_MINTER: "0x...",    // Minting permissions
  STREAM_DROPS: "0x...",     // Drop creation
  STREAM_AUCTIONS: "0x...",  // Auction logic
  STREAM_ADMINS: "0x..."     // Admin functions
};

// Testnet addresses for development
const TESTNET_CONTRACTS = {
  STREAM_CORE: "0x...",
  STREAM_MINTER: "0x...",
  STREAM_DROPS: "0x...",
  STREAM_AUCTIONS: "0x...",
  STREAM_ADMINS: "0x..."
};
```

## Contract Interfaces

### StreamAuctions Contract

#### Events

```solidity
event Participate(address indexed _add, uint256 indexed tokenid, uint256 indexed bid)
```
- **Purpose**: Emitted when a bid is placed
- **Parameters**: `_add` (bidder), `tokenid`, `bid` (amount)
- **Filter Usage**: All parameters indexed for efficient filtering

```solidity
event ClaimAuction(uint256 indexed tokenid, uint256 indexed bid)
```
- **Purpose**: Emitted when auction is successfully claimed
- **Note**: NOT emitted for no-bid auctions

#### Core Functions

```solidity
function participateToAuction(uint256 _tokenid) public payable
```
- **Purpose**: Place a bid on an active auction
- **Requirements**: 
  - Auction must be active
  - Bid ≥ starting price (first) or current + 5%
- **Effects**: 
  - Refunds previous bidder automatically
  - Extends auction by 5 min if bid in final 5 min
- **Gas**: ~200,000 recommended

```solidity
function claimAuction(uint256 _tokenid) public nonReentrant
```
- **Purpose**: Finalize auction and distribute funds/NFT
- **Requirements**: 
  - Auction ended
  - Not already claimed
- **Fund Distribution**: 
  - 50% to poster
  - 25% to platform
  - 25% to curators
- **Gas**: ~300,000 recommended

### StreamDrops Contract

```solidity
function mintDrop(address _poster, string memory _tokenData, uint256 _collectionID, uint256 _opt, uint256 _price, uint256 _endDate) public payable authorized
```
- **Access**: Only `tdhSigner` address
- **Parameters**:
  - `_poster`: Receives 50% of proceeds
  - `_tokenData`: Token metadata
  - `_collectionID`: Target collection
  - `_opt`: 1 = Fixed price, 2 = Auction
  - `_price`: Starting price (wei)
  - `_endDate`: Min 10 minutes from now

### StreamMinter Contract

```solidity
function mintAndAuction(address _recipient, string memory _tokenData, uint256 _saltfun_o, uint256 _collectionID, uint _auctionEndTime) public streamDropRequired returns (uint256)
```
- **Access**: Only callable by StreamDrops
- **Requirements**: 
  - Collection phases must be set
  - `_auctionEndTime >= block.timestamp + 600`
- **Returns**: Token ID of minted token

## Key Functions

### Auction Creation (Backend Only)

```typescript
async function createStreamAuction(params: CreateAuctionParams): Promise<number> {
  const contract = new ethers.Contract(
    STREAM_CONTRACTS.STREAM_DROPS,
    STREAM_DROPS_ABI,
    tdhSigner
  );
  
  // Validate end time (minimum 10 minutes)
  const minEndTime = Math.floor(Date.now() / 1000) + 600;
  const endTime = Math.floor(Date.now() / 1000) + params.duration;
  if (endTime < minEndTime) {
    throw new Error('Auction must run for at least 10 minutes');
  }
  
  // Check collection phases are active
  const minter = new ethers.Contract(STREAM_CONTRACTS.STREAM_MINTER, STREAM_MINTER_ABI, provider);
  const [startTime, endTimePhase] = await minter.retrieveCollectionPhases(params.collectionId);
  const currentTime = Math.floor(Date.now() / 1000);
  
  if (currentTime < startTime || currentTime > endTimePhase) {
    throw new Error('Collection not in active minting phase');
  }
  
  const tx = await contract.mintDrop(
    params.poster,
    params.tokenData,
    params.collectionId,
    2, // _opt = 2 for auction
    ethers.utils.parseEther(params.startingPrice),
    endTime
  );
  
  const receipt = await tx.wait();
  return extractTokenIdFromReceipt(receipt);
}
```

### Bidding Functions (Frontend)

```typescript
async function placeBid(tokenId: number, bidAmount: string): Promise<void> {
  const contract = new ethers.Contract(
    STREAM_CONTRACTS.STREAM_AUCTIONS,
    STREAM_AUCTIONS_ABI,
    userSigner
  );
  
  // Get current auction state
  const currentBid = await contract.auctionHighestBid(tokenId);
  const incPercent = await contract.incPercent(); // Default: 5%
  
  let minimumBid;
  if (currentBid.eq(0)) {
    // First bid - use starting price
    const drops = new ethers.Contract(STREAM_CONTRACTS.STREAM_DROPS, STREAM_DROPS_ABI, provider);
    minimumBid = await drops.retrieveAuctionPrice(tokenId);
  } else {
    // Calculate minimum with increment percentage
    const increment = currentBid.mul(incPercent).div(100);
    minimumBid = currentBid.add(increment);
  }
  
  if (ethers.BigNumber.from(bidAmount).lt(minimumBid)) {
    throw new Error(`Bid must be at least ${ethers.utils.formatEther(minimumBid)} ETH`);
  }
  
  // Submit bid - contract handles refunds automatically
  const tx = await contract.participateToAuction(tokenId, {
    value: bidAmount,
    gasLimit: 200000
  });
  
  await tx.wait();
}
```

### Claim Functions

```typescript
async function claimAuction(tokenId: number): Promise<void> {
  const contract = new ethers.Contract(
    STREAM_CONTRACTS.STREAM_AUCTIONS,
    STREAM_AUCTIONS_ABI,
    userSigner
  );
  
  // Check if auction can be claimed
  const minter = new ethers.Contract(STREAM_CONTRACTS.STREAM_MINTER, STREAM_MINTER_ABI, provider);
  const endTime = await minter.getAuctionEndTime(tokenId);
  const currentTime = Math.floor(Date.now() / 1000);
  const isClaimed = await contract.auctionClaim(tokenId);
  
  if (currentTime <= endTime) {
    throw new Error('Auction has not ended yet');
  }
  if (isClaimed) {
    throw new Error('Auction already claimed');
  }
  
  // Anyone can claim - NFT goes to highest bidder or execution address if no bids
  const tx = await contract.claimAuction(tokenId, {
    gasLimit: 300000
  });
  
  await tx.wait();
}
```

### Read Functions

```typescript
async function getAuctionState(tokenId: number): Promise<AuctionState> {
  const auctions = new ethers.Contract(STREAM_CONTRACTS.STREAM_AUCTIONS, STREAM_AUCTIONS_ABI, provider);
  const minter = new ethers.Contract(STREAM_CONTRACTS.STREAM_MINTER, STREAM_MINTER_ABI, provider);
  const drops = new ethers.Contract(STREAM_CONTRACTS.STREAM_DROPS, STREAM_DROPS_ABI, provider);
  
  const [
    isActive,
    endTime,
    currentBid,
    currentBidder,
    startingPrice,
    poster,
    isClaimed
  ] = await Promise.all([
    minter.getAuctionStatus(tokenId),
    minter.getAuctionEndTime(tokenId),
    auctions.auctionHighestBid(tokenId),
    auctions.auctionHighestBidder(tokenId),
    drops.retrieveAuctionPrice(tokenId),
    drops.retrieveAuctionPoster(tokenId),
    auctions.auctionClaim(tokenId)
  ]);
  
  return {
    active: isActive,
    ended: Math.floor(Date.now() / 1000) > endTime.toNumber(),
    endTime: endTime.toNumber(),
    startingPrice: startingPrice.toString(),
    currentBid: currentBid.toString(),
    highestBidder: currentBidder,
    poster,
    claimed: isClaimed
  };
}
```

## Event Monitoring

### Actual Contract Events
```solidity
// From StreamAuctions.sol
event Participate(address indexed _add, uint256 indexed tokenid, uint256 indexed bid);
event ClaimAuction(uint256 indexed tokenid, uint256 indexed bid);
event Withdraw(address indexed _add, bool status, uint256 indexed funds);
```

### Event Listener Setup
```typescript
function setupAuctionEventListeners() {
  const auctions = new ethers.Contract(
    STREAM_CONTRACTS.STREAM_AUCTIONS,
    STREAM_AUCTIONS_ABI,
    provider
  );
  
  // Listen for new bids
  const participateFilter = auctions.filters.Participate(null, null, null);
  auctions.on(participateFilter, async (bidder, tokenId, bid, event) => {
    await updateAuctionCache(tokenId.toNumber(), {
      currentBid: bid.toString(),
      currentBidder: bidder,
      blockNumber: event.blockNumber
    });
    
    await sendOutbidNotifications(tokenId.toNumber(), bidder, bid);
    await postToActivityWave("bid", tokenId.toNumber(), bidder, bid);
  });
  
  // Listen for claims (note: only emitted if auction had bids)
  const claimFilter = auctions.filters.ClaimAuction(null, null);
  auctions.on(claimFilter, async (tokenId, winningBid, event) => {
    await markAuctionCompleted(tokenId.toNumber(), winningBid);
    await postToActivityWave("claimed", tokenId.toNumber(), winningBid);
  });
}
```

## Gas Optimization

### Estimated Gas Costs
```typescript
const GAS_ESTIMATES = {
  createAuction: 250000,    // Minting + auction setup
  placeBid: 120000,         // Bid + refund previous
  claimAuction: 100000,     // Transfer NFT
  cancelBid: 50000          // If implemented
};
```

### Optimization Strategies
1. Batch operations where possible
2. Use events instead of storage for history
3. Optimize data structures for common queries
4. Implement circuit breakers for gas spikes

## Error Handling

### Common Errors
```typescript
const CONTRACT_ERRORS = {
  // StreamAuctions errors
  "Ended": "Auction has ended",
  "Equal or Higher than starting bid": "First bid must meet starting price",
  "% more than highest bid": "Bid must be higher than current bid plus increment",
  "ETH failed": "Fund transfer failed - check recipient",
  "err": "Cannot claim - auction not ended or already claimed",
  
  // StreamDrops errors
  "Drop Executed": "This drop already exists",
  "price": "Incorrect payment amount",
  "Not found": "Invalid option - use 1 for fixed price or 2 for auction",
  "Not Allowed": "Only authorized signer can create drops",
  
  // StreamMinter errors
  "Not started": "Collection minting hasn't started",
  "Ended": "Collection minting period ended",
  "No supply": "Collection is sold out",
  "Add data": "Collection data must be set first",
  
  // Admin errors
  "Not allowed": "Insufficient permissions",
  "Contract is not Minter": "Invalid minter contract",
  "Contract is not Admin": "Invalid admin contract"
};

function translateContractError(error: any): string {
  const message = error.reason || error.message || "";
  
  // Check for specific patterns
  if (message.includes("% more than highest bid")) {
    return "Your bid must be higher than the current bid plus the minimum increment";
  }
  
  return CONTRACT_ERRORS[message] || "Transaction failed. Please try again.";
}
```

### Retry Logic
```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      // Wait before retry with exponential backoff
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, i) * 1000)
      );
    }
  }
  throw new Error("Max retries exceeded");
}
```

## Security Considerations

### Input Validation
- Validate all addresses are valid Ethereum addresses
- Ensure bid amounts are positive and meet minimums
- Verify token IDs exist before operations
- Sanitize metadata before storage

### Signature Verification
```typescript
async function verifyBidSignature(
  tokenId: number,
  amount: string,
  signature: string,
  signer: string
): Promise<boolean> {
  const message = ethers.utils.solidityKeccak256(
    ["uint256", "uint256", "address"],
    [tokenId, amount, signer]
  );
  
  const recoveredAddress = ethers.utils.verifyMessage(
    message,
    signature
  );
  
  return recoveredAddress.toLowerCase() === signer.toLowerCase();
}
```

### Admin Functions

#### Update Auction Parameters
```typescript
async function updateAuctionParameters(bidIncrement: number, extensionTime: number, adminSigner: Signer) {
  const auctions = new ethers.Contract(STREAM_CONTRACTS.STREAM_AUCTIONS, STREAM_AUCTIONS_ABI, adminSigner);
  
  // Update bid increment percentage (default: 5)
  await auctions.updatePercentAndExtensionTime(1, bidIncrement);
  
  // Update extension time in seconds (default: 300)
  await auctions.updatePercentAndExtensionTime(0, extensionTime);
}
```

#### Set Collection Phases (Required before auctions)
```typescript
async function setCollectionPhases(collectionId: number, startTime: number, endTime: number, adminSigner: Signer) {
  const minter = new ethers.Contract(STREAM_CONTRACTS.STREAM_MINTER, STREAM_MINTER_ABI, adminSigner);
  
  // Collection data must be added first
  await minter.setCollectionPhases(collectionId, startTime, endTime);
}
```

#### Emergency Functions
```typescript
// Emergency withdrawal (all contracts have this)
async function emergencyWithdraw(contractAddress: string, adminSigner: Signer) {
  const contract = new ethers.Contract(contractAddress, ['function emergencyWithdraw()'], adminSigner);
  await contract.emergencyWithdraw();
}
```

### Access Control

```solidity
// Modifiers used in contracts
modifier FunctionAdminRequired(bytes4 _selector) // Admin functions
modifier authorized() // TDH signer only (drops creation)
modifier streamDropRequired() // Only StreamDrops can call mint functions
```

## Fund Distribution

When an auction is claimed with bids:
- **50%** to poster (creator)
- **25%** to platform address
- **25%** to curators pool address

No-bid auctions: NFT transfers to execution address, no funds distributed.

## Critical Requirements

1. **Collection Phases**: Must call `setCollectionPhases()` before creating auctions
2. **Minimum Duration**: All auctions must run for at least 600 seconds (10 minutes)
3. **Automatic Refunds**: Previous bidder automatically refunded when outbid
4. **Time Extension**: Bids in final 5 minutes extend auction by 5 minutes
5. **Anyone Can Claim**: After auction ends, anyone can trigger claim (not just winner)

## Complete Integration Example

```typescript
class StreamAuctionService {
  private contracts: { [key: string]: ethers.Contract };
  
  constructor(provider: ethers.Provider, signer?: ethers.Signer) {
    this.contracts = {
      auctions: new ethers.Contract(STREAM_CONTRACTS.STREAM_AUCTIONS, STREAM_AUCTIONS_ABI, signer || provider),
      minter: new ethers.Contract(STREAM_CONTRACTS.STREAM_MINTER, STREAM_MINTER_ABI, provider),
      drops: new ethers.Contract(STREAM_CONTRACTS.STREAM_DROPS, STREAM_DROPS_ABI, provider)
    };
  }
  
  async getMinimumBid(tokenId: number): Promise<BigNumber> {
    const currentBid = await this.contracts.auctions.auctionHighestBid(tokenId);
    const incPercent = await this.contracts.auctions.incPercent();
    
    if (currentBid.eq(0)) {
      return await this.contracts.drops.retrieveAuctionPrice(tokenId);
    }
    
    const increment = currentBid.mul(incPercent).div(100);
    return currentBid.add(increment);
  }
  
  async placeBid(tokenId: number, amount: BigNumber): Promise<TransactionReceipt> {
    const minBid = await this.getMinimumBid(tokenId);
    if (amount.lt(minBid)) {
      throw new Error(`Minimum bid is ${ethers.utils.formatEther(minBid)} ETH`);
    }
    
    const tx = await this.contracts.auctions.participateToAuction(tokenId, {
      value: amount,
      gasLimit: 200000
    });
    
    return await tx.wait();
  }
}
```

---

[Back to API →](../api/endpoints.md)  
[See components →](../components/structure.md)  
[Integration guide →](../../05-integration/)
[Detailed contract reference →](./detailed-reference.md)