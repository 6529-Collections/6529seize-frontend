// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @notice Legacy ABI retained solely for pre-genesis characterization and rehearsal fixtures.
/// @dev The production StreamCore intentionally does not implement this interface. New
///      deployment, integration, and release surfaces must use IStreamCore and the owning
///      satellites instead.
interface IStreamLegacyCore {
    function MAX_COLLECTION_SCRIPT_CHUNKS() external view returns (uint256);

    function MAX_COLLECTION_SCRIPT_CHUNK_BYTES() external view returns (uint256);

    function MAX_COLLECTION_TEXT_BYTES() external view returns (uint256);

    function MAX_GENERATED_TOKEN_URI_BYTES() external view returns (uint256);

    function MAX_TOKEN_ATTRIBUTES_BYTES() external view returns (uint256);

    function MAX_TOKEN_DATA_BYTES() external view returns (uint256);

    function MAX_TOKEN_IMAGE_BYTES() external view returns (uint256);

    function METADATA_FREEZE_MANIFEST_TYPEHASH() external view returns (bytes32);

    function METADATA_SCHEMA_VERSION() external view returns (string memory);

    function metadataSchemaVersion() external pure returns (string memory);

    function isCoreContract() external pure returns (bool);

    function owner() external view returns (address);

    function transferOwnership(address newOwner) external;

    function renounceOwnership() external;

    function createCollection(
        string calldata name,
        string calldata artist,
        string calldata description,
        string calldata website,
        string calldata license,
        string calldata baseURI,
        string calldata library_,
        bytes32 dependency,
        string[] calldata scripts
    ) external;

    function newCollectionIndex() external view returns (uint256);

    function retrievewereDataAdded(uint256 collectionId) external view returns (bool);

    function viewCirSupply(uint256 collectionId) external view returns (uint256);

    function lastAllocatedTokenId() external view returns (uint256);

    function retrieveCollectionAdditionalData(uint256 collectionId)
        external
        view
        returns (
            address artist,
            uint256 mintedEver,
            uint256 circulationSupply,
            uint256 totalSupply,
            uint256 reserved,
            address randomizer
        );

    function mint(
        uint256 mintIndex,
        address recipient,
        string calldata tokenData,
        uint256 saltfunO,
        uint256 collectionId
    ) external;

    function mintFromManager(
        uint256 collectionId,
        address initialRecipient,
        string calldata tokenData_,
        uint256 saltfunO,
        bytes32 tokenDataHash
    ) external returns (uint256 tokenId, uint256 collectionSerial);

    function prepareMintFromManager(
        uint256 collectionId,
        string calldata tokenData_,
        bytes32 tokenDataHash,
        bytes32 operationId
    ) external returns (uint256 tokenId, uint256 collectionSerial);

    function completePreparedMintFromManager(
        uint256 tokenId,
        address initialRecipient,
        bytes32 operationId,
        uint256 saltfunO
    ) external;

    function mintManager() external view returns (address);

    function minterContract() external view returns (address);

    function updateContracts(uint8 option, address newContract) external;

    function setCollectionData(
        uint256 collectionId,
        address artist,
        uint256 maxAllowance,
        uint256 totalSupply,
        uint256 mintingPeriod
    ) external;

    function setFinalSupply(uint256 collectionId) external;

    function addRandomizer(uint256 collectionId, address randomizer) external;

    function viewColIDforTokenID(uint256 tokenId) external view returns (uint256);

    function isTokenBurned(uint256 tokenId) external view returns (bool);

    function viewCollectionRandomizerContract(uint256 collectionId) external view returns (address);

    function viewRandomizerEpoch(uint256 collectionId) external view returns (uint256);

    function setTokenHash(uint256 collectionId, uint256 tokenId, bytes32 tokenHash) external;

    function retrieveTokenHash(uint256 tokenId) external view returns (bytes32);

    function retrieveArtistAddress(uint256 collectionId) external view returns (address);

    function artistSignature(uint256 collectionId, string calldata signature) external;

    function artistSignature(uint256 collectionId, string calldata signature, bytes calldata proof)
        external;

    function artistSigned(uint256 collectionId) external view returns (bool);

    function artistsSignatures(uint256 collectionId) external view returns (string memory);

    function artistApprovalHashes(uint256 collectionId) external view returns (bytes32);

    function changeMetadataView(uint256 collectionId, bool onchain) external;

    function changeTokenData(uint256 tokenId, string calldata tokenData_) external;

    function updateImagesAndAttributes(
        uint256[] calldata tokenIds,
        string[] calldata images,
        string[] calldata attributes
    ) external;

    function updateCollectionInfo(
        uint256 collectionId,
        string calldata name,
        string calldata artist,
        string calldata description,
        string calldata website,
        string calldata license,
        string calldata baseURI,
        string calldata library_,
        bytes32 dependency,
        uint256 dependencyVersion,
        string[] calldata scripts
    ) external;

    function onchainMetadata(uint256 collectionId) external view returns (bool);

    function tokenMetadataState(uint256 tokenId) external view returns (string memory);

    function tokenData(uint256 tokenId) external view returns (string memory);

    function retrievetokenImageAndAttributes(uint256 tokenId)
        external
        view
        returns (string memory image, string memory attributes);

    function retrieveCollectionInfo(uint256 collectionId)
        external
        view
        returns (
            string memory name,
            string memory artist,
            string memory description,
            string memory website,
            string memory license,
            string memory baseURI
        );

    function retrieveCollectionLibraryAndScript(uint256 collectionId)
        external
        view
        returns (string memory library_, bytes32 dependency, string[] memory scripts);

    function collectionDependencyVersionState(uint256 collectionId)
        external
        view
        returns (
            bytes32 dependency,
            uint256 dependencyVersion,
            bytes32 contentHash,
            address registry
        );

    function retrieveDependencyScriptContentHash(uint256 tokenId) external view returns (bytes32);

    function retrieveGenerativeScript(uint256 tokenId) external view returns (string memory);

    function collectionFreezeManifestHash(uint256 collectionId) external view returns (bytes32);

    function previewCollectionFreezeManifestHash(uint256 collectionId)
        external
        view
        returns (bytes32);

    function viewMaxAllowance(uint256 collectionId) external view returns (uint256);

    function retrieveTokensAirdroppedPerAddress(uint256 collectionId, address recipient)
        external
        view
        returns (uint256);

    function burnAmount(uint256 collectionId) external view returns (uint256);

    function burnedTokenAuditState(uint256 tokenId)
        external
        view
        returns (
            bool exists,
            uint256 collectionId,
            address ownerAtBurn,
            address burner,
            uint256 burnedAtBlock,
            uint256 burnedAtTimestamp,
            bytes32 tokenHash,
            bytes32 tokenDataHash,
            uint256 collectionBurnCount,
            uint256 globalBurnCount
        );
}
