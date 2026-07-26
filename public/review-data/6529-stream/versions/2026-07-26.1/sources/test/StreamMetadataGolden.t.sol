// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../smart-contracts/StreamCore.sol";
import "../smart-contracts/IRandomizer.sol";
import "../smart-contracts/IRandomizerLifecycle.sol";
import "../smart-contracts/IStreamCore.sol";
import "../smart-contracts/Strings.sol";
import "./helpers/Assertions.sol";
import "./helpers/CharacterizationTestBase.sol";
import "./helpers/StreamFixture.sol";
// MockRandomizer.sol also defines NoopRandomizer, used here to hold pending state.
import "./mocks/MockRandomizer.sol";

contract MetadataLifecycleRandomizer is IRandomizer, IRandomizerLifecycle {
    RandomnessRequest private request;
    bool private lifecycleSupported = true;
    bool private revertStateLookup;

    function calculateTokenHash(uint256, uint256, uint256) external { }

    function isRandomizerContract() external pure returns (bool) {
        return true;
    }

    function supportsRandomizerLifecycle() external view returns (bool) {
        return lifecycleSupported;
    }

    function setTokenState(uint256 collectionId, uint256 tokenId, RandomnessRequestState state)
        external
    {
        request = RandomnessRequest({
            collectionId: collectionId,
            tokenId: tokenId,
            provider: address(this),
            providerRequestId: 1,
            randomizerEpoch: 1,
            state: state,
            requestedBlock: block.number,
            requestedTimestamp: block.timestamp,
            fulfilledBlock: state == RandomnessRequestState.FailedPostProcessing ? block.number : 0,
            fulfilledTimestamp: state == RandomnessRequestState.FailedPostProcessing
                ? block.timestamp
                : 0,
            derivedSeed: bytes32(uint256(1)),
            rawOutputHash: bytes32(uint256(2)),
            failureDataHash: state == RandomnessRequestState.FailedPostProcessing
                ? bytes32(uint256(3))
                : bytes32(0),
            postProcessingRetryCount: 0
        });
    }

    function setStateLookupReverts(bool value) external {
        revertStateLookup = value;
    }

    function setLifecycleSupported(bool value) external {
        lifecycleSupported = value;
    }

    function finalizeToken(IStreamCore core, uint256 collectionId, uint256 tokenId, bytes32 hash)
        external
    {
        core.setTokenHash(collectionId, tokenId, hash);
    }

    function retrieveRandomnessRequest(uint256 requestId)
        external
        view
        returns (RandomnessRequest memory)
    {
        _maybeRevertStateLookup();
        if (request.providerRequestId == requestId) {
            return request;
        }
        return _emptyRequest();
    }

    function retrieveRandomnessRequestForToken(uint256 tokenId)
        external
        view
        returns (RandomnessRequest memory)
    {
        _maybeRevertStateLookup();
        if (request.tokenId == tokenId) {
            return request;
        }
        return _emptyRequest();
    }

    function randomnessRequestState(uint256 requestId)
        external
        view
        returns (RandomnessRequestState)
    {
        _maybeRevertStateLookup();
        return request.providerRequestId == requestId ? request.state : RandomnessRequestState.None;
    }

    function randomnessRequestStateForToken(uint256 tokenId)
        external
        view
        returns (RandomnessRequestState)
    {
        _maybeRevertStateLookup();
        return request.tokenId == tokenId ? request.state : RandomnessRequestState.None;
    }

    function requestToToken(uint256 requestId) external view returns (uint256) {
        return request.providerRequestId == requestId ? request.tokenId : 0;
    }

    function tokenToRequest(uint256 tokenId) external view returns (uint256) {
        return request.tokenId == tokenId ? request.providerRequestId : 0;
    }

    function tokenIdToCollection(uint256 tokenId) external view returns (uint256) {
        return request.tokenId == tokenId ? request.collectionId : 0;
    }

    function pendingRandomnessRequests(uint256 collectionId) external view returns (uint256) {
        return request.collectionId == collectionId
            && request.state == RandomnessRequestState.Pending
            ? 1
            : 0;
    }

    function totalPendingRandomnessRequests() external view returns (uint256) {
        return request.state == RandomnessRequestState.Pending ? 1 : 0;
    }

    function _maybeRevertStateLookup() private view {
        if (revertStateLookup) {
            revert("state unavailable");
        }
    }

    function _emptyRequest() private view returns (RandomnessRequest memory empty) { }
}

contract StreamMetadataGoldenTest is CharacterizationTestBase, StreamFixture {
    using Assertions for bool;
    using Assertions for bytes32;
    using Assertions for string;

    uint256 private constant COLLECTION_ID = 1;
    uint256 private constant TOKEN_ID = 1;
    address private constant RECIPIENT = address(0xA11CE);
    string private constant TOKEN_DATA = "1,2,3";
    uint256 private constant TOKEN_SALT = 7;

    function testMetadataSchemaVersionAndTokenStateViews() public {
        DeployedStream memory pendingDeployment = deployStream(address(0xBEEF), address(0xCAFE));
        NoopRandomizer noopRandomizer = new NoopRandomizer();
        pendingDeployment.core.addRandomizer(COLLECTION_ID, address(noopRandomizer));
        _mintGoldenToken(pendingDeployment);

        pendingDeployment.core.metadataSchemaVersion()
            .assertEq("6529stream-v1", "schema version changed");
        pendingDeployment.core.tokenMetadataState(TOKEN_ID)
            .assertEq("pending", "pending state changed");

        DeployedStream memory finalDeployment = deployStream(address(0xBEEF), address(0xCAFE));
        _mintGoldenToken(finalDeployment);

        finalDeployment.core.tokenMetadataState(TOKEN_ID).assertEq("final", "final state changed");
    }

    function testLifecycleMetadataStateViewsExposeStaleAndFailed() public {
        DeployedStream memory staleDeployment = _deployWithLifecycleRandomizer();
        _mintGoldenToken(staleDeployment);
        MetadataLifecycleRandomizer(address(staleDeployment.randomizer))
            .setTokenState(
                COLLECTION_ID, TOKEN_ID, IRandomizerLifecycle.RandomnessRequestState.Stale
            );

        staleDeployment.core.tokenMetadataState(TOKEN_ID).assertEq("stale", "stale state changed");

        DeployedStream memory failedDeployment = _deployWithLifecycleRandomizer();
        _mintGoldenToken(failedDeployment);
        MetadataLifecycleRandomizer(address(failedDeployment.randomizer))
            .setTokenState(
                COLLECTION_ID,
                TOKEN_ID,
                IRandomizerLifecycle.RandomnessRequestState.FailedPostProcessing
            );

        failedDeployment.core.tokenMetadataState(TOKEN_ID)
            .assertEq("failed", "failed state changed");
    }

    function testLifecycleLookupFailureFallsBackToPendingMetadataState() public {
        DeployedStream memory deployed = _deployWithLifecycleRandomizer();
        _mintGoldenToken(deployed);
        MetadataLifecycleRandomizer lifecycleRandomizer =
            MetadataLifecycleRandomizer(address(deployed.randomizer));
        lifecycleRandomizer.setTokenState(
            COLLECTION_ID, TOKEN_ID, IRandomizerLifecycle.RandomnessRequestState.Stale
        );
        lifecycleRandomizer.setStateLookupReverts(true);

        deployed.core.tokenMetadataState(TOKEN_ID)
            .assertEq("pending", "failed lifecycle lookup should fall back to pending");
        deployed.core.tokenURI(TOKEN_ID)
            .assertEq("ipfs://base/pending", "off-chain fallback URI changed");
    }

    function testUnsupportedLifecycleFallsBackToPendingMetadataState() public {
        DeployedStream memory deployed = _deployWithLifecycleRandomizer();
        _mintGoldenToken(deployed);
        MetadataLifecycleRandomizer lifecycleRandomizer =
            MetadataLifecycleRandomizer(address(deployed.randomizer));
        lifecycleRandomizer.setTokenState(
            COLLECTION_ID, TOKEN_ID, IRandomizerLifecycle.RandomnessRequestState.Stale
        );
        lifecycleRandomizer.setLifecycleSupported(false);

        deployed.core.tokenMetadataState(TOKEN_ID)
            .assertEq("pending", "unsupported lifecycle should fall back to pending");
        deployed.core.tokenURI(TOKEN_ID)
            .assertEq("ipfs://base/pending", "unsupported lifecycle URI changed");
    }

    function testFinalTokenHashOverridesLifecycleStateDisplay() public {
        DeployedStream memory deployed = _deployWithLifecycleRandomizer();
        _mintGoldenToken(deployed);
        MetadataLifecycleRandomizer lifecycleRandomizer =
            MetadataLifecycleRandomizer(address(deployed.randomizer));
        lifecycleRandomizer.setTokenState(
            COLLECTION_ID, TOKEN_ID, IRandomizerLifecycle.RandomnessRequestState.Stale
        );
        lifecycleRandomizer.finalizeToken(
            IStreamCore(address(deployed.core)), COLLECTION_ID, TOKEN_ID, bytes32(uint256(9))
        );

        deployed.core.tokenMetadataState(TOKEN_ID).assertEq("final", "final state changed");
        deployed.core.tokenURI(TOKEN_ID)
            .assertEq("ipfs://base/1", "off-chain final URI changed");
    }

    function testFinalTokenHashDoesNotRequireLifecycleLookup() public {
        DeployedStream memory deployed = _deployWithLifecycleRandomizer();
        _mintGoldenToken(deployed);
        MetadataLifecycleRandomizer lifecycleRandomizer =
            MetadataLifecycleRandomizer(address(deployed.randomizer));
        lifecycleRandomizer.setTokenState(
            COLLECTION_ID, TOKEN_ID, IRandomizerLifecycle.RandomnessRequestState.Stale
        );
        lifecycleRandomizer.finalizeToken(
            IStreamCore(address(deployed.core)), COLLECTION_ID, TOKEN_ID, bytes32(uint256(9))
        );
        lifecycleRandomizer.setStateLookupReverts(true);

        deployed.core.tokenMetadataState(TOKEN_ID).assertEq("final", "final state changed");
        deployed.core.tokenURI(TOKEN_ID)
            .assertEq("ipfs://base/1", "off-chain final URI changed");
    }

    function testEmptyOffchainBaseUriReturnsEmptyForPendingAndFinalTokens() public {
        DeployedStream memory pendingDeployment = deployStream(address(0xBEEF), address(0xCAFE));
        NoopRandomizer noopRandomizer = new NoopRandomizer();
        pendingDeployment.core.addRandomizer(COLLECTION_ID, address(noopRandomizer));
        _setCollectionBaseURI(pendingDeployment.core, "");
        _mintGoldenToken(pendingDeployment);

        pendingDeployment.core.retrieveTokenHash(TOKEN_ID)
            .assertEq(bytes32(0), "pending hash changed");
        pendingDeployment.core.tokenURI(TOKEN_ID)
            .assertEq("", "empty pending off-chain base URI changed");

        DeployedStream memory finalDeployment = deployStream(address(0xBEEF), address(0xCAFE));
        _setCollectionBaseURI(finalDeployment.core, "");
        _mintGoldenToken(finalDeployment);

        bool finalHashSet = finalDeployment.core.retrieveTokenHash(TOKEN_ID) != bytes32(0);
        finalHashSet.assertTrue("expected final hash");
        finalDeployment.core.tokenURI(TOKEN_ID)
            .assertEq("", "empty final off-chain base URI changed");
    }

    function testSetTokenHashRejectsZeroHashReservedForPendingState() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        NoopRandomizer noopRandomizer = new NoopRandomizer();
        deployed.core.addRandomizer(COLLECTION_ID, address(noopRandomizer));
        _mintGoldenToken(deployed);

        vm.prank(address(noopRandomizer));
        vm.expectRevert(abi.encodeWithSelector(StreamCore.ZeroTokenHash.selector));
        deployed.core.setTokenHash(COLLECTION_ID, TOKEN_ID, bytes32(0));

        deployed.core.retrieveTokenHash(TOKEN_ID)
            .assertEq(bytes32(0), "token hash should remain unset after zero-hash rejection");
        deployed.core.tokenMetadataState(TOKEN_ID)
            .assertEq("pending", "zero hash changed metadata state");
    }

    function testOffchainPendingTokenUriMatchesGoldenFile() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        NoopRandomizer noopRandomizer = new NoopRandomizer();
        deployed.core.addRandomizer(COLLECTION_ID, address(noopRandomizer));

        _mintGoldenToken(deployed);

        deployed.core.retrieveTokenHash(TOKEN_ID).assertEq(bytes32(0), "pending hash changed");
        _assertMatchesFixture(
            deployed.core.tokenURI(TOKEN_ID),
            "test/fixtures/metadata/offchain-pending-token-uri.txt",
            "off-chain pending tokenURI"
        );
    }

    function testOffchainFinalTokenUriMatchesGoldenFile() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));

        _mintGoldenToken(deployed);

        (deployed.core.retrieveTokenHash(TOKEN_ID) != bytes32(0)).assertTrue("expected final hash");
        _assertMatchesFixture(
            deployed.core.tokenURI(TOKEN_ID),
            "test/fixtures/metadata/offchain-final-token-uri.txt",
            "off-chain final tokenURI"
        );
    }

    function testOffchainStaleTokenUriMatchesGoldenFile() public {
        DeployedStream memory deployed = _deployWithLifecycleRandomizer();

        _mintGoldenToken(deployed);
        MetadataLifecycleRandomizer(address(deployed.randomizer))
            .setTokenState(
                COLLECTION_ID, TOKEN_ID, IRandomizerLifecycle.RandomnessRequestState.Stale
            );

        _assertMatchesFixture(
            deployed.core.tokenURI(TOKEN_ID),
            "test/fixtures/metadata/offchain-stale-token-uri.txt",
            "off-chain stale tokenURI"
        );
    }

    function testOffchainFailedTokenUriMatchesGoldenFile() public {
        DeployedStream memory deployed = _deployWithLifecycleRandomizer();

        _mintGoldenToken(deployed);
        MetadataLifecycleRandomizer(address(deployed.randomizer))
            .setTokenState(
                COLLECTION_ID,
                TOKEN_ID,
                IRandomizerLifecycle.RandomnessRequestState.FailedPostProcessing
            );

        _assertMatchesFixture(
            deployed.core.tokenURI(TOKEN_ID),
            "test/fixtures/metadata/offchain-failed-token-uri.txt",
            "off-chain failed tokenURI"
        );
    }

    function testOnchainPendingSchemaV1TokenUriMatchesGoldenFile() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        NoopRandomizer noopRandomizer = new NoopRandomizer();
        deployed.core.addRandomizer(COLLECTION_ID, address(noopRandomizer));

        _mintGoldenToken(deployed);
        _setGoldenTokenMetadataInputs(deployed.core);
        deployed.core.changeMetadataView(COLLECTION_ID, true);

        deployed.core.retrieveTokenHash(TOKEN_ID).assertEq(bytes32(0), "pending hash changed");
        _assertMatchesFixture(
            deployed.core.tokenURI(TOKEN_ID),
            "test/fixtures/metadata/onchain-pending-schema-v1-token-uri.txt",
            "schema-v1 on-chain pending tokenURI"
        );
    }

    function testOnchainFinalSchemaV1TokenUriMatchesGoldenFile() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));

        _mintGoldenToken(deployed);
        _setGoldenTokenMetadataInputs(deployed.core);
        deployed.core.changeMetadataView(COLLECTION_ID, true);

        (deployed.core.retrieveTokenHash(TOKEN_ID) != bytes32(0)).assertTrue("expected final hash");
        _assertMatchesFixture(
            deployed.core.tokenURI(TOKEN_ID),
            "test/fixtures/metadata/onchain-final-schema-v1-token-uri.txt",
            "schema-v1 on-chain final tokenURI"
        );
    }

    function testOnchainStaleSchemaV1TokenUriMatchesGoldenFile() public {
        DeployedStream memory deployed = _deployWithLifecycleRandomizer();

        _mintGoldenToken(deployed);
        MetadataLifecycleRandomizer(address(deployed.randomizer))
            .setTokenState(
                COLLECTION_ID, TOKEN_ID, IRandomizerLifecycle.RandomnessRequestState.Stale
            );
        _setGoldenTokenMetadataInputs(deployed.core);
        deployed.core.changeMetadataView(COLLECTION_ID, true);

        _assertMatchesFixture(
            deployed.core.tokenURI(TOKEN_ID),
            "test/fixtures/metadata/onchain-stale-schema-v1-token-uri.txt",
            "schema-v1 on-chain stale tokenURI"
        );
    }

    function testOnchainFailedSchemaV1TokenUriMatchesGoldenFile() public {
        DeployedStream memory deployed = _deployWithLifecycleRandomizer();

        _mintGoldenToken(deployed);
        MetadataLifecycleRandomizer(address(deployed.randomizer))
            .setTokenState(
                COLLECTION_ID,
                TOKEN_ID,
                IRandomizerLifecycle.RandomnessRequestState.FailedPostProcessing
            );
        _setGoldenTokenMetadataInputs(deployed.core);
        deployed.core.changeMetadataView(COLLECTION_ID, true);

        _assertMatchesFixture(
            deployed.core.tokenURI(TOKEN_ID),
            "test/fixtures/metadata/onchain-failed-schema-v1-token-uri.txt",
            "schema-v1 on-chain failed tokenURI"
        );
    }

    function _deployWithLifecycleRandomizer() private returns (DeployedStream memory deployed) {
        deployed = deployStream(address(0xBEEF), address(0xCAFE));
        MetadataLifecycleRandomizer lifecycleRandomizer = new MetadataLifecycleRandomizer();
        deployed.core.addRandomizer(COLLECTION_ID, address(lifecycleRandomizer));
        deployed.randomizer = ImmediateRandomizer(address(lifecycleRandomizer));
    }

    function _mintGoldenToken(DeployedStream memory deployed) private {
        vm.prank(address(deployed.minter));
        deployed.core.mint(TOKEN_ID, RECIPIENT, TOKEN_DATA, TOKEN_SALT, COLLECTION_ID);
    }

    function _setCollectionBaseURI(StreamCore core, string memory baseURI) private {
        string[] memory scripts = new string[](1);
        core.updateCollectionInfo(
            COLLECTION_ID,
            "",
            "",
            "",
            "",
            "",
            baseURI,
            "",
            bytes32(0),
            FULL_COLLECTION_UPDATE_INDEX - 1,
            scripts
        );
    }

    function _setGoldenTokenMetadataInputs(StreamCore core) private {
        uint256[] memory tokenIds = new uint256[](1);
        string[] memory images = new string[](1);
        string[] memory attributes = new string[](1);

        tokenIds[0] = TOKEN_ID;
        images[0] = string.concat("ipfs://image/", Strings.toString(TOKEN_ID), ".png");
        attributes[0] = "{\"trait_type\":\"Mood\",\"value\":\"Calm\"}";

        core.updateImagesAndAttributes(tokenIds, images, attributes);
    }

    function _assertMatchesFixture(
        string memory actual,
        string memory fixturePath,
        string memory message
    ) private view {
        _trimTrailingLineEnding(vm.readFile(fixturePath)).assertEq(actual, message);
    }

    function _trimTrailingLineEnding(string memory raw) private pure returns (string memory) {
        bytes memory rawBytes = bytes(raw);
        uint256 trimmedLength = rawBytes.length;

        while (
            trimmedLength > 0
                && (rawBytes[trimmedLength - 1] == 0x0a || rawBytes[trimmedLength - 1] == 0x0d)
        ) {
            trimmedLength--;
        }

        bytes memory trimmed = new bytes(trimmedLength);
        for (uint256 i = 0; i < trimmedLength; i++) {
            trimmed[i] = rawBytes[i];
        }

        return string(trimmed);
    }
}
