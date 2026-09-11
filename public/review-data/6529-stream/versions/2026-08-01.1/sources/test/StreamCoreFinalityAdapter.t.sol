// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../smart-contracts/IERC165.sol";
import "../smart-contracts/IStreamCoreFinalityAdapter.sol";
import "../smart-contracts/IStreamCoreFinalitySource.sol";
import "../smart-contracts/StreamArtworkFinalityTypes.sol";
import "../smart-contracts/StreamCoreFinalityAdapter.sol";
import "./helpers/Assertions.sol";
import "./helpers/CharacterizationTestBase.sol";

contract FinalityAdapterCoreMock is IStreamCoreFinalitySource {
    bool internal _exists;
    bool internal _hasMaxSupply;
    uint8 internal _status;
    uint8 internal _supplyMode;
    uint256 internal _maxSupply;
    uint256 internal _mintedEver;
    uint256 internal _nextSerial;
    uint256 internal _liveSupply;
    bool internal _burnsBlocked;
    bool internal _freezeStatus;

    bool internal _tokenMappingExists;
    uint256 internal _tokenCollectionId;
    uint256 internal _tokenSerial;
    bool internal _tokenBurned;
    uint8 internal _tokenLifecycle;

    bool internal _failCollectionContextReads;
    bool internal _failTokenReads;

    function setCollection(
        bool exists_,
        bool hasMaxSupply_,
        uint8 status_,
        uint8 supplyMode_,
        uint256 maxSupply_,
        uint256 mintedEver_,
        uint256 nextSerial_,
        uint256 liveSupply_
    ) external {
        _exists = exists_;
        _hasMaxSupply = hasMaxSupply_;
        _status = status_;
        _supplyMode = supplyMode_;
        _maxSupply = maxSupply_;
        _mintedEver = mintedEver_;
        _nextSerial = nextSerial_;
        _liveSupply = liveSupply_;
    }

    function setToken(
        bool mappingExists_,
        uint256 collectionId_,
        uint256 serial_,
        bool burned_,
        uint8 lifecycle_
    ) external {
        _tokenMappingExists = mappingExists_;
        _tokenCollectionId = collectionId_;
        _tokenSerial = serial_;
        _tokenBurned = burned_;
        _tokenLifecycle = lifecycle_;
    }

    function setFailureModes(bool collectionContextReads_, bool tokenReads_) external {
        _failCollectionContextReads = collectionContextReads_;
        _failTokenReads = tokenReads_;
    }

    function collectionExists(uint256) external view returns (bool) {
        return _exists;
    }

    function collectionHasMaxSupply(uint256) external view returns (bool) {
        require(!_failCollectionContextReads, "collection context read");
        return _hasMaxSupply;
    }

    function collectionStatus(uint256) external view returns (uint8) {
        require(!_failCollectionContextReads, "collection context read");
        return _status;
    }

    function collectionSupplyMode(uint256) external view returns (uint8) {
        require(!_failCollectionContextReads, "collection context read");
        return _supplyMode;
    }

    function collectionMaxSupply(uint256) external view returns (uint256) {
        require(!_failCollectionContextReads, "collection context read");
        return _maxSupply;
    }

    function collectionMintedEver(uint256) external view returns (uint256) {
        require(!_failCollectionContextReads, "collection context read");
        return _mintedEver;
    }

    function collectionNextSerial(uint256) external view returns (uint256) {
        require(!_failCollectionContextReads, "collection context read");
        return _nextSerial;
    }

    function totalSupplyOfCollection(uint256) external view returns (uint256) {
        require(!_failCollectionContextReads, "collection context read");
        return _liveSupply;
    }

    function tokenCollectionIdentity(uint256)
        external
        view
        returns (bool mappingExists, uint256 collectionId, uint256 collectionSerial, bool burned)
    {
        require(!_failTokenReads, "token identity read");
        return (_tokenMappingExists, _tokenCollectionId, _tokenSerial, _tokenBurned);
    }

    function tokenLifecycle(uint256) external view returns (uint8 lifecycle) {
        require(!_failTokenReads, "token lifecycle read");
        return _tokenLifecycle;
    }

    function collectionBurnsBlocked(uint256) external view returns (bool) {
        return _burnsBlocked;
    }

    function collectionFreezeStatus(uint256) external view returns (bool) {
        return _freezeStatus;
    }
}

contract FinalityAdapterMetadataMock {
    bool internal _published;
    bytes32 internal _manifestHash;
    bool internal _fail;

    function setManifest(bool published_, bytes32 manifestHash_) external {
        _published = published_;
        _manifestHash = manifestHash_;
    }

    function setFail(bool fail_) external {
        _fail = fail_;
    }

    function scopeManifest(uint256, bytes32)
        external
        view
        returns (bool published, bytes32 manifestHash)
    {
        require(!_fail, "metadata read");
        return (_published, _manifestHash);
    }
}

contract FinalityAdapterRevertingDependency {
    fallback() external {
        revert("dependency called");
    }
}

contract FinalityAdapterMalformedDependency {
    fallback() external {
        assembly {
            mstore(0, 1)
            return(0, 0x20)
        }
    }
}

contract StreamCoreFinalityAdapterTest is CharacterizationTestBase {
    using Assertions for address;
    using Assertions for bool;
    using Assertions for bytes32;
    using Assertions for uint256;

    uint256 private constant COLLECTION_ID = 42;
    uint256 private constant TOKEN_ID = 1_000_042;
    bytes32 private constant SCOPE_ID = keccak256("release-42");
    bytes32 private constant MANIFEST_HASH = keccak256("scope-manifest");

    FinalityAdapterCoreMock private source;
    FinalityAdapterMetadataMock private metadata;
    StreamCoreFinalityAdapter private adapter;

    function setUp() public {
        source = new FinalityAdapterCoreMock();
        metadata = new FinalityAdapterMetadataMock();
        adapter = new StreamCoreFinalityAdapter(address(source), address(metadata));
        source.setCollection(true, true, 2, 1, 10_000, 900, 901, 850);
    }

    function testPinsSelectorsInterfaceIdBindingsAndStaticReturnLayouts() public view {
        uint256(uint32(IStreamCoreFinalityAdapter.core.selector))
            .assertEq(uint256(uint32(0xf2f4eb26)), "core selector");
        uint256(uint32(IStreamCoreFinalityAdapter.collectionMetadata.selector))
            .assertEq(uint256(uint32(0x89ed2edf)), "metadata selector");
        uint256(uint32(IStreamCoreFinalityAdapter.coreCollectionFinalityFacts.selector))
            .assertEq(uint256(uint32(0x4eb4b6dc)), "collection selector");
        uint256(uint32(IStreamCoreFinalityAdapter.scopedCoreFinalityFacts.selector))
            .assertEq(uint256(uint32(0xde5e2530)), "scoped selector");
        uint256(uint32(type(IStreamCoreFinalityAdapter).interfaceId))
            .assertEq(uint256(uint32(0xebf35615)), "adapter interface id");

        adapter.core().assertEq(address(source), "core binding");
        adapter.collectionMetadata().assertEq(address(metadata), "metadata binding");
        adapter.supportsInterface(0xebf35615).assertTrue("adapter ERC165 support");
        adapter.supportsInterface(type(IERC165).interfaceId).assertTrue("IERC165 support");
        adapter.supportsInterface(0xffffffff).assertFalse("invalid ERC165 id");

        (bool collectionOk, bytes memory collectionData) = address(adapter)
            .staticcall(
                abi.encodeWithSelector(
                    IStreamCoreFinalityAdapter.coreCollectionFinalityFacts.selector, COLLECTION_ID
                )
            );
        collectionOk.assertTrue("collection aggregate call");
        collectionData.length.assertEq(9 * 32, "nine-word collection layout");

        StreamCoreFinalityScopeQuery memory scope = _scope(1, COLLECTION_ID, TOKEN_ID, bytes32(0));
        (bool scopedOk, bytes memory scopedData) = address(adapter)
            .staticcall(
                abi.encodeWithSelector(
                    IStreamCoreFinalityAdapter.scopedCoreFinalityFacts.selector, scope
                )
            );
        scopedOk.assertTrue("scoped aggregate call");
        scopedData.length.assertEq(13 * 32, "thirteen-word scoped layout");
    }

    function testConstructorRejectsZeroAndCodeLessBindings() public {
        vm.expectRevert(
            abi.encodeWithSelector(StreamCoreFinalityAdapter.InvalidCore.selector, address(0))
        );
        new StreamCoreFinalityAdapter(address(0), address(metadata));

        address codeLessCore = address(0xC0DE);
        vm.expectRevert(
            abi.encodeWithSelector(StreamCoreFinalityAdapter.InvalidCore.selector, codeLessCore)
        );
        new StreamCoreFinalityAdapter(codeLessCore, address(metadata));

        vm.expectRevert(
            abi.encodeWithSelector(
                StreamCoreFinalityAdapter.InvalidCollectionMetadata.selector, address(0)
            )
        );
        new StreamCoreFinalityAdapter(address(source), address(0));

        address codeLessMetadata = address(0xBEEF);
        vm.expectRevert(
            abi.encodeWithSelector(
                StreamCoreFinalityAdapter.InvalidCollectionMetadata.selector, codeLessMetadata
            )
        );
        new StreamCoreFinalityAdapter(address(source), codeLessMetadata);
    }

    function testCollectionFactsComposeGranularReadsWithUint256Supplies() public {
        uint256 maxSupply = (uint256(1) << 240) + 99;
        uint256 mintedSupply = (uint256(1) << 200) + 81;
        uint256 liveSupply = (uint256(1) << 200) + 12;
        uint256 nextSerial = (uint256(1) << 128) + 82;
        source.setCollection(true, true, 2, 1, maxSupply, mintedSupply, nextSerial, liveSupply);

        StreamCoreCollectionFinalityFacts memory facts =
            adapter.coreCollectionFinalityFacts(COLLECTION_ID);
        facts.exists.assertTrue("exists");
        facts.hasMaxSupply.assertTrue("has max supply");
        uint256(facts.status).assertEq(2, "status");
        uint256(facts.supplyMode).assertEq(1, "supply mode");
        facts.maxSupply.assertEq(maxSupply, "uint256 max supply");
        facts.mintedSupply.assertEq(mintedSupply, "uint256 minted supply");
        facts.burnedSupply.assertEq(69, "checked burned supply");
        facts.nextCollectionSerial.assertEq(nextSerial, "uint256 next serial");
        facts.collectionConfigHash.assertEq(_expectedConfigHash(), "empty config domain hash");
    }

    function testCollectionFactsRejectImpossibleLiveSupply() public {
        source.setCollection(true, false, 1, 0, 0, 9, 10, 10);
        vm.expectRevert(
            abi.encodeWithSelector(
                StreamCoreFinalityAdapter.LiveSupplyExceedsMintedSupply.selector,
                COLLECTION_ID,
                9,
                10
            )
        );
        adapter.coreCollectionFinalityFacts(COLLECTION_ID);
    }

    function testScopedSemanticNegativesEchoOnlyAndMakeNoDependencyCall() public {
        FinalityAdapterRevertingDependency dependency = new FinalityAdapterRevertingDependency();
        StreamCoreFinalityAdapter guarded =
            new StreamCoreFinalityAdapter(address(dependency), address(dependency));

        for (uint16 rawScopeType = 0; rawScopeType < 256; rawScopeType++) {
            if (rawScopeType == 0 || rawScopeType > 4) {
                _assertEchoOnly(
                    guarded, _scope(uint8(rawScopeType), COLLECTION_ID, TOKEN_ID, SCOPE_ID)
                );
            }
        }

        _assertEchoOnly(guarded, _scope(1, 0, TOKEN_ID, bytes32(0)));
        for (uint8 scopeType = 2; scopeType <= 4; scopeType++) {
            _assertEchoOnly(guarded, _scope(scopeType, 0, 0, SCOPE_ID));
        }

        _assertEchoOnly(guarded, _scope(1, COLLECTION_ID, 0, bytes32(0)));
        _assertEchoOnly(guarded, _scope(1, COLLECTION_ID, TOKEN_ID, SCOPE_ID));

        for (uint8 scopeType = 2; scopeType <= 4; scopeType++) {
            _assertEchoOnly(guarded, _scope(scopeType, COLLECTION_ID, TOKEN_ID, SCOPE_ID));
            _assertEchoOnly(guarded, _scope(scopeType, COLLECTION_ID, 0, bytes32(0)));
        }
    }

    function testTokenScopeRequiresIdentityLifecycleAndBurnAgreement() public {
        StreamCoreFinalityScopeQuery memory query =
            _scope(uint8(StreamFinalityScopeType.TOKEN), COLLECTION_ID, TOKEN_ID, bytes32(0));

        source.setToken(true, COLLECTION_ID, 17, false, 2);
        StreamScopedCoreFinalityFacts memory facts = adapter.scopedCoreFinalityFacts(query);
        _assertCollectionContext(facts);
        facts.scopeExists.assertTrue("minted token exists");
        facts.tokenMappingExists.assertTrue("mapping retained");
        facts.collectionSerial.assertEq(17, "serial retained");
        uint256(facts.tokenLifecycle).assertEq(2, "minted lifecycle");
        facts.burned.assertFalse("minted identity not burned");
        facts.scopeManifestHash.assertEq(bytes32(0), "token manifest is zero in v1");

        source.setToken(true, COLLECTION_ID, 17, true, 3);
        facts = adapter.scopedCoreFinalityFacts(query);
        facts.scopeExists.assertTrue("burned token exists");
        facts.burned.assertTrue("burned identity retained");
        uint256(facts.tokenLifecycle).assertEq(3, "burned lifecycle");

        source.setToken(true, COLLECTION_ID + 1, 17, false, 2);
        adapter.scopedCoreFinalityFacts(query).scopeExists.assertFalse("collection mismatch");

        source.setToken(true, COLLECTION_ID, 17, false, 3);
        adapter.scopedCoreFinalityFacts(query).scopeExists.assertFalse("burn bit mismatch");

        source.setToken(true, COLLECTION_ID, 17, true, 2);
        adapter.scopedCoreFinalityFacts(query).scopeExists.assertFalse("reverse burn mismatch");

        source.setToken(true, COLLECTION_ID, 17, false, 1);
        adapter.scopedCoreFinalityFacts(query).scopeExists.assertFalse("unknown lifecycle");

        source.setToken(false, COLLECTION_ID, 17, false, 2);
        facts = adapter.scopedCoreFinalityFacts(query);
        facts.scopeExists.assertFalse("missing mapping");
        facts.tokenMappingExists.assertFalse("missing mapping retained");
        facts.collectionSerial.assertEq(0, "unavailable serial zero");
        uint256(facts.tokenLifecycle).assertEq(0, "unavailable lifecycle zero");
        facts.burned.assertFalse("unavailable burn bit zero");
    }

    function testUnknownCollectionReturnsNegativeBeforeUnavailableReads() public {
        source.setCollection(false, false, 0, 0, 0, 0, 0, 0);
        source.setToken(true, COLLECTION_ID, 5, false, 2);
        source.setFailureModes(true, true);
        metadata.setFail(true);

        _assertEchoOnly(
            adapter,
            _scope(uint8(StreamFinalityScopeType.TOKEN), COLLECTION_ID, TOKEN_ID, bytes32(0))
        );
        _assertEchoOnly(
            adapter, _scope(uint8(StreamFinalityScopeType.RELEASE), COLLECTION_ID, 0, SCOPE_ID)
        );
    }

    function testReleaseSeasonAndViewRequirePublishedNonzeroScopeManifest() public {
        for (uint8 scopeType = 2; scopeType <= 4; scopeType++) {
            StreamCoreFinalityScopeQuery memory query =
                _scope(scopeType, COLLECTION_ID, 0, bytes32(uint256(SCOPE_ID) + scopeType));

            metadata.setManifest(true, MANIFEST_HASH);
            StreamScopedCoreFinalityFacts memory facts = adapter.scopedCoreFinalityFacts(query);
            _assertCollectionContext(facts);
            facts.scopeExists.assertTrue("published scope exists");
            facts.scopeManifestHash.assertEq(MANIFEST_HASH, "published manifest retained");
            facts.tokenMappingExists.assertFalse("no token mapping for id scope");

            metadata.setManifest(false, MANIFEST_HASH);
            facts = adapter.scopedCoreFinalityFacts(query);
            facts.scopeExists.assertFalse("unpublished scope absent");
            facts.scopeManifestHash.assertEq(bytes32(0), "unpublished manifest unavailable");

            metadata.setManifest(true, bytes32(0));
            facts = adapter.scopedCoreFinalityFacts(query);
            facts.scopeExists.assertFalse("zero manifest scope absent");
            facts.scopeManifestHash.assertEq(bytes32(0), "zero manifest retained");
        }
    }

    function testDependencyFailuresAndMalformedReturndataRevertFailClosed() public {
        FinalityAdapterRevertingDependency revertingDependency =
            new FinalityAdapterRevertingDependency();
        StreamCoreFinalityAdapter revertingAdapter =
            new StreamCoreFinalityAdapter(address(revertingDependency), address(metadata));
        vm.expectRevert();
        revertingAdapter.coreCollectionFinalityFacts(COLLECTION_ID);

        FinalityAdapterMalformedDependency malformedDependency =
            new FinalityAdapterMalformedDependency();
        StreamCoreFinalityAdapter malformedCoreAdapter =
            new StreamCoreFinalityAdapter(address(malformedDependency), address(metadata));
        vm.expectRevert();
        malformedCoreAdapter.scopedCoreFinalityFacts(
            _scope(uint8(StreamFinalityScopeType.TOKEN), COLLECTION_ID, TOKEN_ID, bytes32(0))
        );

        StreamCoreFinalityAdapter malformedMetadataAdapter =
            new StreamCoreFinalityAdapter(address(source), address(malformedDependency));
        vm.expectRevert();
        malformedMetadataAdapter.scopedCoreFinalityFacts(
            _scope(uint8(StreamFinalityScopeType.RELEASE), COLLECTION_ID, 0, SCOPE_ID)
        );
    }

    function testHasNoPayableOrUnknownCallSurface() public {
        vm.deal(address(this), 2 wei);
        (bool paid,) = payable(address(adapter)).call{ value: 1 wei }("");
        paid.assertFalse("plain ether rejected");
        address(adapter).balance.assertEq(0, "no funds accepted");

        (bool unknown,) = address(adapter).call(abi.encodeWithSignature("owner()"));
        unknown.assertFalse("unknown writer-shaped selector rejected");
    }

    function _assertEchoOnly(
        StreamCoreFinalityAdapter target,
        StreamCoreFinalityScopeQuery memory query
    ) private view {
        StreamScopedCoreFinalityFacts memory facts = target.scopedCoreFinalityFacts(query);
        facts.scopeExists.assertFalse("negative scope");
        uint256(facts.scopeType).assertEq(query.scopeType, "scope type echo");
        facts.collectionId.assertEq(query.collectionId, "collection echo");
        facts.tokenId.assertEq(query.tokenId, "token echo");
        facts.scopeId.assertEq(query.scopeId, "scope id echo");
        facts.tokenMappingExists.assertFalse("mapping zero");
        facts.collectionSerial.assertEq(0, "serial zero");
        uint256(facts.tokenLifecycle).assertEq(0, "lifecycle zero");
        facts.burned.assertFalse("burn zero");
        uint256(facts.collectionStatus).assertEq(0, "status zero");
        uint256(facts.collectionSupplyMode).assertEq(0, "supply mode zero");
        facts.collectionConfigHash.assertEq(bytes32(0), "config hash zero");
        facts.scopeManifestHash.assertEq(bytes32(0), "manifest zero");
    }

    function _assertCollectionContext(StreamScopedCoreFinalityFacts memory facts) private view {
        uint256(facts.collectionStatus).assertEq(2, "collection status");
        uint256(facts.collectionSupplyMode).assertEq(1, "collection supply mode");
        facts.collectionConfigHash.assertEq(_expectedConfigHash(), "collection config hash");
    }

    function _scope(uint8 scopeType, uint256 collectionId, uint256 tokenId, bytes32 scopeId)
        private
        pure
        returns (StreamCoreFinalityScopeQuery memory)
    {
        return StreamCoreFinalityScopeQuery({
            scopeType: scopeType, collectionId: collectionId, tokenId: tokenId, scopeId: scopeId
        });
    }

    function _expectedConfigHash() private view returns (bytes32) {
        return keccak256(
            abi.encode(
                StreamFinalityDomains.STREAM_CORE_COLLECTION_CONFIG_EMPTY_V1,
                block.chainid,
                address(source),
                COLLECTION_ID
            )
        );
    }
}
