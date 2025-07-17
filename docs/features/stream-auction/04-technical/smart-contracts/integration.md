# Smart Contract Integration

This document details the integration with Stream smart contracts for auction functionality.

## Contract Overview

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

## Key Functions

### Auction Creation (Backend Only)

```typescript
// Function: createStreamAuction
// Called by: Backend with tdhSigner
// Purpose: Mint NFT and start auction

interface CreateAuctionParams {
  poster: string;           // Creator address
  tokenData: string;        // IPFS hash of metadata
  collectionId: number;     // Stream collection ID
  startingPrice: string;    // In wei (e.g., "100000000000000000" for 0.1 ETH)
  duration: number;         // In seconds (e.g., 86400 for 24 hours)
}

async function createStreamAuction(params: CreateAuctionParams): Promise<number> {
  const contract = new ethers.Contract(
    STREAM_CONTRACTS.STREAM_DROPS,
    STREAM_DROPS_ABI,
    tdhSigner
  );
  
  const tx = await contract.mintDrop(
    params.poster,
    params.tokenData,
    params.collectionId,
    params.startingPrice,
    params.duration
  );
  
  const receipt = await tx.wait();
  const tokenId = extractTokenIdFromReceipt(receipt);
  
  return tokenId;
}
```

### Bidding Functions (Frontend)

```typescript
// Function: placeBid
// Called by: Frontend with user's wallet
// Purpose: Submit bid on active auction

async function placeBid(tokenId: number, bidAmount: string): Promise<void> {
  const contract = new ethers.Contract(
    STREAM_CONTRACTS.STREAM_AUCTIONS,
    STREAM_AUCTIONS_ABI,
    userSigner
  );
  
  // Validate bid amount meets minimum
  const currentBid = await contract.getCurrentBid(tokenId);
  const minIncrement = currentBid.mul(110).div(100); // 10% increase
  
  if (ethers.BigNumber.from(bidAmount).lt(minIncrement)) {
    throw new Error("Bid too low");
  }
  
  // Submit bid with ETH value
  const tx = await contract.placeBid(tokenId, {
    value: bidAmount,
    gasLimit: 200000
  });
  
  await tx.wait();
}
```

### Claim Functions

```typescript
// Function: claimAuction
// Called by: Frontend with winner's wallet
// Purpose: Claim won NFT after auction ends

async function claimAuction(tokenId: number): Promise<void> {
  const contract = new ethers.Contract(
    STREAM_CONTRACTS.STREAM_AUCTIONS,
    STREAM_AUCTIONS_ABI,
    userSigner
  );
  
  // Verify auction ended and user won
  const auctionState = await contract.getAuctionState(tokenId);
  if (!auctionState.ended) {
    throw new Error("Auction still active");
  }
  if (auctionState.highestBidder !== userAddress) {
    throw new Error("Not the winner");
  }
  
  // Claim the NFT
  const tx = await contract.claimAuction(tokenId, {
    gasLimit: 150000
  });
  
  await tx.wait();
}
```

### Read Functions

```typescript
// Function: getAuctionState
// Called by: Frontend/Backend
// Purpose: Get current auction status

interface AuctionState {
  active: boolean;
  ended: boolean;
  startTime: number;
  endTime: number;
  startingPrice: string;
  currentBid: string;
  highestBidder: string;
  bidCount: number;
  claimed: boolean;
}

async function getAuctionState(tokenId: number): Promise<AuctionState> {
  const contract = new ethers.Contract(
    STREAM_CONTRACTS.STREAM_AUCTIONS,
    STREAM_AUCTIONS_ABI,
    provider
  );
  
  const state = await contract.auctions(tokenId);
  
  return {
    active: state.active,
    ended: Date.now() / 1000 > state.endTime,
    startTime: state.startTime.toNumber(),
    endTime: state.endTime.toNumber(),
    startingPrice: state.startingPrice.toString(),
    currentBid: state.currentBid.toString(),
    highestBidder: state.highestBidder,
    bidCount: state.bidCount.toNumber(),
    claimed: state.claimed
  };
}
```

## Event Monitoring

### Event Definitions
```typescript
// Auction Created
event AuctionCreated(
  uint256 indexed tokenId,
  address indexed creator,
  uint256 startingPrice,
  uint256 endTime
);

// Bid Placed
event BidPlaced(
  uint256 indexed tokenId,
  address indexed bidder,
  uint256 amount,
  uint256 timestamp
);

// Auction Ended
event AuctionEnded(
  uint256 indexed tokenId,
  address indexed winner,
  uint256 finalPrice
);

// NFT Claimed
event AuctionClaimed(
  uint256 indexed tokenId,
  address indexed winner
);
```

### Event Listener Setup
```typescript
// Listen for auction events
function setupAuctionEventListeners() {
  const contract = new ethers.Contract(
    STREAM_CONTRACTS.STREAM_AUCTIONS,
    STREAM_AUCTIONS_ABI,
    provider
  );
  
  // New bid events
  contract.on("BidPlaced", async (tokenId, bidder, amount, timestamp) => {
    await updateAuctionCache(tokenId, {
      currentBid: amount.toString(),
      currentBidder: bidder,
      lastBidTime: timestamp
    });
    
    await sendOutbidNotifications(tokenId, bidder, amount);
    await postToActivityWave("bid", tokenId, bidder, amount);
  });
  
  // Auction ended events
  contract.on("AuctionEnded", async (tokenId, winner, finalPrice) => {
    await markAuctionEnded(tokenId, winner, finalPrice);
    await sendWinnerNotification(tokenId, winner);
    await postToActivityWave("ended", tokenId, winner, finalPrice);
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
  "Auction not active": "This auction has ended or hasn't started",
  "Bid too low": "Your bid must be at least 10% higher than current",
  "Insufficient funds": "Your wallet doesn't have enough ETH",
  "Not authorized": "Only the auction creator can perform this action",
  "Already claimed": "This NFT has already been claimed"
};

function translateContractError(error: any): string {
  const message = error.reason || error.message || "";
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
Only callable by authorized admin addresses:
- Update auction parameters
- Pause/unpause auctions
- Emergency withdrawal
- Collection management

---

[Back to API →](../api/endpoints.md)  
[See components →](../components/structure.md)  
[Integration guide →](../../05-integration/)