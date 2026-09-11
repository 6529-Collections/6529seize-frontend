// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./helpers/Assertions.sol";
import "./helpers/CharacterizationTestBase.sol";
import "./helpers/StreamFixture.sol";
import "../smart-contracts/IERC721Receiver.sol";
import "../smart-contracts/IRandomizer.sol";
import "../smart-contracts/RandomizerVRF.sol";
import "../smart-contracts/StreamCore.sol";
import "../smart-contracts/StreamRandomizerLifecycle.sol";

contract MockMintManager {
    error ManagerReverted();

    StreamCore private immutable core;

    constructor(StreamCore core_) {
        core = core_;
    }

    function mint(
        uint256 collectionId,
        address initialRecipient,
        string calldata tokenData,
        uint256 salt,
        bytes32 tokenDataHash
    ) external returns (uint256 tokenId, uint256 collectionSerial) {
        return core.mintFromManager(collectionId, initialRecipient, tokenData, salt, tokenDataHash);
    }

    function prepare(
        uint256 collectionId,
        string calldata tokenData,
        uint256,
        bytes32 tokenDataHash,
        bytes32 operationId
    ) external returns (uint256 tokenId, uint256 collectionSerial) {
        return core.prepareMintFromManager(collectionId, tokenData, tokenDataHash, operationId);
    }

    function complete(uint256 tokenId, address initialRecipient, bytes32 operationId, uint256 salt)
        external
    {
        core.completePreparedMintFromManager(tokenId, initialRecipient, operationId, salt);
    }

    function abort(uint256 tokenId, bytes32 operationId) external {
        core.abortPreparedMintFromManager(tokenId, operationId);
    }

    function prepareThenRevert(
        uint256 collectionId,
        string calldata tokenData,
        uint256,
        bytes32 tokenDataHash,
        bytes32 operationId
    ) external {
        core.prepareMintFromManager(collectionId, tokenData, tokenDataHash, operationId);
        revert ManagerReverted();
    }

    function isStreamMintManager() external pure returns (bool) {
        return true;
    }
}

contract NotMintManager { }

contract ManagerVrfCoordinator {
    uint256 public nextRequestId = 1;

    function requestRandomWords(bytes32, uint64, uint16, uint32, uint32)
        external
        returns (uint256 requestId)
    {
        requestId = nextRequestId;
        nextRequestId++;
    }
}

contract PreparedMintReceiver is IERC721Receiver {
    StreamCore private immutable core;

    uint256 public observedTokenId;
    bool public preparedExistsDuringCallback;
    bool public mappingExistsDuringCallback;
    uint256 public collectionIdDuringCallback;
    uint256 public collectionSerialDuringCallback;
    bool public burnedDuringCallback;
    address public ownerDuringCallback;
    uint256 public pendingDuringCallback;

    constructor(StreamCore core_) {
        core = core_;
    }

    function onERC721Received(address, address, uint256 tokenId, bytes calldata)
        external
        returns (bytes4)
    {
        observedTokenId = tokenId;
        StreamCore.PreparedMintRecord memory record = core.preparedMint(tokenId);
        preparedExistsDuringCallback = record.exists;
        (
            mappingExistsDuringCallback,
            collectionIdDuringCallback,
            collectionSerialDuringCallback,
            burnedDuringCallback
        ) = core.tokenCollectionIdentity(tokenId);
        ownerDuringCallback = core.ownerOf(tokenId);
        pendingDuringCallback = core.pendingPreparedMintTokenId();
        return IERC721Receiver.onERC721Received.selector;
    }
}

contract RevertingPreparedMintReceiver is IERC721Receiver {
    error ReceiverRejected();

    function onERC721Received(address, address, uint256, bytes calldata)
        external
        pure
        returns (bytes4)
    {
        revert ReceiverRejected();
    }
}

contract BurningPreparedMintReceiver is IERC721Receiver {
    StreamCore private immutable core;

    uint256 public observedTokenId;
    bool public burnRejected;
    bytes4 public burnRevertSelector;

    constructor(StreamCore core_) {
        core = core_;
    }

    function onERC721Received(address, address, uint256 tokenId, bytes calldata)
        external
        returns (bytes4)
    {
        observedTokenId = tokenId;
        try core.burn(tokenId) { }
        catch (bytes memory revertData) {
            burnRejected = true;
            bytes4 selector;
            if (revertData.length >= 4) {
                assembly {
                    selector := mload(add(revertData, 32))
                }
            }
            burnRevertSelector = selector;
        }
        return IERC721Receiver.onERC721Received.selector;
    }
}

contract ReentrantPreparedMintReceiver is IERC721Receiver {
    StreamCore private immutable core;

    bool public approveSucceeded;
    bool public setApprovalForAllSucceeded;
    bool public transferSucceeded;

    constructor(StreamCore core_) {
        core = core_;
    }

    function onERC721Received(address, address, uint256 tokenId, bytes calldata)
        external
        returns (bytes4)
    {
        // Transfer openness: approvals and transfers are unconditioned even while the
        // completion sentinel is active, so all three owner actions must succeed here.
        core.approve(address(0xB0B), tokenId);
        approveSucceeded = true;
        core.setApprovalForAll(address(0xB0B), true);
        setApprovalForAllSucceeded = true;
        core.transferFrom(address(this), address(0xB0B), tokenId);
        transferSucceeded = true;
        return IERC721Receiver.onERC721Received.selector;
    }
}

contract RevertingManagerRandomizer is IRandomizer {
    error RandomizerRejected();

    function calculateTokenHash(uint256, uint256, uint256) external pure {
        revert RandomizerRejected();
    }

    function isRandomizerContract() external pure returns (bool) {
        return true;
    }
}

contract ReentrantManagerRandomizer is IRandomizer {
    StreamCore private immutable core;
    MockMintManager private immutable manager;

    bool public managerMintRejected;
    bytes4 public managerMintRevertSelector;

    constructor(StreamCore core_, MockMintManager manager_) {
        core = core_;
        manager = manager_;
    }

    function calculateTokenHash(uint256 collectionId, uint256 mintIndex, uint256 saltfunO)
        external
    {
        try manager.mint(
            collectionId,
            address(0xB0B),
            "reentrant-manager-token",
            saltfunO + 1,
            keccak256(bytes("reentrant-manager-token"))
        ) { }
        catch (bytes memory revertData) {
            managerMintRejected = true;
            managerMintRevertSelector = _selectorFrom(revertData);
        }
        core.setTokenHash(
            collectionId, mintIndex, keccak256(abi.encode(collectionId, mintIndex, saltfunO))
        );
    }

    function isRandomizerContract() external pure returns (bool) {
        return true;
    }

    function _selectorFrom(bytes memory revertData) private pure returns (bytes4 selector) {
        if (revertData.length >= 4) {
            assembly {
                selector := mload(add(revertData, 32))
            }
        }
    }
}

contract StreamMintManagerCoreHooksTest is CharacterizationTestBase, StreamFixture {
    using Assertions for address;
    using Assertions for bool;
    using Assertions for bytes32;
    using Assertions for uint256;

    uint256 private constant COLLECTION_ID = 1;
    uint256 private constant FIRST_TOKEN_ID = 1;
    address private constant RECIPIENT = address(0xA11CE);
    string private constant TOKEN_DATA = "manager-token";
    uint256 private constant SALT = 777;
    bytes32 private constant OPERATION_ID = bytes32(uint256(0x9ABC));
    bytes32 private constant RETRY_OPERATION_ID = bytes32(uint256(0xBEEF));

    function testUpdateContractsSetsValidatedMintManager() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        MockMintManager manager = new MockMintManager(deployed.core);
        NotMintManager notManager = new NotMintManager();

        vm.expectRevert(abi.encodeWithSelector(StreamCore.InvalidMintManagerContract.selector));
        deployed.core.updateContracts(4, address(notManager));

        vm.expectRevert(abi.encodeWithSelector(StreamCore.InvalidMintManagerContract.selector));
        deployed.core.updateContracts(4, address(0xB0B));

        deployed.core.updateContracts(4, address(manager));
        deployed.core.mintManager().assertEq(address(manager), "mint manager not stored");
    }

    function testOnlyMintManagerCanUseManagerMintHook() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        bytes32 tokenDataHash = _tokenDataHash();

        vm.expectRevert(abi.encodeWithSelector(StreamCore.NotMintManager.selector));
        deployed.core.mintFromManager(COLLECTION_ID, RECIPIENT, TOKEN_DATA, SALT, tokenDataHash);
    }

    function testOnlyMintManagerCanUsePreparedHooks() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        bytes32 tokenDataHash = _tokenDataHash();

        vm.expectRevert(abi.encodeWithSelector(StreamCore.NotMintManager.selector));
        deployed.core.prepareMintFromManager(COLLECTION_ID, TOKEN_DATA, tokenDataHash, OPERATION_ID);

        vm.expectRevert(abi.encodeWithSelector(StreamCore.NotMintManager.selector));
        deployed.core.completePreparedMintFromManager(FIRST_TOKEN_ID, RECIPIENT, OPERATION_ID, SALT);

        vm.expectRevert(abi.encodeWithSelector(StreamCore.NotMintManager.selector));
        deployed.core.abortPreparedMintFromManager(FIRST_TOKEN_ID, OPERATION_ID);
    }

    function testManagerMintAllocatesNextTokenAndIdentity() public {
        (DeployedStream memory deployed, MockMintManager manager) = _deployWithManager();
        bytes32 tokenDataHash = _tokenDataHash();

        (uint256 tokenId, uint256 collectionSerial) =
            manager.mint(COLLECTION_ID, RECIPIENT, TOKEN_DATA, SALT, tokenDataHash);

        tokenId.assertEq(FIRST_TOKEN_ID, "manager token id");
        collectionSerial.assertEq(1, "manager collection serial");
        deployed.core.ownerOf(tokenId).assertEq(RECIPIENT, "manager recipient");
        deployed.core.viewCirSupply(COLLECTION_ID).assertEq(1, "circulation");
        deployed.core.totalSupply().assertEq(1, "live supply");
        deployed.core.retrieveTokensAirdroppedPerAddress(COLLECTION_ID, RECIPIENT)
            .assertEq(0, "manager mint counted as airdrop");
        deployed.core.retrieveTokenHash(tokenId)
            .assertEq(_expectedTokenHash(tokenId), "manager token hash");

        (bool mappingExists, uint256 collectionId, uint256 serial, bool burned) =
            deployed.core.tokenCollectionIdentity(tokenId);
        mappingExists.assertTrue("identity missing");
        collectionId.assertEq(COLLECTION_ID, "identity collection");
        serial.assertEq(1, "identity serial");
        burned.assertFalse("identity burned");
    }

    function testManagerMintContinuesAfterLegacyMinterPath() public {
        (DeployedStream memory deployed, MockMintManager manager) = _deployWithManager();
        vm.prank(address(deployed.minter));
        deployed.core.mint(FIRST_TOKEN_ID, RECIPIENT, "legacy-token", 1, COLLECTION_ID);

        (uint256 tokenId, uint256 collectionSerial) =
            manager.mint(COLLECTION_ID, RECIPIENT, TOKEN_DATA, SALT, _tokenDataHash());

        tokenId.assertEq(FIRST_TOKEN_ID + 1, "manager did not follow legacy mint");
        collectionSerial.assertEq(2, "manager serial did not follow legacy mint");
        (bool mappingExists,, uint256 serial,) =
            deployed.core.tokenCollectionIdentity(FIRST_TOKEN_ID);
        mappingExists.assertTrue("legacy identity missing");
        serial.assertEq(1, "legacy serial");
    }

    function testManagerMintRejectsWrongTokenDataHashWithoutCounterDrift() public {
        (DeployedStream memory deployed, MockMintManager manager) = _deployWithManager();
        bytes32 wrongHash = bytes32(uint256(0xBAD));

        vm.expectRevert(abi.encodeWithSelector(StreamCore.TokenDataHashMismatch.selector));
        manager.mint(COLLECTION_ID, RECIPIENT, TOKEN_DATA, SALT, wrongHash);

        deployed.core.viewCirSupply(COLLECTION_ID).assertEq(0, "failed mint advanced supply");
        (bool mappingExists, uint256 collectionId, uint256 serial, bool burned) =
            deployed.core.tokenCollectionIdentity(FIRST_TOKEN_ID);
        mappingExists.assertFalse("failed mint wrote identity");
        collectionId.assertEq(0, "failed mint collection");
        serial.assertEq(0, "failed mint serial");
        burned.assertFalse("failed mint burned");
    }

    function testPreparedMintRejectsWrongTokenDataHashWithoutCounterDrift() public {
        (DeployedStream memory deployed, MockMintManager manager) = _deployWithManager();
        bytes32 wrongHash = bytes32(uint256(0xBAD));

        vm.expectRevert(abi.encodeWithSelector(StreamCore.TokenDataHashMismatch.selector));
        manager.prepare(COLLECTION_ID, TOKEN_DATA, SALT, wrongHash, OPERATION_ID);

        deployed.core.viewCirSupply(COLLECTION_ID).assertEq(0, "failed prepare advanced supply");
        deployed.core.pendingPreparedMintTokenId().assertEq(0, "failed prepare set pending");
        deployed.core.preparedMint(FIRST_TOKEN_ID).exists.assertFalse("failed prepare wrote record");
        (bool mappingExists, uint256 collectionId, uint256 serial, bool burned) =
            deployed.core.tokenCollectionIdentity(FIRST_TOKEN_ID);
        mappingExists.assertFalse("failed prepare wrote identity");
        collectionId.assertEq(0, "failed prepare collection");
        serial.assertEq(0, "failed prepare serial");
        burned.assertFalse("failed prepare burned");
    }

    function testManagerHooksRejectFrozenCollection() public {
        (DeployedStream memory deployed, MockMintManager manager) = _deployWithManager();
        manager.mint(COLLECTION_ID, RECIPIENT, TOKEN_DATA, SALT, _tokenDataHash());
        _warpPastFinalSupplyWindow();
        deployed.core.freezeCollection(COLLECTION_ID);

        vm.expectRevert(abi.encodeWithSelector(StreamCore.MetadataFrozen.selector, COLLECTION_ID));
        manager.mint(COLLECTION_ID, RECIPIENT, TOKEN_DATA, SALT, _tokenDataHash());

        vm.expectRevert(abi.encodeWithSelector(StreamCore.MetadataFrozen.selector, COLLECTION_ID));
        manager.prepare(COLLECTION_ID, TOKEN_DATA, SALT, _tokenDataHash(), OPERATION_ID);
    }

    function testManagerHooksRejectSupplyExhaustionWithoutCounterDrift() public {
        (DeployedStream memory deployed, MockMintManager manager) = _deployWithManager();
        bytes32 tokenDataHash = _tokenDataHash();
        for (uint256 i = 0; i < 10; i++) {
            (uint256 tokenId, uint256 mintedSerial) =
                manager.mint(COLLECTION_ID, RECIPIENT, TOKEN_DATA, SALT + i, tokenDataHash);
            tokenId.assertEq(FIRST_TOKEN_ID + i, "minted token id");
            mintedSerial.assertEq(i + 1, "minted serial");
        }

        uint256 exhaustedTokenId = FIRST_TOKEN_ID + 10;

        vm.expectRevert(abi.encodeWithSelector(StreamCore.CollectionSupplyReached.selector));
        manager.mint(COLLECTION_ID, RECIPIENT, TOKEN_DATA, SALT, tokenDataHash);

        vm.expectRevert(abi.encodeWithSelector(StreamCore.CollectionSupplyReached.selector));
        manager.prepare(COLLECTION_ID, TOKEN_DATA, SALT, tokenDataHash, OPERATION_ID);

        deployed.core.viewCirSupply(COLLECTION_ID).assertEq(10, "failed hooks drifted supply");
        (bool mappingExists, uint256 collectionId, uint256 serial, bool burned) =
            deployed.core.tokenCollectionIdentity(exhaustedTokenId);
        mappingExists.assertFalse("exhausted hook wrote identity");
        collectionId.assertEq(0, "exhausted collection");
        serial.assertEq(0, "exhausted serial");
        burned.assertFalse("exhausted burned");
    }

    function testPreparedMintRecordsIdentityWithoutErc721OwnershipThenClearsBeforeCallback()
        public
    {
        (DeployedStream memory deployed, MockMintManager manager) = _deployWithManager();
        bytes32 tokenDataHash = _tokenDataHash();

        (uint256 tokenId, uint256 collectionSerial) =
            manager.prepare(COLLECTION_ID, TOKEN_DATA, SALT, tokenDataHash, OPERATION_ID);

        tokenId.assertEq(FIRST_TOKEN_ID, "prepared token id");
        collectionSerial.assertEq(1, "prepared serial");
        vm.expectRevert(abi.encodeWithSignature("Error(string)", "ERC721: invalid token ID"));
        deployed.core.ownerOf(tokenId);
        vm.expectRevert(abi.encodeWithSelector(StreamCore.TokenNotMinted.selector));
        deployed.core.tokenURI(tokenId);
        deployed.core.viewCirSupply(COLLECTION_ID).assertEq(1, "prepared circulation");
        deployed.core.totalSupply().assertEq(0, "prepared live supply");
        deployed.core.retrieveTokenHash(tokenId).assertEq(bytes32(0), "prepared token hash");
        deployed.core.pendingPreparedMintTokenId().assertEq(tokenId, "pending token id");

        StreamCore.PreparedMintRecord memory record = deployed.core.preparedMint(tokenId);
        record.exists.assertTrue("prepared record missing");
        record.operationId.assertEq(OPERATION_ID, "prepared operation");
        record.collectionId.assertEq(COLLECTION_ID, "prepared collection");

        (bool mappingExists, uint256 collectionId, uint256 serial, bool burned) =
            deployed.core.tokenCollectionIdentity(tokenId);
        mappingExists.assertTrue("prepared identity missing");
        collectionId.assertEq(COLLECTION_ID, "prepared identity collection");
        serial.assertEq(1, "prepared identity serial");
        burned.assertFalse("prepared identity burned");

        PreparedMintReceiver receiver = new PreparedMintReceiver(deployed.core);
        manager.complete(tokenId, address(receiver), OPERATION_ID, SALT);

        receiver.observedTokenId().assertEq(tokenId, "callback token");
        receiver.preparedExistsDuringCallback().assertFalse("prepared visible in callback");
        receiver.mappingExistsDuringCallback().assertTrue("identity missing in callback");
        receiver.collectionIdDuringCallback().assertEq(COLLECTION_ID, "callback collection");
        receiver.collectionSerialDuringCallback().assertEq(1, "callback serial");
        receiver.burnedDuringCallback().assertFalse("callback burned");
        receiver.ownerDuringCallback().assertEq(address(receiver), "callback owner");
        receiver.pendingDuringCallback().assertEq(tokenId, "callback pending sentinel");
        deployed.core.ownerOf(tokenId).assertEq(address(receiver), "prepared owner");
        deployed.core.totalSupply().assertEq(1, "completed live supply");
        deployed.core.preparedMint(tokenId).exists.assertFalse("prepared record not cleared");
        deployed.core.pendingPreparedMintTokenId().assertEq(0, "pending token not cleared");
        deployed.core.retrieveTokenHash(tokenId)
            .assertEq(_expectedTokenHash(tokenId), "completed token hash");
    }

    function testPreparedMintRejectsMismatchedCompleteAndBlocksSecondPrepare() public {
        (DeployedStream memory deployed, MockMintManager manager) = _deployWithManager();
        bytes32 tokenDataHash = _tokenDataHash();
        (uint256 tokenId,) =
            manager.prepare(COLLECTION_ID, TOKEN_DATA, SALT, tokenDataHash, OPERATION_ID);

        vm.expectRevert(abi.encodeWithSelector(StreamCore.PreparedMintMismatch.selector));
        manager.complete(tokenId, RECIPIENT, bytes32(uint256(0xDEAD)), SALT);

        vm.expectRevert(abi.encodeWithSelector(StreamCore.PreparedMintAlreadyPending.selector));
        manager.prepare(COLLECTION_ID, TOKEN_DATA, SALT, tokenDataHash, bytes32(uint256(0xBEEF)));

        deployed.core.viewCirSupply(COLLECTION_ID).assertEq(1, "blocked prepare drifted supply");
        deployed.core.preparedMint(tokenId).exists.assertTrue("prepared record lost");

        manager.complete(tokenId, RECIPIENT, OPERATION_ID, SALT);
        deployed.core.ownerOf(tokenId).assertEq(RECIPIENT, "completed owner");
    }

    function testPreparedMintCompleteRejectsMissingRecord() public {
        (, MockMintManager manager) = _deployWithManager();

        vm.expectRevert(abi.encodeWithSelector(StreamCore.PreparedMintNotFound.selector));
        manager.complete(FIRST_TOKEN_ID, RECIPIENT, OPERATION_ID, SALT);
    }

    function testPreparedMintAbortUnwindsStateAndRejectsStaleCallback() public {
        (DeployedStream memory deployed, MockMintManager manager) = _deployWithManager();
        bytes32 tokenDataHash = _tokenDataHash();
        (uint256 tokenId,) =
            manager.prepare(COLLECTION_ID, TOKEN_DATA, SALT, tokenDataHash, OPERATION_ID);

        vm.expectRevert(abi.encodeWithSelector(StreamCore.PreparedMintMismatch.selector));
        manager.abort(tokenId, bytes32(uint256(0xDEAD)));

        manager.abort(tokenId, OPERATION_ID);

        deployed.core.viewCirSupply(COLLECTION_ID).assertEq(0, "abort did not rewind supply");
        deployed.core.retrieveTokenHash(tokenId).assertEq(bytes32(0), "abort kept hash");
        deployed.core.preparedMint(tokenId).exists.assertFalse("abort kept prepared");
        deployed.core.pendingPreparedMintTokenId().assertEq(0, "abort kept pending token");
        (bool mappingExists, uint256 collectionId, uint256 serial, bool burned) =
            deployed.core.tokenCollectionIdentity(tokenId);
        mappingExists.assertFalse("abort kept identity");
        collectionId.assertEq(0, "abort collection");
        serial.assertEq(0, "abort serial");
        burned.assertFalse("abort burned");
        deployed.core.viewColIDforTokenID(tokenId)
            .assertEq(0, "legacy lookup should clear with the identity record");
        deployed.core.lastAllocatedTokenId().assertEq(0, "abort did not rewind allocator");

        vm.expectRevert(abi.encodeWithSelector(StreamCore.PreparedMintOperationReused.selector));
        manager.prepare(COLLECTION_ID, TOKEN_DATA, SALT, tokenDataHash, OPERATION_ID);

        (uint256 remintedTokenId,) =
            manager.mint(COLLECTION_ID, RECIPIENT, TOKEN_DATA, SALT, tokenDataHash);
        remintedTokenId.assertEq(tokenId, "abort did not free token");
        deployed.core.ownerOf(remintedTokenId).assertEq(RECIPIENT, "reminted owner");
    }

    function testPreparedMintRejectsHashBeforeComplete() public {
        (DeployedStream memory deployed, MockMintManager manager) = _deployWithManager();
        _createSecondCollectionUsingSameRandomizer(deployed);
        (uint256 tokenId,) =
            manager.prepare(COLLECTION_ID, TOKEN_DATA, SALT, _tokenDataHash(), OPERATION_ID);

        vm.expectRevert(abi.encodeWithSelector(StreamCore.TokenIdentityUnknown.selector));
        vm.prank(address(deployed.randomizer));
        deployed.core.setTokenHash(COLLECTION_ID, tokenId, bytes32(uint256(0xCAFE)));

        vm.expectRevert(abi.encodeWithSelector(StreamCore.TokenIdentityUnknown.selector));
        vm.prank(address(deployed.randomizer));
        deployed.core.setTokenHash(2, tokenId, bytes32(uint256(0xD00D)));

        deployed.core.retrieveTokenHash(tokenId).assertEq(bytes32(0), "prepared hash drifted");
        manager.complete(tokenId, RECIPIENT, OPERATION_ID, SALT);
        deployed.core.retrieveTokenHash(tokenId)
            .assertEq(_expectedTokenHash(tokenId), "complete hash");
    }

    function testPreparedMintAbortDoesNotReserveLifecycleRandomizerRequest() public {
        (DeployedStream memory deployed, MockMintManager manager) = _deployWithManager();
        ManagerVrfCoordinator coordinator = new ManagerVrfCoordinator();
        NextGenRandomizerVRF vrf = new NextGenRandomizerVRF(
            1, address(coordinator), address(deployed.core), address(deployed.admins)
        );
        deployed.core.addRandomizer(COLLECTION_ID, address(vrf));
        bytes32 tokenDataHash = _tokenDataHash();
        bytes32 retryOperationId = bytes32(uint256(0xBEEF));

        (uint256 tokenId,) =
            manager.prepare(COLLECTION_ID, TOKEN_DATA, SALT, tokenDataHash, OPERATION_ID);

        vrf.tokenToRequest(tokenId).assertEq(0, "prepare reserved lifecycle request");
        vrf.totalPendingRandomnessRequests().assertEq(0, "prepare left pending request");
        manager.abort(tokenId, OPERATION_ID);

        (uint256 remintedTokenId,) =
            manager.prepare(COLLECTION_ID, TOKEN_DATA, SALT, tokenDataHash, retryOperationId);
        remintedTokenId.assertEq(tokenId, "abort did not release lifecycle token");
        manager.complete(remintedTokenId, RECIPIENT, retryOperationId, SALT);

        vrf.tokenToRequest(remintedTokenId).assertEq(1, "complete did not request randomness");
        uint256(vrf.randomnessRequestStateForToken(remintedTokenId))
            .assertEq(
                uint256(StreamRandomizerLifecycle.RandomnessRequestState.Pending),
                "request not pending"
            );
        deployed.core.retrieveTokenHash(remintedTokenId)
            .assertEq(bytes32(0), "vrf hash set before fulfillment");
    }

    function testPreparedMintBlocksMintsAndBurnsButLeavesTransfersOpenUntilAbort() public {
        (DeployedStream memory deployed, MockMintManager manager) = _deployWithManager();
        vm.prank(address(deployed.minter));
        deployed.core.mint(FIRST_TOKEN_ID, RECIPIENT, "legacy-token", 1, COLLECTION_ID);

        (uint256 preparedTokenId,) =
            manager.prepare(COLLECTION_ID, TOKEN_DATA, SALT, _tokenDataHash(), OPERATION_ID);

        vm.expectRevert(abi.encodeWithSelector(StreamCore.PreparedMintAlreadyPending.selector));
        manager.mint(COLLECTION_ID, RECIPIENT, TOKEN_DATA, SALT, _tokenDataHash());

        vm.expectRevert(abi.encodeWithSelector(StreamCore.PreparedMintAlreadyPending.selector));
        vm.prank(address(deployed.minter));
        deployed.core.mint(preparedTokenId + 1, RECIPIENT, "legacy-token-2", 2, COLLECTION_ID);

        vm.expectRevert(abi.encodeWithSelector(StreamCore.PreparedMintAlreadyPending.selector));
        vm.prank(RECIPIENT);
        deployed.core.burn(FIRST_TOKEN_ID);

        // Transfer openness: approvals and transfers of unrelated minted tokens are never
        // conditioned on prepared-mint state, locks, or pauses.
        vm.prank(RECIPIENT);
        deployed.core.approve(address(0xB0B), FIRST_TOKEN_ID);
        deployed.core.getApproved(FIRST_TOKEN_ID).assertEq(address(0xB0B), "open approval");

        vm.prank(RECIPIENT);
        deployed.core.setApprovalForAll(address(0xB0B), true);
        deployed.core.isApprovedForAll(RECIPIENT, address(0xB0B)).assertTrue("open operator");

        vm.prank(RECIPIENT);
        deployed.core.transferFrom(RECIPIENT, address(0xB0B), FIRST_TOKEN_ID);
        deployed.core.ownerOf(FIRST_TOKEN_ID).assertEq(address(0xB0B), "open transfer");

        vm.prank(address(0xB0B));
        deployed.core.safeTransferFrom(address(0xB0B), RECIPIENT, FIRST_TOKEN_ID);
        deployed.core.ownerOf(FIRST_TOKEN_ID).assertEq(RECIPIENT, "open safe transfer");

        vm.prank(RECIPIENT);
        deployed.core.safeTransferFrom(RECIPIENT, address(0xB0B), FIRST_TOKEN_ID, "");
        deployed.core.ownerOf(FIRST_TOKEN_ID).assertEq(address(0xB0B), "open safe transfer data");

        // The prepared-incomplete token itself has no owner, so ERC-721's own checks reject
        // transfers and approvals for it without any Core conditioning.
        vm.expectRevert(abi.encodeWithSignature("Error(string)", "ERC721: invalid token ID"));
        vm.prank(RECIPIENT);
        deployed.core.approve(address(0xB0B), preparedTokenId);
        vm.expectRevert(abi.encodeWithSignature("Error(string)", "ERC721: invalid token ID"));
        vm.prank(RECIPIENT);
        deployed.core.transferFrom(RECIPIENT, address(0xB0B), preparedTokenId);

        vm.expectRevert(abi.encodeWithSelector(StreamCore.PreparedMintAlreadyPending.selector));
        deployed.core.updateContracts(2, address(deployed.minter));

        MockMintManager replacement = new MockMintManager(deployed.core);
        deployed.core.updateContracts(4, address(replacement));
        deployed.core.mintManager().assertEq(address(replacement), "replacement manager");

        vm.expectRevert(abi.encodeWithSelector(StreamCore.NotMintManager.selector));
        manager.abort(preparedTokenId, OPERATION_ID);

        vm.expectRevert(abi.encodeWithSelector(StreamCore.PreparedMintMismatch.selector));
        replacement.complete(preparedTokenId, address(0xB0B), OPERATION_ID, SALT);

        vm.expectRevert(abi.encodeWithSelector(StreamCore.PreparedMintAlreadyPending.selector));
        deployed.core.addRandomizer(COLLECTION_ID, address(deployed.randomizer));

        vm.expectRevert(abi.encodeWithSelector(StreamCore.PreparedMintAlreadyPending.selector));
        deployed.core.setFinalSupply(COLLECTION_ID);

        replacement.abort(preparedTokenId, OPERATION_ID);

        vm.prank(address(0xB0B));
        deployed.core.transferFrom(address(0xB0B), RECIPIENT, FIRST_TOKEN_ID);
        deployed.core.ownerOf(FIRST_TOKEN_ID).assertEq(RECIPIENT, "transfer after abort");
    }

    function testPreparedMintCompletionCallbackLeavesApprovalsAndTransfersOpen() public {
        (DeployedStream memory deployed, MockMintManager manager) = _deployWithManager();
        (uint256 tokenId,) =
            manager.prepare(COLLECTION_ID, TOKEN_DATA, SALT, _tokenDataHash(), OPERATION_ID);
        ReentrantPreparedMintReceiver receiver = new ReentrantPreparedMintReceiver(deployed.core);

        manager.complete(tokenId, address(receiver), OPERATION_ID, SALT);

        receiver.approveSucceeded().assertTrue("callback approve was conditioned");
        receiver.setApprovalForAllSucceeded().assertTrue("callback operator was conditioned");
        receiver.transferSucceeded().assertTrue("callback transfer was conditioned");
        deployed.core.ownerOf(tokenId).assertEq(address(0xB0B), "callback transfer owner");
        deployed.core.pendingPreparedMintTokenId().assertEq(0, "pending not cleared");
    }

    function testPreparedMintCompleteRandomizerRevertRestoresPendingStateForAbort() public {
        (DeployedStream memory deployed, MockMintManager manager) = _deployWithManager();
        RevertingManagerRandomizer revertingRandomizer = new RevertingManagerRandomizer();
        deployed.core.addRandomizer(COLLECTION_ID, address(revertingRandomizer));
        (uint256 tokenId,) =
            manager.prepare(COLLECTION_ID, TOKEN_DATA, SALT, _tokenDataHash(), OPERATION_ID);

        vm.expectRevert(
            abi.encodeWithSelector(RevertingManagerRandomizer.RandomizerRejected.selector)
        );
        manager.complete(tokenId, RECIPIENT, OPERATION_ID, SALT);

        deployed.core.pendingPreparedMintTokenId().assertEq(tokenId, "pending not restored");
        deployed.core.preparedMint(tokenId).exists.assertTrue("prepared not restored");
        deployed.core.viewCirSupply(COLLECTION_ID).assertEq(1, "circulation not restored");
        deployed.core.totalSupply().assertEq(0, "live supply drifted");
        vm.expectRevert(abi.encodeWithSignature("Error(string)", "ERC721: invalid token ID"));
        deployed.core.ownerOf(tokenId);

        manager.abort(tokenId, OPERATION_ID);
        deployed.core.addRandomizer(COLLECTION_ID, address(deployed.randomizer));
        (uint256 remintedTokenId,) =
            manager.prepare(COLLECTION_ID, TOKEN_DATA, SALT, _tokenDataHash(), RETRY_OPERATION_ID);
        remintedTokenId.assertEq(tokenId, "abort did not release token");
        manager.complete(remintedTokenId, RECIPIENT, RETRY_OPERATION_ID, SALT);
        deployed.core.ownerOf(remintedTokenId).assertEq(RECIPIENT, "retry owner");
    }

    function testPreparedMintWithoutRandomizerCanAbortAndRetryAfterRandomizerConfigured() public {
        (DeployedStream memory deployed, MockMintManager manager) = _deployWithManager();
        uint256 collectionId = 2;
        _createSecondCollectionWithoutRandomizer(deployed);

        (uint256 tokenId,) =
            manager.prepare(collectionId, TOKEN_DATA, SALT, _tokenDataHash(), OPERATION_ID);
        tokenId.assertEq(FIRST_TOKEN_ID, "prepared token id");

        // Completion against a collection with no randomizer must revert; the empty-account
        // call reverts with toolchain-dependent returndata, so assert any revert rather than
        // pinning a message that differs between local and CI Foundry builds.
        vm.expectRevert();
        manager.complete(tokenId, RECIPIENT, OPERATION_ID, SALT);

        deployed.core.pendingPreparedMintTokenId().assertEq(tokenId, "pending not restored");
        deployed.core.preparedMint(tokenId).exists.assertTrue("prepared not restored");
        vm.expectRevert(abi.encodeWithSelector(StreamCore.PreparedMintAlreadyPending.selector));
        deployed.core.addRandomizer(collectionId, address(deployed.randomizer));

        manager.abort(tokenId, OPERATION_ID);
        deployed.core.addRandomizer(collectionId, address(deployed.randomizer));
        (uint256 remintedTokenId,) =
            manager.prepare(collectionId, TOKEN_DATA, SALT, _tokenDataHash(), RETRY_OPERATION_ID);
        remintedTokenId.assertEq(tokenId, "abort did not free token");
        manager.complete(remintedTokenId, RECIPIENT, RETRY_OPERATION_ID, SALT);
        deployed.core.ownerOf(remintedTokenId).assertEq(RECIPIENT, "retry owner");
        deployed.core.retrieveTokenHash(remintedTokenId)
            .assertEq(_expectedTokenHashFor(collectionId, remintedTokenId, SALT), "retry hash");
    }

    function testPreparedMintRevertUnwindsIdentityHashAndCounters() public {
        (DeployedStream memory deployed, MockMintManager manager) = _deployWithManager();
        bytes32 tokenDataHash = _tokenDataHash();

        vm.expectRevert(abi.encodeWithSelector(MockMintManager.ManagerReverted.selector));
        manager.prepareThenRevert(COLLECTION_ID, TOKEN_DATA, SALT, tokenDataHash, OPERATION_ID);

        deployed.core.viewCirSupply(COLLECTION_ID).assertEq(0, "revert advanced supply");
        deployed.core.retrieveTokenHash(FIRST_TOKEN_ID).assertEq(bytes32(0), "revert kept hash");
        deployed.core.preparedMint(FIRST_TOKEN_ID).exists.assertFalse("revert kept prepared");
        deployed.core.pendingPreparedMintTokenId().assertEq(0, "revert kept pending token");
        (bool mappingExists, uint256 collectionId, uint256 serial, bool burned) =
            deployed.core.tokenCollectionIdentity(FIRST_TOKEN_ID);
        mappingExists.assertFalse("revert kept identity");
        collectionId.assertEq(0, "revert collection");
        serial.assertEq(0, "revert serial");
        burned.assertFalse("revert burned");
    }

    function testPreparedMintCompleteRevertRestoresPendingStateForAbort() public {
        (DeployedStream memory deployed, MockMintManager manager) = _deployWithManager();
        (uint256 tokenId,) =
            manager.prepare(COLLECTION_ID, TOKEN_DATA, SALT, _tokenDataHash(), OPERATION_ID);
        RevertingPreparedMintReceiver receiver = new RevertingPreparedMintReceiver();

        vm.expectRevert(
            abi.encodeWithSelector(RevertingPreparedMintReceiver.ReceiverRejected.selector)
        );
        manager.complete(tokenId, address(receiver), OPERATION_ID, SALT);

        deployed.core.pendingPreparedMintTokenId().assertEq(tokenId, "pending not restored");
        deployed.core.preparedMint(tokenId).exists.assertTrue("prepared not restored");
        deployed.core.viewCirSupply(COLLECTION_ID).assertEq(1, "circulation not restored");
        deployed.core.totalSupply().assertEq(0, "live supply drifted");

        manager.abort(tokenId, OPERATION_ID);
        deployed.core.pendingPreparedMintTokenId().assertEq(0, "abort did not clear pending");
        deployed.core.viewCirSupply(COLLECTION_ID).assertEq(0, "abort did not rewind");
    }

    function testPreparedMintBlocksReceiverBurnUntilCompletionFinishes() public {
        (DeployedStream memory deployed, MockMintManager manager) = _deployWithManager();
        (uint256 tokenId,) =
            manager.prepare(COLLECTION_ID, TOKEN_DATA, SALT, _tokenDataHash(), OPERATION_ID);
        BurningPreparedMintReceiver receiver = new BurningPreparedMintReceiver(deployed.core);

        manager.complete(tokenId, address(receiver), OPERATION_ID, SALT);

        receiver.observedTokenId().assertEq(tokenId, "receiver did not observe token");
        receiver.burnRejected().assertTrue("callback burn was not rejected");
        uint256(uint32(receiver.burnRevertSelector()))
            .assertEq(
                uint256(uint32(StreamCore.PreparedMintAlreadyPending.selector)),
                "callback burn selector"
            );
        deployed.core.pendingPreparedMintTokenId().assertEq(0, "pending not cleared");
        deployed.core.totalSupply().assertEq(1, "callback burn changed live supply");
        deployed.core.burnAmount(COLLECTION_ID).assertEq(0, "callback burn count");
        deployed.core.isTokenBurned(tokenId).assertFalse("callback burn audit");
        deployed.core.retrieveTokenHash(tokenId)
            .assertEq(_expectedTokenHash(tokenId), "post-complete hash");
        (bool mappingExists, uint256 collectionId, uint256 serial, bool burned) =
            deployed.core.tokenCollectionIdentity(tokenId);
        mappingExists.assertTrue("completed identity missing");
        collectionId.assertEq(COLLECTION_ID, "completed collection");
        serial.assertEq(1, "completed serial");
        burned.assertFalse("completed burned flag");

        vm.prank(address(receiver));
        deployed.core.burn(tokenId);
        deployed.core.totalSupply().assertEq(0, "post-complete burn live supply");
        deployed.core.burnAmount(COLLECTION_ID).assertEq(1, "post-complete burn count");
        deployed.core.isTokenBurned(tokenId).assertTrue("post-complete burn audit");
    }

    function testPreparedMintBlocksRandomizerReentryIntoManagerMint() public {
        (DeployedStream memory deployed, MockMintManager manager) = _deployWithManager();
        ReentrantManagerRandomizer randomizer =
            new ReentrantManagerRandomizer(deployed.core, manager);
        deployed.core.addRandomizer(COLLECTION_ID, address(randomizer));
        (uint256 tokenId,) =
            manager.prepare(COLLECTION_ID, TOKEN_DATA, SALT, _tokenDataHash(), OPERATION_ID);

        manager.complete(tokenId, RECIPIENT, OPERATION_ID, SALT);

        randomizer.managerMintRejected().assertTrue("randomizer manager mint succeeded");
        uint256(uint32(randomizer.managerMintRevertSelector()))
            .assertEq(
                uint256(uint32(StreamCore.PreparedMintAlreadyPending.selector)),
                "manager mint selector"
            );
        deployed.core.viewCirSupply(COLLECTION_ID).assertEq(1, "reentrant mint advanced supply");
        deployed.core.ownerOf(tokenId).assertEq(RECIPIENT, "owner drifted");
        deployed.core.retrieveTokenHash(tokenId)
            .assertEq(_expectedTokenHash(tokenId), "randomizer hash");
    }

    function testPreparedMintBlocksAdminMetadataMutationUntilCompleted() public {
        (DeployedStream memory deployed, MockMintManager manager) = _deployWithManager();
        bytes32 tokenDataHash = _tokenDataHash();
        (uint256 tokenId,) =
            manager.prepare(COLLECTION_ID, TOKEN_DATA, SALT, tokenDataHash, OPERATION_ID);

        vm.expectRevert(abi.encodeWithSelector(StreamCore.PreparedMintAlreadyPending.selector));
        deployed.core.changeMetadataView(COLLECTION_ID, true);

        string[] memory scripts = new string[](1);
        scripts[0] = "function draw(){}";
        vm.expectRevert(abi.encodeWithSelector(StreamCore.PreparedMintAlreadyPending.selector));
        deployed.core
            .updateCollectionInfo(
                COLLECTION_ID,
                "Genesis",
                "6529",
                "Description",
                "https://6529.io",
                "CC0",
                "ipfs://base/",
                "https://cdn.example/script.js",
                bytes32(0),
                FULL_COLLECTION_UPDATE_INDEX,
                scripts
            );

        vm.expectRevert(abi.encodeWithSelector(StreamCore.PreparedMintAlreadyPending.selector));
        vm.prank(RECIPIENT);
        deployed.core.artistSignature(COLLECTION_ID, "artist-approved");

        vm.expectRevert(abi.encodeWithSelector(StreamCore.PreparedMintAlreadyPending.selector));
        deployed.core.changeTokenData(tokenId, "new-token-data");

        uint256[] memory tokenIds = new uint256[](1);
        tokenIds[0] = tokenId;
        string[] memory images = new string[](1);
        images[0] = "ipfs://image";
        string[] memory attributes = new string[](1);
        attributes[0] = "{}";
        vm.expectRevert(abi.encodeWithSelector(StreamCore.PreparedMintAlreadyPending.selector));
        deployed.core.updateImagesAndAttributes(tokenIds, images, attributes);

        manager.complete(tokenId, RECIPIENT, OPERATION_ID, SALT);
        deployed.core.changeMetadataView(COLLECTION_ID, true);
        deployed.core.tokenURI(tokenId);
    }

    function testSequentialPreparedMintsReuseSentinelAndAllowPriorAsyncHash() public {
        (DeployedStream memory deployed, MockMintManager manager) = _deployWithManager();
        ManagerVrfCoordinator coordinator = new ManagerVrfCoordinator();
        NextGenRandomizerVRF vrf = new NextGenRandomizerVRF(
            1, address(coordinator), address(deployed.core), address(deployed.admins)
        );
        deployed.core.addRandomizer(COLLECTION_ID, address(vrf));
        bytes32 tokenDataHash = _tokenDataHash();
        bytes32 secondOperationId = bytes32(uint256(0xBEEF));

        (uint256 firstTokenId,) =
            manager.prepare(COLLECTION_ID, TOKEN_DATA, SALT, tokenDataHash, OPERATION_ID);
        manager.complete(firstTokenId, RECIPIENT, OPERATION_ID, SALT);
        deployed.core.pendingPreparedMintTokenId().assertEq(0, "first pending not cleared");
        deployed.core.retrieveTokenHash(firstTokenId).assertEq(bytes32(0), "vrf hash early");

        (uint256 secondTokenId, uint256 secondSerial) =
            manager.prepare(COLLECTION_ID, TOKEN_DATA, SALT + 1, tokenDataHash, secondOperationId);
        secondTokenId.assertEq(FIRST_TOKEN_ID + 1, "second prepared token");
        secondSerial.assertEq(2, "second prepared serial");
        deployed.core.pendingPreparedMintTokenId().assertEq(secondTokenId, "second pending not set");

        bytes32 fulfilledHash = bytes32(uint256(0xCAFE));
        vm.prank(address(vrf));
        deployed.core.setTokenHash(COLLECTION_ID, firstTokenId, fulfilledHash);
        deployed.core.retrieveTokenHash(firstTokenId).assertEq(fulfilledHash, "prior hash");
        deployed.core.pendingPreparedMintTokenId()
            .assertEq(secondTokenId, "async hash cleared second sentinel");

        manager.complete(secondTokenId, RECIPIENT, secondOperationId, SALT + 1);
        deployed.core.pendingPreparedMintTokenId().assertEq(0, "second pending not cleared");
        deployed.core.ownerOf(secondTokenId).assertEq(RECIPIENT, "second owner");
    }

    function testLegacyMintRejectsNonSequentialMintIndexWithoutCounterDrift() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));

        vm.expectRevert(abi.encodeWithSelector(StreamCore.TokenIdentityUnknown.selector));
        vm.prank(address(deployed.minter));
        deployed.core.mint(FIRST_TOKEN_ID + 1, RECIPIENT, "legacy-token", 1, COLLECTION_ID);

        deployed.core.viewCirSupply(COLLECTION_ID).assertEq(0, "failed legacy drifted supply");
        (bool mappingExists, uint256 collectionId, uint256 serial, bool burned) =
            deployed.core.tokenCollectionIdentity(FIRST_TOKEN_ID + 1);
        mappingExists.assertFalse("failed legacy wrote identity");
        collectionId.assertEq(0, "failed legacy collection");
        serial.assertEq(0, "failed legacy serial");
        burned.assertFalse("failed legacy burned");
    }

    function testStreamMinterUsesSequentialCoreMintIndex() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        address[] memory recipients = new address[](1);
        recipients[0] = RECIPIENT;
        string[] memory tokenData = new string[](1);
        tokenData[0] = TOKEN_DATA;
        uint256[] memory salts = new uint256[](1);
        salts[0] = SALT;
        uint256[] memory quantities = new uint256[](1);
        quantities[0] = 2;

        vm.prank(address(deployed.drops));
        uint256 lastTokenId =
            deployed.minter.mint(recipients, tokenData, salts, COLLECTION_ID, quantities);

        lastTokenId.assertEq(FIRST_TOKEN_ID + 1, "last minter token");
        deployed.core.ownerOf(FIRST_TOKEN_ID).assertEq(RECIPIENT, "first owner");
        deployed.core.ownerOf(FIRST_TOKEN_ID + 1).assertEq(RECIPIENT, "second owner");
        deployed.core.viewCirSupply(COLLECTION_ID).assertEq(2, "circulation");
        deployed.core.retrieveTokenHash(FIRST_TOKEN_ID)
            .assertEq(_expectedTokenHash(FIRST_TOKEN_ID), "first hash");
        deployed.core.retrieveTokenHash(FIRST_TOKEN_ID + 1)
            .assertEq(_expectedTokenHash(FIRST_TOKEN_ID + 1), "second hash");
    }

    function testManagerMintAfterBurnSkipsBurnedSlot() public {
        (DeployedStream memory deployed, MockMintManager manager) = _deployWithManager();
        (uint256 firstTokenId,) =
            manager.mint(COLLECTION_ID, RECIPIENT, TOKEN_DATA, SALT, _tokenDataHash());
        vm.prank(RECIPIENT);
        deployed.core.burn(firstTokenId);

        (uint256 secondTokenId, uint256 secondSerial) =
            manager.mint(COLLECTION_ID, RECIPIENT, TOKEN_DATA, SALT + 1, _tokenDataHash());

        secondTokenId.assertEq(FIRST_TOKEN_ID + 1, "manager reused burned slot");
        secondSerial.assertEq(2, "manager serial after burn");
        deployed.core.ownerOf(secondTokenId).assertEq(RECIPIENT, "second owner");
        (bool firstExists,, uint256 firstSerial, bool burned) =
            deployed.core.tokenCollectionIdentity(firstTokenId);
        firstExists.assertTrue("burned identity missing");
        firstSerial.assertEq(1, "burned serial");
        burned.assertTrue("burned flag");
    }

    function testBurnedManagerMintRetainsCollectionIdentity() public {
        (DeployedStream memory deployed, MockMintManager manager) = _deployWithManager();
        (uint256 tokenId,) =
            manager.mint(COLLECTION_ID, RECIPIENT, TOKEN_DATA, SALT, _tokenDataHash());

        vm.prank(RECIPIENT);
        deployed.core.burn(tokenId);

        (bool mappingExists, uint256 collectionId, uint256 serial, bool burned) =
            deployed.core.tokenCollectionIdentity(tokenId);
        mappingExists.assertTrue("burned identity missing");
        collectionId.assertEq(COLLECTION_ID, "burned collection");
        serial.assertEq(1, "burned serial");
        burned.assertTrue("burned flag missing");
    }

    function _deployWithManager()
        private
        returns (DeployedStream memory deployed, MockMintManager manager)
    {
        deployed = deployStream(address(0xBEEF), address(0xCAFE));
        manager = new MockMintManager(deployed.core);
        deployed.core.updateContracts(4, address(manager));
    }

    function _createSecondCollectionUsingSameRandomizer(DeployedStream memory deployed) private {
        _createSecondCollectionWithoutRandomizer(deployed);
        deployed.core.addRandomizer(2, address(deployed.randomizer));
    }

    function _createSecondCollectionWithoutRandomizer(DeployedStream memory deployed) private {
        string[] memory scripts = new string[](1);
        scripts[0] = "function drawTwo(){}";
        deployed.core
            .createCollection(
                "Second",
                "6529",
                "Description",
                "https://6529.io",
                "CC0",
                "ipfs://base-two/",
                "https://cdn.example/script-two.js",
                bytes32(0),
                scripts
            );
        deployed.core.setCollectionData(2, address(0xB0B), 5, 10, 1 days);
    }

    function _tokenDataHash() private pure returns (bytes32) {
        return keccak256(bytes(TOKEN_DATA));
    }

    function _warpPastFinalSupplyWindow() private {
        vm.warp(block.timestamp + 31 days + 1);
    }

    function _expectedTokenHash(uint256 tokenId) private pure returns (bytes32) {
        return _expectedTokenHashFor(COLLECTION_ID, tokenId, SALT);
    }

    function _expectedTokenHashFor(uint256 collectionId, uint256 tokenId, uint256 salt)
        private
        pure
        returns (bytes32)
    {
        return keccak256(abi.encode(collectionId, tokenId, salt));
    }
}
