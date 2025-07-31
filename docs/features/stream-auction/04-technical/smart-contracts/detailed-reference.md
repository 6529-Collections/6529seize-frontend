# Stream Auction Contracts - Detailed Reference

This document provides an exhaustive technical reference for the 6529 Stream Auction smart contracts, including all functions, state variables, modifiers, and integration patterns.

## Table of Contents
1. [State Variables](#state-variables)
2. [Constructor Parameters](#constructor-parameters)
3. [Function Specifications](#function-specifications)
4. [Access Control](#access-control)
5. [Error Messages](#error-messages)
6. [Gas Optimization](#gas-optimization)
7. [Security Considerations](#security-considerations)

## State Variables

### StreamAuctions
```solidity
mapping(uint256 => uint256) public auctionHighestBid;
mapping(uint256 => address) public auctionHighestBidder;
mapping(uint256 => bool) public auctionClaim;
uint256 public incPercent; // Default: 5%
uint256 public extensionTime; // Default: 300 seconds
address public gencore; // ERC721 contract address
address public payOutAddress; // Platform payout address
address public curatorsPoolAddress; // Curators pool address
IStreamMinter public minterContract;
IStreamAdmins public adminsContract;
IStreamDrops public dropsContract;
```

### StreamMinter
```solidity
mapping(uint256 => bool) private setMintingCosts;
mapping(uint256 => collectionPhasesDataStructure) private collectionPhases;
mapping(uint256 => uint) private mintToAuctionData; // End times
mapping(uint256 => bool) private mintToAuctionStatus; // Active status
address public streamDrops;
IStreamCore public gencore;
IStreamAdmins private adminsContract;
```

### StreamDrops
```solidity
mapping(bytes32 => dropInfoStruct) private dropInfo;
mapping(uint256 => address) posterAuctionAddress;
mapping(uint256 => uint256) auctionPrice;
mapping(bytes32 => bool) dropExecuted;
mapping(uint256 => bytes32) tokenDropID;
bytes32[] public allDrops;
uint256 public tdhThreshold;
uint256 public activeTime;
address public tdhSigner;
IStreamMinter public minterContract;
IStreamAdmins public adminsContract;
address public payOutAddress;
address public curatorsPoolAddress;
```

## Constructor Parameters

### StreamAuctions
```solidity
constructor(
    address _minterContract,
    address _gencore,
    address _adminsContract,
    address _dropsContract,
    address _payOutAddress,
    address _curatorsPoolAddress
)
```
- Sets initial `incPercent = 5` and `extensionTime = 300`
- No interface validation in constructor
- Recommended gas: 500,000

### StreamMinter
```solidity
constructor(
    address _gencore,
    address _adminsContract,
    address _streamDrops
)
```

### StreamDrops
```solidity
constructor(
    address _tdhSignerContract,
    address _minterContract,
    address _adminsContract,
    address _payOutAddress,
    address _curatorsPoolAddress
)
```

## Function Specifications

### Auction Participation

#### participateToAuction
```solidity
function participateToAuction(uint256 _tokenid) public payable
```

**Requirements:**
- Auction must be active (`getAuctionStatus(_tokenid) == true`)
- Current time ≤ auction end time
- First bid: `msg.value >= startingPrice`
- Subsequent bids: `msg.value >= currentBid + (currentBid * incPercent / 100)`

**Effects:**
- Updates `auctionHighestBid[_tokenid]` and `auctionHighestBidder[_tokenid]`
- Refunds previous highest bidder automatically
- If bid placed within `extensionTime` of end, extends auction by `extensionTime`

**Events:**
- `Participate(msg.sender, _tokenid, msg.value)`

**Error Messages:**
- `"Ended"` - Auction has ended
- `"Equal or Higher than starting bid"` - First bid too low
- `"% more than highest bid"` - Subsequent bid too low
- `"ETH failed"` - Refund transfer failed

#### claimAuction
```solidity
function claimAuction(uint256 _tokenid) public nonReentrant
```

**Requirements:**
- `block.timestamp > getAuctionEndTime(_tokenid)`
- `getAuctionStatus(_tokenid) == true`
- `auctionClaim[_tokenid] == false`

**Effects (if bids exist):**
- Distributes funds: 50% poster, 25% platform, 25% curators
- Transfers NFT to highest bidder
- Sets `auctionClaim[_tokenid] = true`

**Effects (no bids):**
- Transfers NFT to execution address
- Sets `auctionClaim[_tokenid] = true`

**Events:**
- `ClaimAuction(_tokenid, highestBid)` - Only if `highestBid > 0`

**Error Messages:**
- `"err"` - General claim error
- `"ETH failed"` - Fund distribution failed

### Drop Creation

#### mintDrop
```solidity
function mintDrop(
    address _poster,
    string memory _tokenData,
    uint256 _collectionID,
    uint256 _opt,
    uint256 _price,
    uint256 _endDate
) public payable authorized
```

**Access:** Only `tdhSigner`

**Parameters:**
- `_poster`: Receives 50% of proceeds
- `_tokenData`: Token metadata
- `_collectionID`: Target collection
- `_opt`: 1 = Fixed price, 2 = Auction
- `_price`: Starting price (wei)
- `_endDate`: Min `block.timestamp + 600` for auctions

**Error Messages:**
- `"Drop Executed"` - Duplicate drop hash
- `"price"` - Incorrect payment for fixed price
- `"Not found"` - Invalid `_opt` value
- `"Not Allowed"` - Unauthorized caller
- `"ETH failed"` - Fund distribution failed

### Minting Functions

#### mintAndAuction
```solidity
function mintAndAuction(
    address _recipient,
    string memory _tokenData,
    uint256 _saltfun_o,
    uint256 _collectionID,
    uint _auctionEndTime
) public streamDropRequired returns (uint256)
```

**Access:** Only StreamDrops contract

**Requirements:**
- Collection phases must be set
- `currentTime >= publicStartTime && currentTime <= publicEndTime`
- `_auctionEndTime >= block.timestamp + 600`

**Error Messages:**
- `"Not started"` - Before public sale phase
- `"Ended"` - After public sale phase
- `"No supply"` - Collection sold out
- Silent revert if auction time < 10 minutes

### Admin Functions

#### Update Parameters
```solidity
function updatePercentAndExtensionTime(uint256 _opt, uint256 _value) 
    public FunctionAdminRequired(this.updatePercentAndExtensionTime.selector)
```
- `_opt == 1`: Update bid increment percentage
- `_opt != 1`: Update extension time (seconds)

#### Update Contracts
```solidity
function updateMinterContract(address _minterContract) 
    public FunctionAdminRequired(this.updateMinterContract.selector)
```
- Validates: `IStreamMinter(_minterContract).isMinterContract() == true`
- Error: `"Contract is not Minter"`

```solidity
function updateAdminContract(address _newadminsContract) 
    public FunctionAdminRequired(this.updateAdminContract.selector)
```
- Validates: `IStreamAdmins(_newadminsContract).isAdminContract() == true`
- Error: `"Contract is not Admin"`

#### Emergency Functions
```solidity
function emergencyWithdraw() 
    public FunctionAdminRequired(this.emergencyWithdraw.selector)
```
- Withdraws all ETH to `adminsContract.owner()`
- Events: `Withdraw(msg.sender, success, balance)`

## Access Control

### Modifiers

```solidity
modifier FunctionAdminRequired(bytes4 _selector) {
    require(
        adminsContract.retrieveFunctionAdmin(msg.sender, _selector) == true ||
        adminsContract.retrieveGlobalAdmin(msg.sender) == true,
        "Not allowed"
    );
    _;
}

modifier authorized() {
    require(msg.sender == tdhSigner, "Not Allowed");
    _;
}

modifier streamDropRequired() {
    require(msg.sender == streamDrops, "Not allowed");
    _;
}
```

### Permission Hierarchy
1. **Global Admin**: Can call all admin functions
2. **Function Admin**: Can call specific functions
3. **TDH Signer**: Can create drops and grant permissions
4. **StreamDrops Contract**: Can call mint functions

## Error Messages

### Complete Error Reference

| Error Message | Contract | Cause | Solution |
|---------------|----------|-------|----------|
| "Ended" | StreamAuctions | Auction time expired | Check end time before bidding |
| "Equal or Higher than starting bid" | StreamAuctions | First bid too low | Use `retrieveAuctionPrice()` |
| "% more than highest bid" | StreamAuctions | Bid increment too small | Add `incPercent` to current bid |
| "ETH failed" | Multiple | Transfer failed | Check recipient can receive ETH |
| "err" | StreamAuctions | Claim conditions not met | Verify auction ended and unclaimed |
| "Drop Executed" | StreamDrops | Duplicate drop | Change any parameter |
| "price" | StreamDrops | Wrong ETH sent | Send exact `_price` amount |
| "Not found" | StreamDrops | Invalid `_opt` | Use 1 or 2 only |
| "Not Allowed" | Multiple | Unauthorized | Check permissions |
| "Not started" | StreamMinter | Before minting phase | Wait or check phases |
| "Ended" | StreamMinter | After minting phase | Too late to mint |
| "No supply" | StreamMinter | Sold out | Check availability first |
| "Add data" | StreamMinter | Collection not initialized | Admin must set collection data |
| "Contract is not Minter" | StreamAuctions | Invalid minter update | Contract must implement interface |
| "Contract is not Admin" | Multiple | Invalid admin update | Contract must implement interface |
| Silent revert | StreamMinter | Auction < 10 min | Ensure 600+ second duration |

## Gas Optimization

### Recommended Gas Limits
```javascript
const GAS_LIMITS = {
    createAuction: 300000,      // Drop creation with auction
    placeBid: 200000,           // Includes refund to previous bidder
    claimAuction: 300000,       // Includes fund distribution
    updateParams: 50000,        // Admin parameter updates
    emergencyWithdraw: 100000,  // Emergency withdrawal
    setCollectionPhases: 80000  // Phase configuration
};
```

### Optimization Tips
1. Batch read operations with `Promise.all()`
2. Use events for historical data instead of storage
3. Cache frequently accessed values (incPercent, addresses)
4. Estimate gas before transactions
5. Add 20% buffer to gas estimates

## Security Considerations

### Critical Risks

1. **Centralization Risk**
   - Single `tdhSigner` controls all drop creation
   - Admin can withdraw all funds via `emergencyWithdraw()`
   - No timelock on admin functions

2. **Permanent Lock Risk**
   - Unclaimed auctions lock NFT forever
   - No recovery mechanism for stuck funds
   - No admin override for claims

3. **Refund Failure Risk**
   - Failed refunds block new bids
   - Contracts as bidders may cause issues
   - No fallback for failed transfers

4. **Time Manipulation**
   - Miners can influence `block.timestamp`
   - ±15 second window for manipulation
   - Could affect auction extensions

5. **Reentrancy**
   - Only `claimAuction` protected
   - `participateToAuction` handles ETH but not protected
   - Refunds happen before state changes

### Best Practices

1. **Multi-sig Wallets**
   - Use for `tdhSigner` address
   - Use for admin addresses
   - Use for payout addresses

2. **Monitoring**
   - Track unclaimed auctions
   - Monitor failed transactions
   - Alert on unusual gas usage

3. **Testing**
   - Test with contract bidders
   - Test max gas scenarios
   - Test time boundary conditions

4. **Upgrades**
   - No upgrade mechanism built-in
   - Would require full redeployment
   - Plan migration strategy

---

[Back to Smart Contracts →](./)  
[Integration Guide →](./integration.md)  
[API Documentation →](../api/)