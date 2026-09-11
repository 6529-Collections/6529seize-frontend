// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import "./ERC165.sol";
import "./IERC165.sol";
import "./IERC7572.sol";
import "./IStreamAdmins.sol";
import "./IStreamCompatibility.sol";
import "./IStreamContractMetadata.sol";
import "./StreamMetadataRenderer.sol";
import "./StreamPauseDomains.sol";

contract StreamContractMetadata is ERC165, IStreamCompatibility, IStreamContractMetadata {
    uint256 public constant MAX_CONTRACT_URI_BYTES = 2_048;

    bytes32 private constant _FIELD_CONTRACT_URI = "contractURI";
    string private constant _STREAM_PROTOCOL_NAME = "6529Stream";
    string private constant _STREAM_PROTOCOL_VERSION = "0.1.0";
    string private constant _STREAM_METADATA_SCHEMA_VERSION = "6529stream-v1";
    string private constant _STREAM_RELEASE_TAG = "v0.1.0";

    address public immutable streamCore;
    IStreamAdmins private _adminsContract;
    string private _contractURI;
    bytes32 private _contractURIHash;

    error EmptyContractURI();
    error FunctionAdminUnauthorized();
    error InvalidAdminContract();
    error InvalidCoreContract();
    error MetadataMutationPaused();

    modifier FunctionAdminRequired(bytes4 selector) {
        if (
            !_adminsContract.retrieveFunctionAdmin(msg.sender, address(this), selector)
                && !_adminsContract.retrieveGlobalAdmin(msg.sender)
        ) {
            revert FunctionAdminUnauthorized();
        }
        _;
    }

    constructor(address core, address admins, string memory initialContractURI) {
        if (core.code.length == 0) revert InvalidCoreContract();
        streamCore = core;
        _setAdminContract(admins);
        _setContractURI(initialContractURI);
    }

    function adminsContract() external view returns (address) {
        return address(_adminsContract);
    }

    function contractURI() external view returns (string memory) {
        return _contractURI;
    }

    function contractURIHash() external view returns (bytes32) {
        return _contractURIHash;
    }

    function isStreamContractMetadata() external pure returns (bool) {
        return true;
    }

    /// @notice Returns true for deployed 6529Stream compatibility adapters.
    function isStreamCompatibility() external pure returns (bool) {
        return true;
    }

    /// @notice Returns the canonical protocol family name for integration checks.
    function streamProtocolName() external pure returns (string memory) {
        return _STREAM_PROTOCOL_NAME;
    }

    /// @notice Returns the protocol version used by release artifacts and docs.
    function streamProtocolVersion() external pure returns (string memory) {
        return _STREAM_PROTOCOL_VERSION;
    }

    /// @notice Returns the JSON metadata schema version emitted by tokenURI.
    function streamMetadataSchemaVersion() external pure returns (string memory) {
        return _STREAM_METADATA_SCHEMA_VERSION;
    }

    /// @notice Returns the release artifact tag expected for ABI and event decoding.
    function streamReleaseTag() external pure returns (string memory) {
        return _STREAM_RELEASE_TAG;
    }

    /// @notice Returns keccak256(bytes(streamReleaseTag())) for compact comparisons.
    function streamReleaseHash() external pure returns (bytes32) {
        return keccak256(bytes(_STREAM_RELEASE_TAG));
    }

    /// @notice Returns whether this adapter or its core contract supports an interface.
    function supportsStreamInterface(bytes4 interfaceId) external view returns (bool) {
        if (supportsInterface(interfaceId)) {
            return true;
        }
        try IERC165(streamCore).supportsInterface(interfaceId) returns (bool supported) {
            return supported;
        } catch {
            return false;
        }
    }

    function updateAdminContract(address newAdminsContract)
        external
        FunctionAdminRequired(this.updateAdminContract.selector)
    {
        _requireMetadataMutationNotPaused();
        _setAdminContract(newAdminsContract);
    }

    function updateContractURI(string memory newContractURI)
        external
        FunctionAdminRequired(this.updateContractURI.selector)
    {
        _requireMetadataMutationNotPaused();
        _setContractURI(newContractURI);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC165) returns (bool) {
        return interfaceId == type(IERC7572).interfaceId
            || interfaceId == type(IStreamCompatibility).interfaceId
            || interfaceId == type(IStreamContractMetadata).interfaceId
            || super.supportsInterface(interfaceId);
    }

    function _setAdminContract(address admins) private {
        StreamMetadataRenderer.requireContractMarker(
            admins, IStreamAdmins.isAdminContract.selector, InvalidAdminContract.selector
        );
        _adminsContract = IStreamAdmins(admins);
    }

    function _setContractURI(string memory newContractURI) private {
        if (bytes(newContractURI).length == 0) revert EmptyContractURI();
        StreamMetadataRenderer.requireValidUtf8ContentUri(
            _FIELD_CONTRACT_URI, newContractURI, MAX_CONTRACT_URI_BYTES, false
        );
        _contractURI = newContractURI;
        _contractURIHash = keccak256(bytes(newContractURI));
        emit ContractURIUpdated();
    }

    function _requireMetadataMutationNotPaused() private view {
        StreamMetadataRenderer.requireNotPaused(
            address(_adminsContract),
            StreamPauseDomains.METADATA_MUTATION,
            MetadataMutationPaused.selector
        );
    }
}
