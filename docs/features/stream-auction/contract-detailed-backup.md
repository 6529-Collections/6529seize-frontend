# 6529 Stream Auction System - Technical Documentation

## Table of Contents
1. [Contract Architecture](#contract-architecture)
2. [Smart Contract Interfaces](#smart-contract-interfaces)
3. [Client-Side Integration](#client-side-integration)
4. [Admin Operations](#admin-operations)
5. [Error Handling](#error-handling)
6. [Integration Examples](#integration-examples)
7. [Security Considerations](#security-considerations)

---

## Contract Architecture

### Core Contracts

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
- **StreamCore**: ERC721 contract that manages NFT collections and tokens (accessed via IStreamCore interface)
- **StreamAuctions**: Manages bidding, time extensions, and auction claims
- **StreamAdmins**: Permission management for all administrative functions

### Key State Variables

```solidity
// StreamAuctions
mapping(uint256 => uint256) public auctionHighestBid;
mapping(uint256 => address) public auctionHighestBidder;
mapping(uint256 => bool) public auctionClaim;
uint256 public incPercent; // Default: 5%
uint256 public extensionTime; // Default: 300 seconds
address public gencore; // ERC721 contract address
address public payOutAddress; // Platform payout address
address public curatorsPoolAddress; // Curators pool address
IStreamMinter public minterContract; // StreamMinter contract interface
IStreamAdmins public adminsContract; // StreamAdmins contract interface
IStreamDrops public dropsContract; // StreamDrops contract interface

// StreamMinter
mapping(uint256 => bool) private setMintingCosts; // Minting costs set status (unused in current implementation)
struct collectionPhasesDataStructure {
    uint publicStartTime;
    uint publicEndTime;
}
mapping(uint256 => collectionPhasesDataStructure) private collectionPhases; // Collection phases
mapping(uint256 => uint) private mintToAuctionData; // End times
mapping(uint256 => bool) private mintToAuctionStatus; // Active status
address public streamDrops; // StreamDrops contract address
IStreamCore public gencore; // StreamCore contract interface
IStreamAdmins private adminsContract; // StreamAdmins contract interface

// StreamDrops
struct dropInfoStruct {
    uint256 tokenid;
    address signerAddress;
    address posterAddress;
    address executionAddress;
}
mapping(bytes32 => dropInfoStruct) private dropInfo; // Drop information
mapping(uint256 => address) posterAuctionAddress; // Poster for each token
mapping(uint256 => uint256) auctionPrice; // Starting price
mapping(bytes32 => bool) dropExecuted; // Prevent duplicates
mapping(uint256 => bytes32) tokenDropID; // Token to drop ID mapping
bytes32[] public allDrops; // Array of all drop IDs
uint256 public tdhThreshold; // TDH threshold for operations
uint256 public activeTime; // Active time parameter
address public tdhSigner; // TDH signer address
IStreamMinter public minterContract; // StreamMinter contract interface
IStreamAdmins public adminsContract; // StreamAdmins contract interface
address public payOutAddress; // Platform payout address
address public curatorsPoolAddress; // Curators pool address
```

---

## Smart Contract Interfaces

### StreamAuctions Contract

#### Events

```solidity
event Participate(address indexed _add, uint256 indexed tokenid, uint256 indexed bid)
```
- **Purpose**: Emitted when a bid is placed
- **Parameters**: `_add` (bidder - indexed), `tokenid` (token ID - indexed), `bid` (bid amount - indexed)
- **Timing**: Emitted on every successful bid
- **Filter Usage**: All parameters are indexed, enabling efficient event filtering

```solidity
event ClaimAuction(uint256 indexed tokenid, uint256 indexed bid)
```
- **Purpose**: Emitted when an auction is successfully claimed
- **Parameters**: `tokenid` (token ID - indexed), `bid` (winning bid amount - indexed)
- **Timing**: Only emitted if `highestBid > 0` (auction had bids)
- **Note**: NOT emitted for no-bid auctions (when `highestBid == 0`)
- **Filter Usage**: Both parameters are indexed for efficient filtering

```solidity
event Withdraw(address indexed _add, bool status, uint256 indexed funds)
```
- **Purpose**: Emitted during emergency withdrawals
- **Parameters**: `_add` (admin address - indexed), `status` (success boolean), `funds` (amount withdrawn - indexed)
- **Timing**: Emitted during `emergencyWithdraw()` calls
- **Filter Usage**: Address and funds are indexed, status is not indexed

#### Constructor

```solidity
constructor(address _minterContract, address _gencore, address _adminsContract, address _dropsContract, address _payOutAddress, address _curatorsPoolAddress)
```
- **Purpose**: Initialize the auction contract with required dependencies
- **Parameters**:
  - `_minterContract`: Address of StreamMinter contract (must implement IStreamMinter)
  - `_gencore`: Address of StreamCore (ERC721) contract
  - `_adminsContract`: Address of StreamAdmins contract (must implement IStreamAdmins)
  - `_dropsContract`: Address of StreamDrops contract (must implement IStreamDrops)
  - `_payOutAddress`: Platform payout address (receives 25% of auction proceeds)
  - `_curatorsPoolAddress`: Curators pool address (receives 25% of auction proceeds)
- **Initial Values**: Sets `incPercent = 5` and `extensionTime = 300`
- **Validation**: Constructor does NOT validate contract interfaces - validation occurs on updates only
- **Gas Limit**: Recommend 500,000 gas for deployment

#### Core Functions

```solidity
function participateToAuction(uint256 _tokenid) public payable
```
- **Purpose**: Place a bid on an active auction
- **Requirements**: 
  - Auction must be active (`getAuctionStatus(_tokenid) == true`)
  - Current time ≤ auction end time
  - Bid amount ≥ starting price (first bid) or current bid + 5%
- **Effects**: 
  - Refunds previous highest bidder automatically
  - Extends auction by 5 minutes if bid placed in final 5 minutes
  - Updates `auctionHighestBid` and `auctionHighestBidder`
- **Events**: Emits `Participate(bidder, tokenid, bid)`
- **Time Extension**: If bid placed within final 5 minutes, extends auction by 5 minutes
- **Gas Limit**: Recommend 200,000 gas for bid transactions
- **Security**: Function automatically handles ETH refunds to previous bidders

```solidity
function claimAuction(uint256 _tokenid) public nonReentrant
```
- **Purpose**: Finalize auction and distribute funds/NFT
- **Requirements**: 
  - Auction must be ended (`block.timestamp > getAuctionEndTime(_tokenid)`)
  - Auction must be active (`getAuctionStatus(_tokenid) == true`)
  - Auction must not be claimed (`auctionClaim[_tokenid] == false`)
- **Effects**: 
  - If no bids (`highestBid == 0`): Transfers NFT to execution address
  - If bids exist (`highestBid > 0`): 
    - Distributes funds: 50% to poster, 25% to platform, 25% to curators
    - Transfers NFT to highest bidder
  - Sets `auctionClaim[_tokenid] = true`
- **Events**: Emits `ClaimAuction(tokenid, bid)` (only if `highestBid > 0`)
- **Note**: Event is NOT emitted if no bids were placed (`highestBid == 0`)
- **Gas Limit**: Recommend 300,000 gas for claim transactions
- **Security**: Protected by `nonReentrant` modifier against reentrancy attacks

#### Admin Functions

```solidity
function updatePercentAndExtensionTime(uint256 _opt, uint256 _value) public FunctionAdminRequired(this.updatePercentAndExtensionTime.selector)
```
- **Purpose**: Update global auction parameters
- **Parameters**: 
  - `_opt`: 1 = update bid increment percentage, else = update extension time
  - `_value`: New value (percentage or seconds)
- **Logic**: Uses `if (_opt == 1)` for percentage, `else` for extension time

```solidity
function updatePayOutAddress(address _payOutAddress) public FunctionAdminRequired(this.updatePayOutAddress.selector)
function updateCuratorsPoolAddress(address _curatorsPoolAddress) public FunctionAdminRequired(this.updateCuratorsPoolAddress.selector)
```
- **Purpose**: Update fund distribution addresses

```solidity
function updateMinterContract(address _minterContract) public FunctionAdminRequired(this.updateMinterContract.selector)
```
- **Purpose**: Update the StreamMinter contract address
- **Requirements**: New contract must return `true` for `isMinterContract()`
- **Validation Logic**: `require(IStreamMinter(_minterContract).isMinterContract() == true, "Contract is not Minter")`
- **Error**: "Contract is not Minter" if validation fails

```solidity
function updateAdminContract(address _newadminsContract) public FunctionAdminRequired(this.updateAdminContract.selector)
```
- **Purpose**: Update the StreamAdmins contract address
- **Requirements**: New contract must return `true` for `isAdminContract()`
- **Validation Logic**: `require(IStreamAdmins(_newadminsContract).isAdminContract() == true, "Contract is not Admin")`
- **Error**: "Contract is not Admin" if validation fails

```solidity
function updateDropsContract(address _dropsContract) public FunctionAdminRequired(this.updateDropsContract.selector)
```
- **Purpose**: Update the StreamDrops contract address
- **Requirements**: No validation performed

```solidity
function emergencyWithdraw() public FunctionAdminRequired(this.emergencyWithdraw.selector)
```
- **Purpose**: Withdraw all ETH from contract to admin owner
- **Recipient**: Funds are sent to `adminsContract.owner()`
- **Events**: Emits `Withdraw(msg.sender, success, balance)`

### StreamDrops Contract

#### Constructor

```solidity
constructor(address _tdhSignerContract, address _minterContract, address _adminsContract, address _payOutAddress, address _curatorsPoolAddress)
```
- **Purpose**: Initialize the drops contract with required dependencies
- **Parameters**:
  - `_tdhSignerContract`: Address of the TDH signer (controls who can create drops)
  - `_minterContract`: Address of StreamMinter contract
  - `_adminsContract`: Address of StreamAdmins contract
  - `_payOutAddress`: Platform payout address (receives 25% of proceeds)
  - `_curatorsPoolAddress`: Curators pool address (receives 25% of proceeds)

#### Core Functions

```solidity
function mintDrop(address _poster, string memory _tokenData, uint256 _collectionID, uint256 _opt, uint256 _price, uint256 _endDate) public payable authorized
```
- **Purpose**: Create a new drop (auction or fixed price sale)
- **Access**: Only `tdhSigner` address
- **Parameters**:
  - `_poster`: Address that receives 50% of proceeds
  - `_tokenData`: Token metadata
  - `_collectionID`: Target collection ID
  - `_opt`: 1 = Fixed price, 2 = Auction
  - `_price`: Starting price (wei)
  - `_endDate`: Auction end timestamp (minimum 10 minutes from now)
- **Effects**: Calls `mintAndAuction()` or `mint()` based on `_opt`

#### Admin Functions

```solidity
function updateTDHsigner(address _tsigner) public FunctionAdminRequired(this.updateTDHsigner.selector)
```
- **Purpose**: Update the TDH signer address (controls who can create drops)
- **Access**: Requires admin permissions

```solidity
function updatePayOutAddress(address _payOutAddress) public FunctionAdminRequired(this.updatePayOutAddress.selector)
function updateCuratorsPoolAddress(address _curatorsPoolAddress) public FunctionAdminRequired(this.updateCuratorsPoolAddress.selector)
```
- **Purpose**: Update fund distribution addresses

```solidity
function updateAdminContract(address _newContract) public FunctionAdminRequired(this.updateAdminContract.selector)
```
- **Purpose**: Update the StreamAdmins contract address
- **Requirements**: New contract must return `true` for `isAdminContract()`
- **Error**: "Contract is not Admin" if validation fails

```solidity
function updateMinterContract(address _newContract) public FunctionAdminRequired(this.updateMinterContract.selector)
```
- **Purpose**: Update the StreamMinter contract address
- **Requirements**: New contract must return `true` for `isMinterContract()`
- **Error**: "Contract is not Admin" if validation fails (Note: Error message is misleading, should be "Contract is not Minter")

```solidity
function emergencyWithdraw() public FunctionAdminRequired(this.emergencyWithdraw.selector)
```
- **Purpose**: Withdraw all ETH from contract to admin owner
- **Recipient**: Funds are sent to `adminsContract.owner()`
- **Events**: Emits `Withdraw(msg.sender, success, balance)`
- **Error**: "ETH failed" if transfer fails

#### View Functions

```solidity
function retrieveAuctionPoster(uint256 _tokenid) public view returns(address)
function retrieveAuctionPrice(uint256 _tokenid) public view returns(uint256)
function retrieveDropID(uint256 _tokenid) public view returns(bytes32)
function retrieveExecutionAddress(uint256 _tokenid) public view returns(address)
```

```solidity
function retrieveMessageAndDropID(address _poster, string memory _tokenData, uint256 _collectionID, uint256 _opt, uint256 _price, uint256 _endDate) public pure returns(string memory, bytes32)
```
- **Purpose**: Generate drop ID hash for deduplication checking
- **Returns**: (concatenated message, keccak256 hash)

```solidity
function retrieveDrops() public view returns(bytes32[] memory)
```
- **Purpose**: Get all drop IDs that have been created
- **Returns**: Array of all drop IDs

```solidity
function retrieveDropInfo(bytes32 _dropId) public view returns(uint256, address, address, address)
```
- **Purpose**: Get complete drop information
- **Returns**: (tokenid, signerAddress, posterAddress, executionAddress)

```solidity
function retrieveTokenID(bytes32 _dropId) public view returns(uint256)
```
- **Purpose**: Get token ID from drop ID
- **Returns**: Token ID associated with the drop

### StreamDrops Contract

#### Events

```solidity
event Withdraw(address indexed _add, bool status, uint256 indexed funds)
```
- **Purpose**: Emitted during emergency withdrawals
- **Parameters**: `_add` (admin address), `status` (success boolean), `funds` (amount withdrawn)
- **Timing**: Emitted during `emergencyWithdraw()` calls

### StreamMinter Contract

#### Events

```solidity
event Withdraw(address indexed _add, bool status, uint256 indexed funds)
```
- **Purpose**: Emitted during emergency withdrawals
- **Parameters**: `_add` (admin address), `status` (success boolean), `funds` (amount withdrawn)
- **Timing**: Emitted during `emergencyWithdraw()` calls

#### Constructor

```solidity
constructor(address _gencore, address _adminsContract, address _streamDrops)
```
- **Purpose**: Initialize the minter contract with required dependencies
- **Parameters**:
  - `_gencore`: Address of StreamCore (ERC721) contract
  - `_adminsContract`: Address of StreamAdmins contract
  - `_streamDrops`: Address of StreamDrops contract

#### Core Functions

```solidity
function getAuctionStatus(uint256 _tokenid) external view returns(bool)
function getAuctionEndTime(uint256 _tokenid) external view returns(uint)
```
- **Purpose**: Check auction state and timing

```solidity
function retrieveCollectionPhases(uint256 _collectionID) public view returns(uint, uint)
```
- **Purpose**: Get collection minting phases
- **Returns**: (publicStartTime, publicEndTime)

```solidity
function getEndTime(uint256 _collectionID) external view returns(uint)
```
- **Purpose**: Get collection minting end time
- **Returns**: End time timestamp

```solidity
function mint(address[] memory _recipients, string[] memory _tokenData, uint256[] memory _saltfun_o, uint256 _collectionID, uint256[] memory _numberOfTokens) public streamDropRequired returns (uint256)
```
- **Purpose**: Mint tokens for fixed price sales
- **Access**: Only callable by StreamDrops contract (streamDropRequired modifier)
- **Requirements**: Collection phases must be set and active
- **Returns**: Token ID of last minted token
- **Error**: "Not started" if collection not in public sale phase
- **Error**: "Ended" if collection minting period ended
- **Error**: "No supply" if collection supply exhausted

```solidity
function mintAndAuction(address _recipient, string memory _tokenData, uint256 _saltfun_o, uint256 _collectionID, uint _auctionEndTime) public streamDropRequired returns (uint256)
```
- **Purpose**: Mint token and start auction
- **Access**: Only callable by StreamDrops contract (streamDropRequired modifier)
- **Requirements**: 
  - Collection phases must be set and active
  - `_auctionEndTime >= block.timestamp + 600` (10 minutes minimum)
- **Returns**: Token ID of minted token
- **Error**: "Not started" if collection not in public sale phase
- **Error**: "Ended" if collection minting period ended
- **Error**: "No supply" if collection supply exhausted
- **Error**: Silent revert (no custom message) if `_auctionEndTime < block.timestamp + 600` (10 minutes minimum)

```solidity
function isMinterContract() external view returns(bool)
```
- **Purpose**: Validate that contract is a minter contract
- **Returns**: Always returns `true`

```solidity
function updateAuctionEndTime(uint256 _tokenId, uint256 _auctionEndTime) public FunctionAdminRequired(this.updateAuctionEndTime.selector)
```
- **Purpose**: Extend auction end time (used by anti-sniping mechanism)
- **Access**: Requires admin permissions
- **Requirements**: `mintToAuctionStatus[_tokenId] == true`
- **Error**: Silent revert (no custom message) if `mintToAuctionStatus[_tokenId] != true`

```solidity
function updateContracts(uint256 _opt, address _newContract) public FunctionAdminRequired(this.updateContracts.selector)
```
- **Purpose**: Update contract addresses
- **Parameters**:
  - `_opt`: 1 = update gencore, 2 = update admins, 3 = update streamDrops
  - `_newContract`: New contract address
- **Requirements**: For _opt=2, new contract must return `true` for `isAdminContract()`
- **Error**: "Contract is not Admin" if admin contract validation fails

```solidity
function emergencyWithdraw() public FunctionAdminRequired(this.emergencyWithdraw.selector)
```
- **Purpose**: Withdraw all ETH from contract to admin owner
- **Recipient**: Funds are sent to `adminsContract.owner()`
- **Events**: Emits `Withdraw(msg.sender, success, balance)`
- **Error**: "ETH failed" if transfer fails

```solidity
function setCollectionPhases(uint256 _collectionID, uint _publicStartTime, uint _publicEndTime) public FunctionAdminRequired(this.setCollectionPhases.selector)
```
- **Purpose**: Set collection minting phases (required before auction creation)
- **Requirements**: `gencore.retrievewereDataAdded(_collectionID) == true`
- **Error**: "Add data" if collection data not set
- **Note**: This must be called before any tokens can be minted or auctioned

#### Admin Functions

```solidity
function updateContracts(uint256 _opt, address _newContract) public FunctionAdminRequired(this.updateContracts.selector)
```
- **Purpose**: Update contract addresses
- **Parameters**:
  - `_opt`: 1 = update gencore, 2 = update admins, 3 = update streamDrops
  - `_newContract`: New contract address
- **Requirements**: For _opt=2, new contract must return `true` for `isAdminContract()`
- **Error**: "Contract is not Admin" if admin contract validation fails

```solidity
function emergencyWithdraw() public FunctionAdminRequired(this.emergencyWithdraw.selector)
```
- **Purpose**: Withdraw all ETH from contract to admin owner
- **Recipient**: Funds are sent to `adminsContract.owner()`
- **Events**: Emits `Withdraw(msg.sender, success, balance)`
- **Error**: "ETH failed" if transfer fails

---

## Contract Interfaces

### IStreamMinter Interface

```solidity
interface IStreamMinter {
    // Contract identification
    function isMinterContract() external view returns (bool);
    
    // Timing functions
    function getEndTime(uint256 _collectionID) external view returns (uint);
    function getAuctionEndTime(uint256 _tokenId) external view returns (uint);
    function getAuctionStatus(uint256 _tokenId) external view returns (bool);
    
    // Minting functions (only callable by StreamDrops)
    function mint(address[] memory _recipients, string[] memory _tokenData, uint256[] memory _saltfun_o, uint256 _collectionID, uint256[] memory _numberOfTokens) external returns (uint256);
    function mintAndAuction(address _recipient, string memory _tokenData, uint256 _saltfun_o, uint256 _collectionID, uint _auctionEndTime) external returns(uint256);
    
    // Admin functions
    function updateAuctionEndTime(uint256 _tokenId, uint256 _auctionEndTime) external;
}
```

**Interface Requirements**:
- Must return `true` for `isMinterContract()` to pass validation
- Only contracts with `streamDropRequired()` modifier can call mint functions
- All view functions should be gas-optimized for frequent calls

### IStreamDrops Interface

```solidity
interface IStreamDrops {
    // Auction data retrieval
    function retrieveAuctionPoster(uint256 _tokenid) external view returns(address);
    function retrieveAuctionPrice(uint256 _tokenid) external view returns(uint256);
    function retrieveExecutionAddress(uint256 _tokenid) external view returns(address);
    
    // Drop ID management
    function retrieveTokenID(bytes32 _dropID) external view returns(uint256);
    function retrieveDropID(uint256 _tokenid) external view returns(bytes32);
}
```

**Interface Requirements**:
- All functions are view functions for gas efficiency
- Must handle invalid tokenids gracefully (return zero values)
- Used by StreamAuctions for fund distribution and NFT transfers

### IStreamAdmins Interface

```solidity
interface IStreamAdmins {
    // Admin permission checking
    function retrieveGlobalAdmin(address _address) external view returns(bool);
    function retrieveFunctionAdmin(address _address, bytes4 _selector) external view returns(bool);
    function retrieveCollectionAdmin(address _address, uint256 _collectionID) external view returns(bool);
    
    // Contract identification and ownership
    function isAdminContract() external view returns (bool);
    function owner() external view returns (address);
}
```

**Interface Requirements**:
- Must return `true` for `isAdminContract()` to pass validation
- `owner()` must return valid address for emergency withdrawals
- Permission functions should be gas-optimized as they're called frequently
- Used by `FunctionAdminRequired` modifier for access control

---

## Client-Side Integration

### Reading Auction Data

#### Check if Token is in Auction

```javascript
// Using ethers.js
const streamMinter = new ethers.Contract(STREAM_MINTER_ADDRESS, streamMinterABI, provider);
const streamAuctions = new ethers.Contract(STREAM_AUCTIONS_ADDRESS, streamAuctionsABI, provider);

async function isTokenInAuction(tokenId) {
    const isActive = await streamMinter.getAuctionStatus(tokenId);
    const endTime = await streamMinter.getAuctionEndTime(tokenId);
    const currentTime = Math.floor(Date.now() / 1000);
    
    return isActive && currentTime <= endTime;
}
```

#### Get Current Auction State

```javascript
async function getAuctionState(tokenId) {
    const [
        isActive,
        endTime,
        currentBid,
        currentBidder,
        startingPrice,
        poster,
        isClaimed
    ] = await Promise.all([
        streamMinter.getAuctionStatus(tokenId),
        streamMinter.getAuctionEndTime(tokenId),
        streamAuctions.auctionHighestBid(tokenId),
        streamAuctions.auctionHighestBidder(tokenId),
        streamDrops.retrieveAuctionPrice(tokenId),
        streamDrops.retrieveAuctionPoster(tokenId),
        streamAuctions.auctionClaim(tokenId)
    ]);
    
    return {
        isActive,
        endTime: endTime.toNumber(),
        currentBid: ethers.utils.formatEther(currentBid),
        currentBidder,
        startingPrice: ethers.utils.formatEther(startingPrice),
        poster,
        isClaimed,
        isEnded: Math.floor(Date.now() / 1000) > endTime.toNumber()
    };
}
```

#### Calculate Minimum Next Bid

```javascript
async function getMinimumNextBid(tokenId) {
    const currentBid = await streamAuctions.auctionHighestBid(tokenId);
    const incPercent = await streamAuctions.incPercent();
    
    if (currentBid.eq(0)) {
        // First bid - use starting price
        return await streamDrops.retrieveAuctionPrice(tokenId);
    } else {
        // Subsequent bids - add percentage
        const increment = currentBid.mul(incPercent).div(100);
        return currentBid.add(increment);
    }
}
```

### Participating in Auctions

#### Place a Bid

```javascript
async function placeBid(tokenId, bidAmount, signer) {
    const streamAuctions = new ethers.Contract(STREAM_AUCTIONS_ADDRESS, streamAuctionsABI, signer);
    
    try {
        // Check if auction is still active
        const isActive = await isTokenInAuction(tokenId);
        if (!isActive) {
            throw new Error('Auction has ended');
        }
        
        // Check minimum bid
        const minBid = await getMinimumNextBid(tokenId);
        if (ethers.utils.parseEther(bidAmount).lt(minBid)) {
            throw new Error(`Bid must be at least ${ethers.utils.formatEther(minBid)} ETH`);
        }
        
        // Place bid
        const tx = await streamAuctions.participateToAuction(tokenId, {
            value: ethers.utils.parseEther(bidAmount),
            gasLimit: 200000 // Recommended gas limit for bid transactions
        });
        
        return await tx.wait();
    } catch (error) {
        console.error('Bid failed:', error.message);
        throw error;
    }
}
```

#### Monitor Bid Events

```javascript
function subscribeToAuctionEvents(tokenId, callbacks) {
    const streamAuctions = new ethers.Contract(STREAM_AUCTIONS_ADDRESS, streamAuctionsABI, provider);
    
    // Listen for new bids
    const participateFilter = streamAuctions.filters.Participate(null, tokenId, null);
    streamAuctions.on(participateFilter, (bidder, tokenId, bid, event) => {
        callbacks.onNewBid({
            bidder,
            tokenId: tokenId.toNumber(),
            bid: ethers.utils.formatEther(bid),
            transactionHash: event.transactionHash
        });
    });
    
    // Listen for claims
    const claimFilter = streamAuctions.filters.ClaimAuction(tokenId, null);
    streamAuctions.on(claimFilter, (tokenId, bid, event) => {
        callbacks.onAuctionClaimed({
            tokenId: tokenId.toNumber(),
            winningBid: ethers.utils.formatEther(bid),
            transactionHash: event.transactionHash
        });
    });
}
```

### Claiming Auctions

```javascript
async function claimAuction(tokenId, signer) {
    const streamAuctions = new ethers.Contract(STREAM_AUCTIONS_ADDRESS, streamAuctionsABI, signer);
    
    try {
        // Check if auction can be claimed
        const auctionState = await getAuctionState(tokenId);
        if (!auctionState.isEnded) {
            throw new Error('Auction has not ended yet');
        }
        if (auctionState.isClaimed) {
            throw new Error('Auction already claimed');
        }
        
        const tx = await streamAuctions.claimAuction(tokenId, {
            gasLimit: 300000 // Recommended gas limit for claim transactions
        });
        
        return await tx.wait();
    } catch (error) {
        console.error('Claim failed:', error.message);
        throw error;
    }
}
```

### Real-time Auction Updates

```javascript
class AuctionMonitor {
    constructor(tokenId, callbacks) {
        this.tokenId = tokenId;
        this.callbacks = callbacks;
        this.pollInterval = null;
        this.eventSubscriptions = [];
    }
    
    async start() {
        // Set up event listeners
        this.subscribeToEvents();
        
        // Start polling for state changes
        this.pollInterval = setInterval(async () => {
            const state = await getAuctionState(this.tokenId);
            this.callbacks.onStateUpdate(state);
            
            // Stop monitoring if claimed
            if (state.isClaimed) {
                this.stop();
            }
        }, 5000); // Poll every 5 seconds
    }
    
    stop() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
        }
        this.eventSubscriptions.forEach(sub => sub.removeAllListeners());
    }
    
    subscribeToEvents() {
        subscribeToAuctionEvents(this.tokenId, {
            onNewBid: (data) => {
                this.callbacks.onNewBid(data);
                // Immediate state update after bid
                this.updateState();
            },
            onAuctionClaimed: (data) => {
                this.callbacks.onAuctionClaimed(data);
                this.stop();
            }
        });
    }
    
    async updateState() {
        const state = await getAuctionState(this.tokenId);
        this.callbacks.onStateUpdate(state);
    }
}
```

---

## Admin Operations

### Creating Auctions

Only the `tdhSigner` address can create auctions:

```javascript
async function createAuction(poster, tokenData, collectionId, startingPrice, endTimestamp, signer) {
    const streamDrops = new ethers.Contract(STREAM_DROPS_ADDRESS, streamDropsABI, signer);
    
    // Validate end time (minimum 10 minutes from now)
    const minEndTime = Math.floor(Date.now() / 1000) + 600;
    if (endTimestamp < minEndTime) {
        throw new Error('Auction must run for at least 10 minutes');
    }
    
    // Validate collection phases are set and active
    const streamMinter = new ethers.Contract(STREAM_MINTER_ADDRESS, streamMinterABI, provider);
    const [startTime, endTime] = await streamMinter.retrieveCollectionPhases(collectionId);
    const currentTime = Math.floor(Date.now() / 1000);
    
    if (startTime == 0 || endTime == 0) {
        throw new Error('Collection phases not set - call setCollectionPhases first');
    }
    if (currentTime < startTime) {
        throw new Error('Collection minting not started');
    }
    if (currentTime > endTime) {
        throw new Error('Collection minting ended');
    }
    
    const tx = await streamDrops.mintDrop(
        poster,
        tokenData,
        collectionId,
        2, // _opt = 2 for auction
        ethers.utils.parseEther(startingPrice),
        endTimestamp
    );
    
    return await tx.wait();
}
```

### Managing System Configuration

#### Update Auction Parameters

```javascript
async function updateAuctionParameters(bidIncrement, extensionTime, adminSigner) {
    const streamAuctions = new ethers.Contract(STREAM_AUCTIONS_ADDRESS, streamAuctionsABI, adminSigner);
    
    // Update bid increment percentage
    const tx1 = await streamAuctions.updatePercentAndExtensionTime(1, bidIncrement);
    await tx1.wait();
    
    // Update extension time (seconds) - any value other than 1
    const tx2 = await streamAuctions.updatePercentAndExtensionTime(0, extensionTime);
    await tx2.wait();
}

async function setCollectionPhases(collectionId, startTime, endTime, adminSigner) {
    const streamMinter = new ethers.Contract(STREAM_MINTER_ADDRESS, streamMinterABI, adminSigner);
    
    const tx = await streamMinter.setCollectionPhases(collectionId, startTime, endTime);
    return await tx.wait();
}
```

#### Update Fund Distribution

```javascript
async function updatePayoutAddresses(platformAddress, curatorsAddress, adminSigner) {
    const streamAuctions = new ethers.Contract(STREAM_AUCTIONS_ADDRESS, streamAuctionsABI, adminSigner);
    
    const tx1 = await streamAuctions.updatePayOutAddress(platformAddress);
    await tx1.wait();
    
    const tx2 = await streamAuctions.updateCuratorsPoolAddress(curatorsAddress);
    await tx2.wait();
    
    // Also update StreamDrops payout addresses
    const streamDrops = new ethers.Contract(STREAM_DROPS_ADDRESS, streamDropsABI, adminSigner);
    const tx3 = await streamDrops.updatePayOutAddress(platformAddress);
    await tx3.wait();
    
    const tx4 = await streamDrops.updateCuratorsPoolAddress(curatorsAddress);
    await tx4.wait();
}
```

#### Change TDH Signer

```javascript
async function updateTDHSigner(newSignerAddress, adminSigner) {
    const streamDrops = new ethers.Contract(STREAM_DROPS_ADDRESS, streamDropsABI, adminSigner);
    
    await streamDrops.updateTDHsigner(newSignerAddress);
}
```

### Permission Management

#### Grant Admin Permissions

```javascript
async function grantAdminPermissions(userAddress, functionSelector, tdhSigner) {
    const streamAdmins = new ethers.Contract(STREAM_ADMINS_ADDRESS, streamAdminsABI, tdhSigner);
    
    // Grant global admin
    await streamAdmins.registerAdmin(userAddress, true);
    
    // Or grant specific function permission
    await streamAdmins.registerFunctionAdmin(userAddress, functionSelector, true);
}
```

**Note**: Only the `tdhSigner` address can call these functions (uses `authorized()` modifier)

#### Access Control Modifiers

```solidity
modifier FunctionAdminRequired(bytes4 _selector)
```
- **Purpose**: Restricts function access to global or function-specific admins
- **Logic**: `adminsContract.retrieveFunctionAdmin(msg.sender, _selector) == true || adminsContract.retrieveGlobalAdmin(msg.sender) == true`
- **Error**: "Not allowed" if neither condition is met

```solidity
modifier authorized()
```
- **Purpose**: Restricts function access to the TDH signer only
- **Logic**: `msg.sender == tdhSigner`
- **Error**: "Not Allowed" if condition is not met

```solidity
modifier streamDropRequired()
```
- **Purpose**: Restricts function access to the StreamDrops contract only
- **Logic**: `msg.sender == streamDrops`
- **Error**: "Not allowed" if condition is not met
- **Usage**: Applied to `mint()` and `mintAndAuction()` functions in StreamMinter

**Critical Note**: Both `mint()` and `mintAndAuction()` functions in StreamMinter can ONLY be called by the StreamDrops contract due to this modifier.

#### Collection Phase Requirements

**Critical**: Before any auction can be created, collection phases must be set:

```solidity
function setCollectionPhases(uint256 _collectionID, uint _publicStartTime, uint _publicEndTime)
```
- **Requirements**: 
  - Collection data must be added first (`gencore.retrievewereDataAdded(_collectionID) == true`)
  - `_publicStartTime` must be ≤ current timestamp for active minting
  - `_publicEndTime` must be ≥ current timestamp for active minting
- **Error**: "Add data" if collection data not set
- **Error**: "Not started" if current time < `_publicStartTime`
- **Error**: "Ended" if current time > `_publicEndTime`

#### Minimum Auction Duration

**Critical**: All auctions must run for minimum 10 minutes:

```solidity
require(_auctionEndTime >= block.timestamp + 600); // 10 minutes minimum
```
- **Enforcement**: In `StreamMinter.mintAndAuction()` function
- **Value**: 600 seconds (10 minutes)
- **Error**: Silent revert if condition not met

---

## Error Handling

### Common Revert Messages

| Error Message | Contract | Function | Cause | Solution |
|---------------|----------|----------|--------|----------|
| "Ended" | StreamAuctions | participateToAuction | Auction time expired | Check `getAuctionEndTime()` |
| "Equal or Higher than starting bid" | StreamAuctions | participateToAuction | Bid too low (first bid) | Use `retrieveAuctionPrice()` |
| "% more than highest bid" | StreamAuctions | participateToAuction | Bid increment too small | Calculate with `incPercent` |
| "ETH failed" | StreamAuctions | participateToAuction | Refund transfer failed | Check recipient contract |
| "err" | StreamAuctions | claimAuction | Claim conditions not met | Verify auction ended and not claimed |
| "ETH failed" | StreamAuctions | claimAuction | Fund distribution failed | Check payout addresses |
| "Contract is not Minter" | StreamAuctions | updateMinterContract | Invalid minter contract | Use valid IStreamMinter contract |
| "Contract is not Admin" | StreamAuctions | updateAdminContract | Invalid admin contract | Use valid IStreamAdmins contract |
| "ETH failed" | StreamAuctions | emergencyWithdraw | Emergency withdrawal failed | Check admin owner address |
| "Not allowed" | StreamAuctions | Admin functions | Insufficient permissions | Check admin status |
| "Drop Executed" | StreamDrops | mintDrop | Duplicate drop hash | Change any parameter |
| "price" | StreamDrops | mintDrop | Incorrect payment amount | Send exact `_price` with transaction |
| "Not found" | StreamDrops | mintDrop | Invalid option parameter | Use `_opt` 1 or 2 only |
| "ETH failed" | StreamDrops | mintDrop | Fund distribution failed | Check payout addresses |
| "Contract is not Admin" | StreamDrops | updateMinterContract | Invalid minter contract (misleading error) | Use valid IStreamMinter contract |
| "Contract is not Admin" | StreamDrops | updateAdminContract | Invalid admin contract | Use valid IStreamAdmins contract |
| "Not Allowed" | StreamDrops | mintDrop | Unauthorized caller | Only tdhSigner can call |
| "Not allowed" | StreamDrops | Admin functions | Insufficient permissions | Check admin status |
| "Not started" | StreamMinter | mint/mintAndAuction | Collection not in public sale | Check `retrieveCollectionPhases()` |
| "Ended" | StreamMinter | mint/mintAndAuction | Collection minting ended | Check `retrieveCollectionPhases()` |
| "No supply" | StreamMinter | mint/mintAndAuction | Collection sold out | Check `viewCirSupply()` |
| "Add data" | StreamMinter | setCollectionPhases | Collection data not set | Call `gencore.setCollectionData()` first |
| Silent revert (no message) | StreamMinter | mintAndAuction | Auction end time too early | Ensure `_auctionEndTime >= block.timestamp + 600` |
| Silent revert (no message) | StreamMinter | updateAuctionEndTime | Invalid token for auction update | Ensure `mintToAuctionStatus[_tokenId] == true` |
| "Contract is not Admin" | StreamMinter | updateContracts | Invalid admin contract | Use valid IStreamAdmins contract |
| "ETH failed" | StreamMinter | emergencyWithdraw | Emergency withdrawal failed | Check admin owner address |
| "Not allowed" | StreamMinter | mint/mintAndAuction | Unauthorized contract call | Only StreamDrops can call mint functions |
| "Not allowed" | StreamMinter | Admin functions | Insufficient permissions | Check admin status |

### Error Handling Patterns

```javascript
async function safePlaceBid(tokenId, bidAmount, signer) {
    try {
        return await placeBid(tokenId, bidAmount, signer);
    } catch (error) {
        if (error.message.includes('Ended')) {
            throw new Error('Auction has ended');
        } else if (error.message.includes('% more than highest bid')) {
            const minBid = await getMinimumNextBid(tokenId);
            throw new Error(`Minimum bid is ${ethers.utils.formatEther(minBid)} ETH`);
        } else if (error.message.includes('Equal or Higher than starting bid')) {
            const startingPrice = await streamDrops.retrieveAuctionPrice(tokenId);
            throw new Error(`First bid must be at least ${ethers.utils.formatEther(startingPrice)} ETH`);
        } else if (error.message.includes('ETH failed')) {
            throw new Error('Refund failed - auction may be blocked');
        } else {
            throw error;
        }
    }
}

async function safeClaimAuction(tokenId, signer) {
    try {
        return await claimAuction(tokenId, signer);
    } catch (error) {
        if (error.message.includes('err')) {
            throw new Error('Cannot claim: auction not ended or already claimed');
        } else if (error.message.includes('ETH failed')) {
            throw new Error('Fund distribution failed - check payout addresses');
        } else {
            throw error;
        }
    }
}
```

### Gas Optimization

```javascript
// Estimate gas before transaction
async function estimateGasForBid(tokenId, bidAmount, signer) {
    const streamAuctions = new ethers.Contract(STREAM_AUCTIONS_ADDRESS, streamAuctionsABI, signer);
    
    try {
        const gasEstimate = await streamAuctions.estimateGas.participateToAuction(tokenId, {
            value: ethers.utils.parseEther(bidAmount)
        });
        
        // Add 20% buffer
        return gasEstimate.mul(120).div(100);
    } catch (error) {
        // Fallback gas limit
        return ethers.BigNumber.from('200000');
    }
}
```

---

## Integration Examples

### React Auction Component

```jsx
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

function AuctionCard({ tokenId, provider, signer }) {
    const [auctionState, setAuctionState] = useState(null);
    const [bidAmount, setBidAmount] = useState('');
    const [loading, setLoading] = useState(false);
    
    useEffect(() => {
        const monitor = new AuctionMonitor(tokenId, {
            onStateUpdate: setAuctionState,
            onNewBid: (data) => {
                console.log('New bid:', data);
                // Update UI immediately
            },
            onAuctionClaimed: (data) => {
                console.log('Auction claimed:', data);
            }
        });
        
        monitor.start();
        
        return () => monitor.stop();
    }, [tokenId]);
    
    const handleBid = async () => {
        if (!bidAmount || !signer) return;
        
        setLoading(true);
        try {
            await placeBid(tokenId, bidAmount, signer);
            setBidAmount('');
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };
    
    const handleClaim = async () => {
        if (!signer) return;
        
        setLoading(true);
        try {
            await claimAuction(tokenId, signer);
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };
    
    if (!auctionState) return <div>Loading...</div>;
    
    return (
        <div className="auction-card">
            <h3>Token #{tokenId}</h3>
            <div>
                <p>Current Bid: {auctionState.currentBid} ETH</p>
                <p>Bidder: {auctionState.currentBidder}</p>
                <p>Ends: {new Date(auctionState.endTime * 1000).toLocaleString()}</p>
            </div>
            
            {auctionState.isActive && !auctionState.isEnded && (
                <div>
                    <input
                        type="number"
                        step="0.01"
                        placeholder="Bid amount (ETH)"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                    />
                    <button onClick={handleBid} disabled={loading}>
                        {loading ? 'Bidding...' : 'Place Bid'}
                    </button>
                </div>
            )}
            
            {auctionState.isEnded && !auctionState.isClaimed && (
                <button onClick={handleClaim} disabled={loading}>
                    {loading ? 'Claiming...' : 'Claim Auction'}
                </button>
            )}
            
            {auctionState.isClaimed && (
                <p>Auction completed!</p>
            )}
        </div>
    );
}
```

### Admin Dashboard Component

```jsx
function AdminDashboard({ signer }) {
    const [auctionParams, setAuctionParams] = useState({
        bidIncrement: 5,
        extensionTime: 300
    });
    
    const updateParameters = async () => {
        try {
            await updateAuctionParameters(
                auctionParams.bidIncrement,
                auctionParams.extensionTime,
                signer
            );
            alert('Parameters updated successfully');
        } catch (error) {
            alert('Failed to update parameters: ' + error.message);
        }
    };
    
    return (
        <div className="admin-dashboard">
            <h2>Auction Parameters</h2>
            <div>
                <label>
                    Bid Increment (%):
                    <input
                        type="number"
                        value={auctionParams.bidIncrement}
                        onChange={(e) => setAuctionParams({
                            ...auctionParams,
                            bidIncrement: parseInt(e.target.value)
                        })}
                    />
                </label>
            </div>
            <div>
                <label>
                    Extension Time (seconds):
                    <input
                        type="number"
                        value={auctionParams.extensionTime}
                        onChange={(e) => setAuctionParams({
                            ...auctionParams,
                            extensionTime: parseInt(e.target.value)
                        })}
                    />
                </label>
            </div>
            <button onClick={updateParameters}>Update Parameters</button>
        </div>
    );
}
```

---

## Security Considerations

### Critical Risks

1. **Centralization Risk**: The `tdhSigner` address has complete control over auction creation and admin permissions.

2. **Permanent Lock Risk**: If an auction is never claimed, the NFT and funds remain locked forever with no recovery mechanism.

3. **Refund Failure Risk**: If the automatic ETH refund fails during bidding, the entire bid transaction reverts, potentially blocking the auction.

4. **Emergency Powers**: Admins can withdraw all contract funds through `emergencyWithdraw()` functions.

5. **Auction Extension Security**: The `updateAuctionEndTime()` function requires both admin permissions AND `mintToAuctionStatus[_tokenId] == true`, preventing unauthorized extensions.

6. **Drop Deduplication**: The system uses `keccak256` hashing to prevent duplicate drops, but changing any parameter allows recreation.

7. **Collection Phase Dependency**: Minting requires collection phases to be properly set with valid start/end times.

8. **Reentrancy Protection**: Only `claimAuction()` function is protected by `nonReentrant` modifier. The `participateToAuction()` function is NOT protected but handles ETH transfers securely through require statements.

9. **Interface Validation**: Contract updates validate interfaces (`isMinterContract()`, `isAdminContract()`) but constructors do not perform validation.

10. **Silent Failures**: Some functions use silent reverts without custom error messages, making debugging difficult.

### Best Practices

1. **Multi-sig for Critical Addresses**: Use multi-signature wallets for `tdhSigner` and admin addresses.

2. **Monitor Unclaimed Auctions**: Implement off-chain monitoring to ensure auctions are claimed promptly.

3. **Gas Estimation**: Always estimate gas for transactions, especially bidding operations.

4. **Event Monitoring**: Subscribe to contract events for real-time updates rather than relying solely on polling.

5. **Fallback Mechanisms**: Implement UI fallbacks for when RPC calls fail or return stale data.

### Recommended Architecture

```javascript
// Separate read and write providers for better performance
const readProvider = new ethers.providers.JsonRpcProvider(RPC_URL);
const writeProvider = new ethers.providers.Web3Provider(window.ethereum);

// Use read provider for queries, write provider for transactions
const auctionState = await getAuctionState(tokenId); // Pass provider if needed
await placeBid(tokenId, bidAmount, writeProvider.getSigner());
```

---

## Contract Addresses

*Note: Update these addresses for your specific deployment*

```javascript
const CONTRACT_ADDRESSES = {
    STREAM_CORE: "0x...", // ERC721 contract (accessed via IStreamCore interface)
    STREAM_MINTER: "0x...",
    STREAM_DROPS: "0x...",
    STREAM_AUCTIONS: "0x...",
    STREAM_ADMINS: "0x..."
};
```

## ABI References

Contract ABIs should be imported from your build artifacts or generated using tools like `typechain` for TypeScript support.

## Fund Distribution Details

### Auction Fund Distribution

When an auction is claimed with bids (`highestBid > 0`):

```solidity
// StreamAuctions.sol:100-105 - Fund distribution logic
uint256 highestBid = auctionHighestBid[_tokenid];

// 50% to poster
(bool success1, ) = payable(dropsContract.retrieveAuctionPoster(_tokenid)).call{value: (highestBid / 2)}("");
require(success1, "ETH failed");

// 25% to platform
(bool success2, ) = payable(payOutAddress).call{value: (highestBid / 4)}("");
require(success2, "ETH failed");

// 25% to curators
(bool success3, ) = payable(curatorsPoolAddress).call{value: (highestBid / 4)}("");
require(success3, "ETH failed");
```

**Distribution Breakdown**:
- **Poster**: 50% of winning bid amount
- **Platform**: 25% of winning bid amount  
- **Curators**: 25% of winning bid amount
- **Calculation**: Uses integer division, any remainder wei stays in contract

### Fixed Sale Fund Distribution

When a fixed price sale is completed:

```solidity
// 50% to poster
(bool success1, ) = payable(poster).call{value: (msg.value / 2)}("");

// 25% to platform
(bool success2, ) = payable(payOutAddress).call{value: (msg.value / 4)}("");

// 25% to curators
(bool success3, ) = payable(curatorsPoolAddress).call{value: (msg.value / 4)}("");
```

### No-Bid Auction Handling

When an auction ends with no bids (`highestBid == 0`):
- No funds are distributed
- NFT is transferred to the execution address (original transaction sender)
- No `ClaimAuction` event is emitted

## Critical Integration Requirements

### Before Integration
1. **Verify Contract Addresses**: Ensure all contract addresses are correct for your deployment
2. **Set Collection Phases**: Call `setCollectionPhases()` before creating any auctions
3. **Check Collection Phases**: Call `retrieveCollectionPhases()` to verify collection is active
4. **Validate Admin Permissions**: Ensure proper admin setup through StreamAdmins contract
5. **Test on Testnet**: Always test auction flows on testnet first

### During Development
1. **Handle All Error Cases**: Implement proper error handling for all documented revert messages
2. **Gas Estimation**: Always estimate gas before transactions, especially for bidding
3. **Event Monitoring**: Subscribe to contract events for real-time updates
4. **State Validation**: Always check auction status and timing before transactions
5. **Minimum Duration**: Ensure auction end times are at least 600 seconds (10 minutes) from creation

### Production Checklist
1. **Multi-sig Setup**: Use multi-signature wallets for all admin addresses
2. **Monitoring**: Implement monitoring for unclaimed auctions
3. **Emergency Procedures**: Have procedures for emergency withdrawals
4. **User Experience**: Provide clear error messages and transaction status updates
5. **Fund Distribution**: Verify payout addresses are correctly configured in both contracts

---

*This documentation has been validated against the actual contract source code and serves as the definitive source of truth for integrating with the 6529 Stream auction system. All function signatures, parameters, error messages, constructor parameters, state variables, events, and access control mechanisms have been verified against the deployed contracts (AuctionContract.sol, StreamDrops.sol, StreamMinter.sol). Last updated: July 2024.*