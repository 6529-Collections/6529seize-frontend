// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./IERC165.sol";
import "./IStreamCoreFinalityAdapter.sol";
import "./IStreamCoreFinalitySource.sol";
import "./IStreamFinalityMetadataReads.sol";
import "./StreamArtworkFinalityTypes.sol";

/// @notice Immutable read-only composition boundary for artwork-finality Core facts.
/// @dev Keeps aggregate finality reads out of StreamCore while binding the exact Core and
///      collection-metadata deployments whose granular state is composed here.
contract StreamCoreFinalityAdapter is IStreamCoreFinalityAdapter {
    error InvalidCore(address core);
    error InvalidCollectionMetadata(address collectionMetadata);
    error LiveSupplyExceedsMintedSupply(
        uint256 collectionId, uint256 mintedSupply, uint256 liveSupply
    );

    address public immutable override core;
    address public immutable override collectionMetadata;

    constructor(address core_, address collectionMetadata_) {
        if (core_ == address(0) || core_.code.length == 0) {
            revert InvalidCore(core_);
        }
        if (collectionMetadata_ == address(0) || collectionMetadata_.code.length == 0) {
            revert InvalidCollectionMetadata(collectionMetadata_);
        }
        core = core_;
        collectionMetadata = collectionMetadata_;
    }

    /// @inheritdoc IStreamCoreFinalityAdapter
    function coreCollectionFinalityFacts(uint256 collectionId)
        external
        view
        override
        returns (StreamCoreCollectionFinalityFacts memory facts)
    {
        IStreamCoreFinalitySource source = IStreamCoreFinalitySource(core);
        uint256 mintedSupply = source.collectionMintedEver(collectionId);
        uint256 liveSupply = source.totalSupplyOfCollection(collectionId);
        if (liveSupply > mintedSupply) {
            revert LiveSupplyExceedsMintedSupply(collectionId, mintedSupply, liveSupply);
        }

        facts = StreamCoreCollectionFinalityFacts({
            exists: source.collectionExists(collectionId),
            hasMaxSupply: source.collectionHasMaxSupply(collectionId),
            status: source.collectionStatus(collectionId),
            supplyMode: source.collectionSupplyMode(collectionId),
            maxSupply: source.collectionMaxSupply(collectionId),
            mintedSupply: mintedSupply,
            burnedSupply: mintedSupply - liveSupply,
            nextCollectionSerial: source.collectionNextSerial(collectionId),
            collectionConfigHash: _collectionConfigHash(collectionId)
        });
    }

    /// @inheritdoc IStreamCoreFinalityAdapter
    function scopedCoreFinalityFacts(StreamCoreFinalityScopeQuery calldata scope)
        external
        view
        override
        returns (StreamScopedCoreFinalityFacts memory facts)
    {
        facts.scopeType = scope.scopeType;
        facts.collectionId = scope.collectionId;
        facts.tokenId = scope.tokenId;
        facts.scopeId = scope.scopeId;

        if (!_canonicalScopedQuery(scope)) {
            return facts;
        }

        IStreamCoreFinalitySource source = IStreamCoreFinalitySource(core);
        if (!source.collectionExists(scope.collectionId)) {
            return facts;
        }

        facts.collectionStatus = source.collectionStatus(scope.collectionId);
        facts.collectionSupplyMode = source.collectionSupplyMode(scope.collectionId);
        facts.collectionConfigHash = _collectionConfigHash(scope.collectionId);

        if (scope.scopeType == uint8(StreamFinalityScopeType.TOKEN)) {
            (
                bool mappingExists,
                uint256 mappedCollectionId,
                uint256 collectionSerial,
                bool identityBurned
            ) = source.tokenCollectionIdentity(scope.tokenId);
            uint8 lifecycle = source.tokenLifecycle(scope.tokenId);

            if (mappingExists) {
                facts.tokenMappingExists = true;
                facts.collectionSerial = collectionSerial;
                facts.tokenLifecycle = lifecycle;
                facts.burned = identityBurned;
                bool recognizedLifecycle = lifecycle == StreamFinalityDomains.TOKEN_LIFECYCLE_MINTED
                    || lifecycle == StreamFinalityDomains.TOKEN_LIFECYCLE_BURNED;
                bool burnAgrees =
                    identityBurned == (lifecycle == StreamFinalityDomains.TOKEN_LIFECYCLE_BURNED);
                facts.scopeExists =
                    mappedCollectionId == scope.collectionId && recognizedLifecycle && burnAgrees;
            }
            return facts;
        }

        (bool published, bytes32 manifestHash) = IStreamFinalityMetadataReads(collectionMetadata)
            .scopeManifest(scope.collectionId, scope.scopeId);
        if (published && manifestHash != bytes32(0)) {
            facts.scopeExists = true;
            facts.scopeManifestHash = manifestHash;
        }
    }

    /// @inheritdoc IERC165
    function supportsInterface(bytes4 interfaceId) external pure override returns (bool) {
        return interfaceId == type(IStreamCoreFinalityAdapter).interfaceId
            || interfaceId == type(IERC165).interfaceId;
    }

    function _canonicalScopedQuery(StreamCoreFinalityScopeQuery calldata scope)
        private
        pure
        returns (bool)
    {
        if (scope.collectionId == 0) {
            return false;
        }
        if (scope.scopeType == uint8(StreamFinalityScopeType.TOKEN)) {
            return scope.tokenId != 0 && scope.scopeId == bytes32(0);
        }
        if (
            scope.scopeType == uint8(StreamFinalityScopeType.RELEASE)
                || scope.scopeType == uint8(StreamFinalityScopeType.SEASON)
                || scope.scopeType == uint8(StreamFinalityScopeType.VIEW)
        ) {
            return scope.tokenId == 0 && scope.scopeId != bytes32(0);
        }
        return false;
    }

    function _collectionConfigHash(uint256 collectionId) private view returns (bytes32) {
        return keccak256(
            abi.encode(
                StreamFinalityDomains.STREAM_CORE_COLLECTION_CONFIG_EMPTY_V1,
                block.chainid,
                core,
                collectionId
            )
        );
    }
}
