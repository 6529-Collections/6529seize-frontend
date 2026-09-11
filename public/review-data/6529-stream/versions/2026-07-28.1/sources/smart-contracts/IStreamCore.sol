// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

interface IStreamCore {
    struct PreparedMintRecord {
        bool exists;
        bytes32 operationId;
        uint256 collectionId;
    }

    /// @notice Emitted when a prepared-mint abort rolls back a prior token identity registration.
    /// @dev Compensates the earlier `TokenCollectionRegistered`: an event-only reconstructor
    ///      reverses that registration for the reused token ID. A later re-allocation of the
    ///      same ID emits a fresh `TokenCollectionRegistered` for its new collection.
    event TokenCollectionRegistrationReverted(
        uint16 schemaVersion, uint256 indexed tokenId, uint256 indexed collectionId
    );

    function isCoreContract() external view returns (bool);

    function newCollectionIndex() external view returns (uint256);

    function retrievewereDataAdded(uint256 _collectionID) external view returns (bool);

    function viewCirSupply(uint256 _collectionID) external view returns (uint256);

    function lastAllocatedTokenId() external view returns (uint256);

    function lastAllocatedCollectionId() external view returns (uint256);

    function retrieveCollectionAdditionalData(uint256 _collectionID)
        external
        view
        returns (address, uint256, uint256, uint256, uint256, address);

    function mint(
        uint256 mintIndex,
        address _recipient,
        string memory _tokenData,
        uint256 _saltfun_o,
        uint256 _collectionID
    ) external;

    function mintFromManager(
        uint256 collectionId,
        address initialRecipient,
        string calldata _tokenData,
        uint256 _saltfun_o,
        bytes32 tokenDataHash
    ) external returns (uint256 tokenId, uint256 collectionSerial);

    function prepareMintFromManager(
        uint256 collectionId,
        string calldata _tokenData,
        bytes32 tokenDataHash,
        bytes32 operationId
    ) external returns (uint256 tokenId, uint256 collectionSerial);

    function completePreparedMintFromManager(
        uint256 tokenId,
        address initialRecipient,
        bytes32 operationId,
        uint256 _saltfun_o
    ) external;

    function abortPreparedMintFromManager(uint256 tokenId, bytes32 operationId) external;

    function preparedMint(uint256 tokenId) external view returns (PreparedMintRecord memory);

    function pendingPreparedMintTokenId() external view returns (uint256);

    function tokenCollectionIdentity(uint256 tokenId)
        external
        view
        returns (bool mappingExists, uint256 collectionId, uint256 collectionSerial, bool burned);

    function tokenLifecycle(uint256 tokenId) external view returns (uint8 lifecycle);

    function totalSupplyOfCollection(uint256 collectionId) external view returns (uint256);

    function collectionFreezeStatus(uint256 _collectionID) external view returns (bool);

    function collectionFreezeManifestHash(uint256 _collectionID) external view returns (bytes32);

    function previewCollectionFreezeManifestHash(uint256 _collectionID)
        external
        view
        returns (bytes32);

    function artistApprovalHashes(uint256 _collectionID) external view returns (bytes32);

    function collectionDependencyVersionState(uint256 _collectionID)
        external
        view
        returns (bytes32, uint256, bytes32, address);

    function viewMaxAllowance(uint256 _collectionID) external view returns (uint256);

    function viewColIDforTokenID(uint256 _tokenid) external view returns (uint256);

    function isTokenBurned(uint256 tokenId) external view returns (bool);

    function viewCollectionRandomizerContract(uint256 _collectionID) external view returns (address);

    function viewRandomizerEpoch(uint256 _collectionID) external view returns (uint256);

    function retrieveArtistAddress(uint256 _collectionID) external view returns (address);

    function setTokenHash(uint256 _collectionID, uint256 _mintIndex, bytes32 _hash) external;

    function retrieveTokenHash(uint256 _tokenid) external view returns (bytes32);
}
