// SPDX-License-Identifier: MIT

/**
 *
 *  @title Drops Contract for 6529 stream
 *  @custom:date 28-June-2024
 *  @custom:version 0.9
 *  @author 6529 team
 */

pragma solidity ^0.8.19;

import "./IStreamMinter.sol";
import "./IStreamAuctions.sol";
import "./Ownable.sol";
import "./IStreamAdmins.sol";
import "./ReentrancyGuard.sol";
import "./StreamPauseDomains.sol";

interface IERC1271 {
    function isValidSignature(bytes32 _hash, bytes memory _signature) external view returns (bytes4);
}

contract StreamDrops is Ownable, ReentrancyGuard {
    uint8 public constant SALE_MODE_FIXED_PRICE = 1;
    uint8 public constant SALE_MODE_AUCTION = 2;
    string public constant EIP712_NAME = "6529StreamDrops";
    string public constant EIP712_VERSION = "1";
    bytes32 public constant EIP712_DOMAIN_TYPEHASH = keccak256(
        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
    );
    bytes32 public constant DROP_ID_TYPEHASH =
        keccak256("DropId(address signer,uint256 signerEpoch,uint256 nonce,uint256 salt)");
    bytes32 public constant DROP_AUTHORIZATION_TYPEHASH = keccak256(
        "DropAuthorization(bytes32 dropId,address poster,address recipient,address payer,uint256 collectionId,uint8 saleMode,bytes32 tokenDataHash,uint256 price,uint256 quantity,uint256 auctionReservePrice,uint256 auctionEndTime,uint256 salt,uint256 nonce,uint256 deadline,uint256 signerEpoch)"
    );

    bytes32 private constant EIP2098_S_MASK =
        0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff;
    uint256 private constant SECP256K1_N_DIV_2 =
        0x7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0;
    bytes4 private constant ERC1271_MAGIC_VALUE = 0x1626ba7e;
    uint16 private constant BASIS_POINTS = 10_000;

    struct DropAuthorization {
        bytes32 dropId;
        address poster;
        address recipient;
        address payer;
        uint256 collectionId;
        uint8 saleMode;
        bytes32 tokenDataHash;
        uint256 price;
        uint256 quantity;
        uint256 auctionReservePrice;
        uint256 auctionEndTime;
        uint256 salt;
        uint256 nonce;
        uint256 deadline;
        uint256 signerEpoch;
    }

    enum FixedPriceCreditType {
        Poster,
        Protocol,
        CuratorReserve
    }

    struct ProceedsSplit {
        uint16 posterBps;
        uint16 protocolBps;
        uint16 curatorBps;
        bool configured;
    }

    // struct that holds a drop's info
    struct dropInfoStruct {
        uint256 tokenid;
        address signerAddress;
        address posterAddress;
        address executionAddress;
    }

    // mapping of dropInfo struct
    mapping(bytes32 => dropInfoStruct) private dropInfo;

    // other variables
    IStreamMinter public minterContract;
    IStreamAdmins public adminsContract;
    address public tdhSigner;
    uint256 public signerEpoch;
    mapping(bytes32 => bool) private consumedDropIds;
    mapping(bytes32 => bool) private cancelledDropIds;
    mapping(uint256 => address) posterAuctionAddress;
    mapping(uint256 => uint256) auctionPrice;
    mapping(uint256 => bytes32) tokenDropID;
    bytes32[] public allDrops;
    address public payOutAddress;
    address public curatorsPoolAddress;
    uint256 public tdhThreshold;
    uint256 public activeTime;
    address public auctionContract;
    mapping(address => uint256) public fixedPricePosterCredits;
    mapping(address => uint256) public fixedPriceProtocolCredits;
    mapping(address => uint256) public fixedPriceCuratorReserveCredits;
    uint256 public totalFixedPricePosterOwed;
    uint256 public totalFixedPriceProtocolOwed;
    uint256 public totalFixedPriceCuratorReserveOwed;
    ProceedsSplit public contractProceedsSplit;
    mapping(uint256 => ProceedsSplit) public collectionProceedsSplits;
    mapping(uint256 => ProceedsSplit) public tokenProceedsSplits;

    event DropAuthorizationConsumed(
        bytes32 indexed dropId,
        address indexed signer,
        address indexed poster,
        address recipient,
        address payer,
        uint256 collectionId,
        uint8 saleMode,
        bytes32 tokenDataHash,
        uint256 deadline,
        uint256 signerEpoch
    );
    event DropAuthorizationCancelled(bytes32 indexed dropId, address indexed admin);
    event SignerEpochChanged(uint256 indexed oldEpoch, uint256 indexed newEpoch);
    event DropSignerChanged(
        address indexed oldSigner, address indexed newSigner, uint256 indexed signerEpoch
    );
    event AuctionContractChanged(
        address indexed oldAuctionContract, address indexed newAuctionContract
    );
    event FixedPriceCreditCreated(
        address indexed _add, bytes32 indexed dropId, uint8 indexed creditType, uint256 funds
    );
    event FixedPriceCreditWithdrawn(
        address indexed _add, address indexed _recipient, uint8 indexed creditType, uint256 funds
    );
    event ProceedsSplitUpdated(
        uint8 indexed scope,
        uint256 indexed scopeId,
        uint16 posterBps,
        uint16 protocolBps,
        uint16 curatorBps,
        address indexed admin
    );
    event ProceedsSplitCleared(uint8 indexed scope, uint256 indexed scopeId, address indexed admin);

    // certain functions can only be called by a global or function admin
    modifier FunctionAdminRequired(bytes4 _selector) {
        require(
            adminsContract.retrieveFunctionAdmin(msg.sender, address(this), _selector) == true
                || adminsContract.retrieveGlobalAdmin(msg.sender) == true,
            "Not allowed"
        );
        _;
    }

    // constructor
    constructor(
        address _tdhSignerContract,
        address _minterContract,
        address _adminsContract,
        address _payOutAddress,
        address _curatorsPoolAddress
    ) {
        require(_tdhSignerContract != address(0), "Zero signer");
        require(_payOutAddress != address(0), "Zero payout");
        require(_curatorsPoolAddress != address(0), "Zero curator");
        tdhSigner = _tdhSignerContract;
        signerEpoch = 1;
        minterContract = IStreamMinter(_minterContract);
        adminsContract = IStreamAdmins(_adminsContract);
        payOutAddress = _payOutAddress;
        curatorsPoolAddress = _curatorsPoolAddress;
        contractProceedsSplit = ProceedsSplit(5000, 2500, 2500, true);
    }

    function isStreamDropsContract() external pure returns (bool) {
        return true;
    }

    // mint a drop
    // opt = 1 --> Fixed price
    // opt = 2 --> Auction
    function mintDrop(
        DropAuthorization calldata _authorization,
        string calldata _tokenData,
        bytes calldata _signature
    ) public payable nonReentrant {
        require(adminsContract.isPaused(StreamPauseDomains.DROP_EXECUTION) == false, "Drop paused");
        bytes32 digest = hashDropAuthorization(_authorization);
        address signer = _validateSigner(digest, _signature);
        _validateAuthorization(_authorization, signer, _tokenData);

        bytes32 dropId = _authorization.dropId;
        consumedDropIds[dropId] = true;
        _emitAuthorizationConsumed(_authorization, signer);

        uint256 tokenid = 0;
        address executionAddress = address(0);
        if (_authorization.saleMode == SALE_MODE_FIXED_PRICE) {
            tokenid = _executeFixedPriceDrop(_authorization, _tokenData);
            executionAddress = _authorization.recipient;
        } else if (_authorization.saleMode == SALE_MODE_AUCTION) {
            tokenid = _executeAuctionDrop(_authorization, _tokenData);
            executionAddress = _authorization.poster;
        } else {
            revert("Not found");
        }
        tokenDropID[tokenid] = dropId;
        dropInfo[dropId].tokenid = tokenid;
        dropInfo[dropId].signerAddress = signer;
        dropInfo[dropId].posterAddress = _authorization.poster;
        dropInfo[dropId].executionAddress = executionAddress;
        allDrops.push(dropId);
    }

    // Update signer contract address
    function updateTDHsigner(address _tsigner)
        public
        FunctionAdminRequired(this.updateTDHsigner.selector)
    {
        require(_tsigner != address(0), "Zero signer");
        address oldSigner = tdhSigner;
        tdhSigner = _tsigner;
        _incrementSignerEpoch();
        emit DropSignerChanged(oldSigner, _tsigner, signerEpoch);
    }

    function incrementSignerEpoch()
        public
        FunctionAdminRequired(this.incrementSignerEpoch.selector)
    {
        _incrementSignerEpoch();
    }

    function cancelDrop(bytes32 _dropId) public FunctionAdminRequired(this.cancelDrop.selector) {
        require(consumedDropIds[_dropId] == false, "Drop consumed");
        require(cancelledDropIds[_dropId] == false, "Already cancelled");
        cancelledDropIds[_dropId] = true;
        emit DropAuthorizationCancelled(_dropId, msg.sender);
    }

    // update payout address
    function updatePayOutAddress(address _payOutAddress)
        public
        FunctionAdminRequired(this.updatePayOutAddress.selector)
    {
        require(_payOutAddress != address(0), "Zero payout");
        payOutAddress = _payOutAddress;
    }

    // update curators pool address
    function updateCuratorsPoolAddress(address _curatorsPoolAddress)
        public
        FunctionAdminRequired(this.updateCuratorsPoolAddress.selector)
    {
        require(_curatorsPoolAddress != address(0), "Zero curator");
        curatorsPoolAddress = _curatorsPoolAddress;
    }

    function updateContractProceedsSplit(uint16 _posterBps, uint16 _protocolBps, uint16 _curatorBps)
        public
        FunctionAdminRequired(this.updateContractProceedsSplit.selector)
    {
        _requireValidProceedsSplit(_posterBps, _protocolBps, _curatorBps);
        contractProceedsSplit = ProceedsSplit(_posterBps, _protocolBps, _curatorBps, true);
        emit ProceedsSplitUpdated(0, 0, _posterBps, _protocolBps, _curatorBps, msg.sender);
    }

    function updateCollectionProceedsSplit(
        uint256 _collectionId,
        uint16 _posterBps,
        uint16 _protocolBps,
        uint16 _curatorBps
    ) public FunctionAdminRequired(this.updateCollectionProceedsSplit.selector) {
        _requireValidProceedsSplit(_posterBps, _protocolBps, _curatorBps);
        collectionProceedsSplits[_collectionId] =
            ProceedsSplit(_posterBps, _protocolBps, _curatorBps, true);
        emit ProceedsSplitUpdated(
            1, _collectionId, _posterBps, _protocolBps, _curatorBps, msg.sender
        );
    }

    function clearCollectionProceedsSplit(uint256 _collectionId)
        public
        FunctionAdminRequired(this.clearCollectionProceedsSplit.selector)
    {
        delete collectionProceedsSplits[_collectionId];
        emit ProceedsSplitCleared(1, _collectionId, msg.sender);
    }

    function updateTokenProceedsSplit(
        uint256 _tokenId,
        uint16 _posterBps,
        uint16 _protocolBps,
        uint16 _curatorBps
    ) public FunctionAdminRequired(this.updateTokenProceedsSplit.selector) {
        _requireValidProceedsSplit(_posterBps, _protocolBps, _curatorBps);
        tokenProceedsSplits[_tokenId] = ProceedsSplit(_posterBps, _protocolBps, _curatorBps, true);
        emit ProceedsSplitUpdated(2, _tokenId, _posterBps, _protocolBps, _curatorBps, msg.sender);
    }

    function clearTokenProceedsSplit(uint256 _tokenId)
        public
        FunctionAdminRequired(this.clearTokenProceedsSplit.selector)
    {
        delete tokenProceedsSplits[_tokenId];
        emit ProceedsSplitCleared(2, _tokenId, msg.sender);
    }

    function updateAuctionContract(address _auctionContract)
        public
        FunctionAdminRequired(this.updateAuctionContract.selector)
    {
        require(_auctionContract != address(0), "Zero auction");
        require(
            IStreamAuctions(_auctionContract).isStreamAuctionsContract() == true,
            "Contract is not Auction"
        );
        address oldAuctionContract = auctionContract;
        auctionContract = _auctionContract;
        emit AuctionContractChanged(oldAuctionContract, _auctionContract);
    }

    // function to update admin contract
    function updateAdminContract(address _newContract)
        public
        FunctionAdminRequired(this.updateAdminContract.selector)
    {
        require(IStreamAdmins(_newContract).isAdminContract() == true, "Contract is not Admin");
        adminsContract = IStreamAdmins(_newContract);
    }

    // function to update admin contract
    function updateMinterContract(address _newContract)
        public
        FunctionAdminRequired(this.updateMinterContract.selector)
    {
        require(IStreamMinter(_newContract).isMinterContract() == true, "Contract is not Admin");
        minterContract = IStreamMinter(_newContract);
    }

    // retrieve executed drops
    function retrieveDrops() public view returns (bytes32[] memory) {
        return (allDrops);
    }

    // retrieve auction poster address given a token id
    function retrieveAuctionPoster(uint256 _tokenid) public view returns (address) {
        return posterAuctionAddress[_tokenid];
    }

    // retrieve auction starting price given a token id
    function retrieveAuctionPrice(uint256 _tokenid) public view returns (uint256) {
        return auctionPrice[_tokenid];
    }

    // retrieve drop info
    function retrieveDropInfo(bytes32 _dropId)
        public
        view
        returns (uint256, address, address, address)
    {
        return (
            dropInfo[_dropId].tokenid,
            dropInfo[_dropId].signerAddress,
            dropInfo[_dropId].posterAddress,
            dropInfo[_dropId].executionAddress
        );
    }

    // retrieve token id given a drop id
    function retrieveTokenID(bytes32 _dropId) public view returns (uint256) {
        return (dropInfo[_dropId].tokenid);
    }

    // retrieve drop id given a token id
    function retrieveDropID(uint256 _tokenid) public view returns (bytes32) {
        return tokenDropID[_tokenid];
    }

    // retrieve execution address
    function retrieveExecutionAddress(uint256 _tokenid) public view returns (address) {
        return dropInfo[retrieveDropID(_tokenid)].executionAddress;
    }

    function withdrawFixedPriceCredit() external {
        withdrawFixedPriceCreditTo(payable(msg.sender));
    }

    function withdrawFixedPriceCreditTo(address payable _recipient) public nonReentrant {
        require(_recipient != address(0), "Zero recipient");
        uint256 posterCredit = fixedPricePosterCredits[msg.sender];
        uint256 protocolCredit = fixedPriceProtocolCredits[msg.sender];
        uint256 credit = posterCredit + protocolCredit;
        require(credit != 0, "No credit");

        fixedPricePosterCredits[msg.sender] = 0;
        fixedPriceProtocolCredits[msg.sender] = 0;
        totalFixedPricePosterOwed -= posterCredit;
        totalFixedPriceProtocolOwed -= protocolCredit;

        (bool success,) = _recipient.call{ value: credit }("");
        require(success, "ETH failed");
        if (posterCredit != 0) {
            emit FixedPriceCreditWithdrawn(
                msg.sender, _recipient, uint8(FixedPriceCreditType.Poster), posterCredit
            );
        }
        if (protocolCredit != 0) {
            emit FixedPriceCreditWithdrawn(
                msg.sender, _recipient, uint8(FixedPriceCreditType.Protocol), protocolCredit
            );
        }
    }

    function releaseFixedPriceCuratorReserveCredit()
        public
        FunctionAdminRequired(this.releaseFixedPriceCuratorReserveCredit.selector)
        nonReentrant
    {
        address payable recipient = payable(curatorsPoolAddress);
        uint256 credit = fixedPriceCuratorReserveCredits[recipient];
        require(credit != 0, "No credit");

        fixedPriceCuratorReserveCredits[recipient] = 0;
        totalFixedPriceCuratorReserveOwed -= credit;

        (bool success,) = recipient.call{ value: credit }("");
        require(success, "ETH failed");
        emit FixedPriceCreditWithdrawn(
            recipient, recipient, uint8(FixedPriceCreditType.CuratorReserve), credit
        );
    }

    function totalFixedPriceOwed() public view returns (uint256) {
        return
            totalFixedPricePosterOwed + totalFixedPriceProtocolOwed
                + totalFixedPriceCuratorReserveOwed;
    }

    function totalPosterOwed() public view returns (uint256) {
        return totalFixedPricePosterOwed;
    }

    function totalProtocolOwed() public view returns (uint256) {
        return totalFixedPriceProtocolOwed;
    }

    function totalCuratorReserved() public view returns (uint256) {
        return totalFixedPriceCuratorReserveOwed;
    }

    function totalReserved() public view returns (uint256) {
        return totalCuratorReserved();
    }

    function totalOwed() public view returns (uint256) {
        return totalFixedPriceOwed();
    }

    function emergencyWithdrawable() public view returns (uint256) {
        return surplus();
    }

    function surplus() public view returns (uint256) {
        uint256 balance = address(this).balance;
        uint256 owed = totalOwed();
        if (balance <= owed) {
            return 0;
        }
        return balance - owed;
    }

    function domainSeparator() public view returns (bytes32) {
        return keccak256(
            abi.encode(
                EIP712_DOMAIN_TYPEHASH,
                keccak256(bytes(EIP712_NAME)),
                keccak256(bytes(EIP712_VERSION)),
                block.chainid,
                address(this)
            )
        );
    }

    function deriveDropId(address _signer, uint256 _signerEpoch, uint256 _nonce, uint256 _salt)
        public
        pure
        returns (bytes32)
    {
        return keccak256(abi.encode(DROP_ID_TYPEHASH, _signer, _signerEpoch, _nonce, _salt));
    }

    /// @notice Derives a drop ID when the authorization salt carries a ZK nullifier hash.
    /// @dev Equivalent to `deriveDropId(_signer, _signerEpoch, _nonce, uint256(_nullifierHash))`.
    /// @param _signer Authorized EOA or ERC-1271 signer contract.
    /// @param _signerEpoch Signer epoch bound to the authorization.
    /// @param _nonce Authorization nonce bound to the drop.
    /// @param _nullifierHash ZK nullifier hash encoded into the authorization salt.
    /// @return dropId Drop ID consumed by `mintDrop`.
    function deriveDropIdFromNullifierHash(
        address _signer,
        uint256 _signerEpoch,
        uint256 _nonce,
        bytes32 _nullifierHash
    ) public pure returns (bytes32) {
        return deriveDropId(_signer, _signerEpoch, _nonce, uint256(_nullifierHash));
    }

    /// @notice Returns the ZK nullifier hash encoded in a drop authorization salt.
    /// @dev Non-ZK integrations may continue to treat the salt as opaque entropy.
    /// @param _authorization Drop authorization whose salt may carry a nullifier hash.
    /// @return nullifierHash Authorization salt interpreted as a bytes32 nullifier hash.
    function authorizationNullifierHash(DropAuthorization calldata _authorization)
        public
        pure
        returns (bytes32)
    {
        return bytes32(_authorization.salt);
    }

    function hashDropAuthorization(DropAuthorization calldata _authorization)
        public
        view
        returns (bytes32)
    {
        bytes32 structHash = keccak256(abi.encode(DROP_AUTHORIZATION_TYPEHASH, _authorization));
        return keccak256(abi.encodePacked("\x19\x01", domainSeparator(), structHash));
    }

    function isDropConsumed(bytes32 _dropId) public view returns (bool) {
        return consumedDropIds[_dropId];
    }

    function isDropCancelled(bytes32 _dropId) public view returns (bool) {
        return cancelledDropIds[_dropId];
    }

    function proceedsSplitFor(uint256 _collectionId, uint256 _tokenId)
        public
        view
        returns (uint16 posterBps, uint16 protocolBps, uint16 curatorBps)
    {
        ProceedsSplit memory split = tokenProceedsSplits[_tokenId];
        if (split.configured) {
            return (split.posterBps, split.protocolBps, split.curatorBps);
        }

        split = collectionProceedsSplits[_collectionId];
        if (split.configured) {
            return (split.posterBps, split.protocolBps, split.curatorBps);
        }

        split = contractProceedsSplit;
        return (split.posterBps, split.protocolBps, split.curatorBps);
    }

    function _validateAuthorization(
        DropAuthorization calldata _authorization,
        address _signer,
        string calldata _tokenData
    ) private view {
        require(_signer == tdhSigner, "Wrong signer");
        require(_authorization.signerEpoch == signerEpoch, "Bad epoch");
        require(_authorization.deadline >= block.timestamp, "Expired");
        require(_authorization.dropId != bytes32(0), "Zero drop");
        require(
            _authorization.dropId
                == deriveDropId(
                    _signer, _authorization.signerEpoch, _authorization.nonce, _authorization.salt
                ),
            "Bad dropId"
        );
        require(consumedDropIds[_authorization.dropId] == false, "Drop Executed");
        require(cancelledDropIds[_authorization.dropId] == false, "Drop cancelled");
        require(_authorization.poster != address(0), "Zero poster");
        require(_authorization.quantity == 1, "Bad quantity");
        require(keccak256(bytes(_tokenData)) == _authorization.tokenDataHash, "Token data");

        if (_authorization.saleMode == SALE_MODE_FIXED_PRICE) {
            require(_authorization.recipient != address(0), "Zero recipient");
            require(_authorization.auctionReservePrice == 0, "Auction price");
            require(_authorization.auctionEndTime == 0, "Auction end");
            require(msg.value == _authorization.price, "price");
            if (_authorization.price == 0) {
                require(_authorization.payer == address(0), "payer");
            } else {
                require(_authorization.payer == msg.sender, "payer");
            }
        } else if (_authorization.saleMode == SALE_MODE_AUCTION) {
            require(_authorization.recipient == address(0), "Auction recipient");
            require(_authorization.payer == address(0), "payer");
            require(_authorization.price == 0, "Fixed price");
            require(msg.value == 0, "price");
        } else {
            revert("Not found");
        }
    }

    function _incrementSignerEpoch() private {
        uint256 oldEpoch = signerEpoch;
        signerEpoch = oldEpoch + 1;
        emit SignerEpochChanged(oldEpoch, signerEpoch);
    }

    function _executeFixedPriceDrop(
        DropAuthorization calldata _authorization,
        string calldata _tokenData
    ) private returns (uint256) {
        uint256[] memory salt = new uint256[](1);
        uint256[] memory num = new uint256[](1);
        string[] memory tokenData = new string[](1);
        address[] memory receiver = new address[](1);
        receiver[0] = _authorization.recipient;
        salt[0] = 0;
        num[0] = 1;
        tokenData[0] = _tokenData;
        uint256 tokenId =
            minterContract.mint(receiver, tokenData, salt, _authorization.collectionId, num);
        if (msg.value != 0) {
            _creditFixedPriceProceeds(
                _authorization.dropId,
                _authorization.collectionId,
                tokenId,
                _authorization.poster,
                msg.value
            );
        }
        return tokenId;
    }

    function _creditFixedPriceProceeds(
        bytes32 _dropId,
        uint256 _collectionId,
        uint256 _tokenId,
        address _poster,
        uint256 _payment
    ) private {
        (uint256 posterCredit, uint256 protocolCredit, uint256 curatorReserveCredit) =
            _splitPayment(_collectionId, _tokenId, _payment);

        if (posterCredit != 0) {
            fixedPricePosterCredits[_poster] += posterCredit;
            totalFixedPricePosterOwed += posterCredit;
            emit FixedPriceCreditCreated(
                _poster, _dropId, uint8(FixedPriceCreditType.Poster), posterCredit
            );
        }
        if (protocolCredit != 0) {
            fixedPriceProtocolCredits[payOutAddress] += protocolCredit;
            totalFixedPriceProtocolOwed += protocolCredit;
            emit FixedPriceCreditCreated(
                payOutAddress, _dropId, uint8(FixedPriceCreditType.Protocol), protocolCredit
            );
        }
        if (curatorReserveCredit != 0) {
            fixedPriceCuratorReserveCredits[curatorsPoolAddress] += curatorReserveCredit;
            totalFixedPriceCuratorReserveOwed += curatorReserveCredit;
            emit FixedPriceCreditCreated(
                curatorsPoolAddress,
                _dropId,
                uint8(FixedPriceCreditType.CuratorReserve),
                curatorReserveCredit
            );
        }
    }

    function _splitPayment(uint256 _collectionId, uint256 _tokenId, uint256 _payment)
        private
        view
        returns (uint256 posterCredit, uint256 protocolCredit, uint256 curatorCredit)
    {
        (uint16 posterBps,, uint16 curatorBps) = proceedsSplitFor(_collectionId, _tokenId);
        posterCredit = _payment * uint256(posterBps) / BASIS_POINTS;
        curatorCredit = _payment * uint256(curatorBps) / BASIS_POINTS;
        // Protocol receives integer remainders so curator opt-outs remain exact.
        protocolCredit = _payment - posterCredit - curatorCredit;
    }

    function _requireValidProceedsSplit(uint16 _posterBps, uint16 _protocolBps, uint16 _curatorBps)
        private
        pure
    {
        require(
            uint256(_posterBps) + uint256(_protocolBps) + uint256(_curatorBps) == BASIS_POINTS,
            "Bad split"
        );
    }

    function _executeAuctionDrop(
        DropAuthorization calldata _authorization,
        string calldata _tokenData
    ) private returns (uint256) {
        require(auctionContract != address(0), "No auction");
        uint256 tokenid = minterContract.mintAndAuction(
            auctionContract,
            _tokenData,
            0,
            _authorization.collectionId,
            _authorization.auctionEndTime
        );
        posterAuctionAddress[tokenid] = _authorization.poster;
        auctionPrice[tokenid] = _authorization.auctionReservePrice;
        IStreamAuctions(auctionContract)
            .registerAuction(
                _authorization.dropId,
                tokenid,
                _authorization.collectionId,
                _authorization.poster,
                _authorization.auctionReservePrice,
                _authorization.auctionEndTime
            );
        return tokenid;
    }

    function _emitAuthorizationConsumed(DropAuthorization calldata _authorization, address _signer)
        private
    {
        emit DropAuthorizationConsumed(
            _authorization.dropId,
            _signer,
            _authorization.poster,
            _authorization.recipient,
            _authorization.payer,
            _authorization.collectionId,
            _authorization.saleMode,
            _authorization.tokenDataHash,
            _authorization.deadline,
            _authorization.signerEpoch
        );
    }

    function _recoverEOASigner(bytes32 _digest, bytes calldata _signature)
        private
        pure
        returns (address)
    {
        bytes32 r;
        bytes32 s;
        uint8 v;
        if (_signature.length == 65) {
            assembly {
                r := calldataload(_signature.offset)
                s := calldataload(add(_signature.offset, 32))
                v := byte(0, calldataload(add(_signature.offset, 64)))
            }
        } else if (_signature.length == 64) {
            bytes32 vs;
            assembly {
                r := calldataload(_signature.offset)
                vs := calldataload(add(_signature.offset, 32))
            }
            s = vs & EIP2098_S_MASK;
            v = uint8((uint256(vs) >> 255) + 27);
        } else {
            revert("Bad signature");
        }

        require(uint256(s) <= SECP256K1_N_DIV_2, "High s");
        require(v == 27 || v == 28, "Bad v");
        address signer = ecrecover(_digest, v, r, s);
        require(signer != address(0), "Zero signer");
        return signer;
    }

    function _validateSigner(bytes32 _digest, bytes calldata _signature)
        private
        view
        returns (address)
    {
        address signer = tdhSigner;
        if (signer.code.length == 0) {
            return _recoverEOASigner(_digest, _signature);
        }

        (bool success, bytes memory returnData) = signer.staticcall(
            abi.encodeWithSelector(IERC1271.isValidSignature.selector, _digest, _signature)
        );
        require(success, "Bad contract sig");
        require(returnData.length == 32, "Bad contract sig");
        require(abi.decode(returnData, (bytes4)) == ERC1271_MAGIC_VALUE, "Bad contract sig");
        return signer;
    }
}
