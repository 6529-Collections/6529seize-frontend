// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../smart-contracts/IERC7572.sol";
import "../smart-contracts/IERC2981.sol";
import "../smart-contracts/IERC721.sol";
import "../smart-contracts/IStreamCompatibility.sol";
import "../smart-contracts/IStreamContractMetadata.sol";
import "../smart-contracts/StreamAdmins.sol";
import "../smart-contracts/StreamContractMetadata.sol";
import "../smart-contracts/StreamMetadataRenderer.sol";
import "./helpers/Assertions.sol";
import "./helpers/CharacterizationTestBase.sol";
import "./helpers/StreamFixture.sol";

contract StreamContractMetadataTest is CharacterizationTestBase, StreamFixture {
    using Assertions for address;
    using Assertions for bool;
    using Assertions for bytes32;
    using Assertions for string;

    event ContractURIUpdated();

    bytes4 private constant ERC4906_INTERFACE_ID = 0x49064906;
    address private constant FUNCTION_ADMIN = address(0xA11CE);
    string private constant INITIAL_URI = "ipfs://6529stream/contract-metadata.json";
    string private constant UPDATED_URI = "https://metadata.6529.io/stream/contract.json";

    function testInitialContractMetadataState() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        StreamContractMetadata metadata = new StreamContractMetadata(
            address(deployed.core), address(deployed.admins), INITIAL_URI
        );

        metadata.streamCore().assertEq(address(deployed.core), "core not retained");
        metadata.adminsContract().assertEq(address(deployed.admins), "admins not retained");
        metadata.contractURI().assertEq(INITIAL_URI, "initial uri not retained");
        metadata.contractURIHash()
            .assertEq(keccak256(bytes(INITIAL_URI)), "initial uri hash not retained");
        metadata.isStreamContractMetadata().assertTrue("metadata marker false");
    }

    function testSupportsErc7572StreamMetadataAndCompatibilityInterfaces() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        StreamContractMetadata metadata = new StreamContractMetadata(
            address(deployed.core), address(deployed.admins), INITIAL_URI
        );

        metadata.supportsInterface(type(IERC7572).interfaceId).assertTrue("missing ERC-7572");
        metadata.supportsInterface(type(IStreamCompatibility).interfaceId)
            .assertTrue("missing stream compatibility interface");
        metadata.supportsInterface(type(IStreamContractMetadata).interfaceId)
            .assertTrue("missing stream metadata interface");
        metadata.supportsInterface(0xffffffff).assertFalse("invalid interface supported");
    }

    function testCompatibilityViewsExposeStableIntegratorVersions() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        StreamContractMetadata metadata = new StreamContractMetadata(
            address(deployed.core), address(deployed.admins), INITIAL_URI
        );

        metadata.isStreamCompatibility().assertTrue("compatibility marker false");
        metadata.streamProtocolName().assertEq("6529Stream", "protocol name changed");
        metadata.streamProtocolVersion().assertEq("0.1.0", "protocol version changed");
        metadata.streamMetadataSchemaVersion().assertEq(
            "6529stream-v1", "metadata schema version changed"
        );
        metadata.streamReleaseTag().assertEq("v0.1.0", "release tag changed");
        metadata.streamReleaseHash()
            .assertEq(keccak256(bytes("v0.1.0")), "release hash changed");
    }

    function testCompatibilityViewChecksAdapterAndCoreInterfaces() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        StreamContractMetadata metadata = new StreamContractMetadata(
            address(deployed.core), address(deployed.admins), INITIAL_URI
        );

        metadata.supportsStreamInterface(type(IStreamCompatibility).interfaceId)
            .assertTrue("missing adapter compatibility interface");
        metadata.supportsStreamInterface(type(IStreamContractMetadata).interfaceId)
            .assertTrue("missing adapter metadata interface");
        metadata.supportsStreamInterface(type(IERC721).interfaceId)
            .assertTrue("missing core ERC-721 interface");
        metadata.supportsStreamInterface(type(IERC2981).interfaceId)
            .assertTrue("missing core ERC-2981 interface");
        metadata.supportsStreamInterface(ERC4906_INTERFACE_ID)
            .assertTrue("missing core ERC-4906 interface");
        metadata.supportsStreamInterface(0xffffffff).assertFalse("invalid interface supported");
    }

    function testFunctionAdminCanUpdateContractURIAndEmitErc7572Event() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        StreamContractMetadata metadata = new StreamContractMetadata(
            address(deployed.core), address(deployed.admins), INITIAL_URI
        );
        deployed.admins
            .registerFunctionAdmin(
                FUNCTION_ADMIN, address(metadata), metadata.updateContractURI.selector, true
            );

        vm.expectEmit(false, false, false, false);
        emit ContractURIUpdated();
        vm.prank(FUNCTION_ADMIN);
        metadata.updateContractURI(UPDATED_URI);

        metadata.contractURI().assertEq(UPDATED_URI, "updated uri not retained");
        metadata.contractURIHash()
            .assertEq(keccak256(bytes(UPDATED_URI)), "updated uri hash not retained");
    }

    function testContractURIHashUsesExactStoredUriBytes() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        StreamContractMetadata metadata = new StreamContractMetadata(
            address(deployed.core), address(deployed.admins), INITIAL_URI
        );
        string memory exactUri = "ipfs://Qm6529StreamMetadataCaseSensitivePath";

        metadata.updateContractURI(exactUri);

        metadata.contractURI().assertEq(exactUri, "exact uri bytes not stored");
        metadata.contractURIHash()
            .assertEq(keccak256(bytes(exactUri)), "uri hash not exact keccak256(bytes(uri))");
    }

    function testGlobalAdminCanUpdateContractURI() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        StreamContractMetadata metadata = new StreamContractMetadata(
            address(deployed.core), address(deployed.admins), INITIAL_URI
        );

        metadata.updateContractURI(UPDATED_URI);

        metadata.contractURI().assertEq(UPDATED_URI, "global admin could not update uri");
    }

    function testMetadataMutationPauseBlocksContractURIUpdate() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        StreamContractMetadata metadata = new StreamContractMetadata(
            address(deployed.core), address(deployed.admins), INITIAL_URI
        );
        StreamAdmins replacementAdmins = new StreamAdmins(address(this));

        deployed.admins
            .setPaused(deployed.admins.PAUSE_DOMAIN_METADATA_MUTATION(), true, bytes32(0));

        vm.expectRevert(
            abi.encodeWithSelector(StreamContractMetadata.MetadataMutationPaused.selector)
        );
        metadata.updateContractURI(UPDATED_URI);

        metadata.contractURI().assertEq(INITIAL_URI, "paused update changed uri");
        metadata.contractURIHash()
            .assertEq(keccak256(bytes(INITIAL_URI)), "paused update changed hash");

        vm.expectRevert(
            abi.encodeWithSelector(StreamContractMetadata.MetadataMutationPaused.selector)
        );
        metadata.updateAdminContract(address(replacementAdmins));

        metadata.adminsContract().assertEq(address(deployed.admins), "paused update changed admins");

        deployed.admins
            .setPaused(deployed.admins.PAUSE_DOMAIN_METADATA_MUTATION(), false, bytes32(0));
        metadata.updateContractURI(UPDATED_URI);

        metadata.contractURI().assertEq(UPDATED_URI, "unpaused update failed");
    }

    function testUnauthorizedAccountCannotUpdateContractURI() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        StreamContractMetadata metadata = new StreamContractMetadata(
            address(deployed.core), address(deployed.admins), INITIAL_URI
        );

        vm.expectRevert(
            abi.encodeWithSelector(StreamContractMetadata.FunctionAdminUnauthorized.selector)
        );
        vm.prank(FUNCTION_ADMIN);
        metadata.updateContractURI(UPDATED_URI);
    }

    function testContractURIRejectsEmptyAndUnsafeUris() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        StreamContractMetadata metadata = new StreamContractMetadata(
            address(deployed.core), address(deployed.admins), INITIAL_URI
        );

        vm.expectRevert(abi.encodeWithSelector(StreamContractMetadata.EmptyContractURI.selector));
        metadata.updateContractURI("");

        vm.expectRevert(abi.encodeWithSelector(StreamMetadataRenderer.UnsafeMetadataURI.selector));
        metadata.updateContractURI("data:application/json;base64,e30=");

        vm.expectRevert(abi.encodeWithSelector(StreamMetadataRenderer.UnsafeMetadataURI.selector));
        metadata.updateContractURI("javascript:alert(1)");

        vm.expectRevert(abi.encodeWithSelector(StreamMetadataRenderer.UnsafeMetadataURI.selector));
        metadata.updateContractURI("https://metadata.6529.io/bad path.json");

        vm.expectRevert(abi.encodeWithSelector(StreamMetadataRenderer.UnsafeMetadataURI.selector));
        metadata.updateContractURI(
            string(abi.encodePacked("https://metadata.6529.io/", bytes1(0x01), "bad.json"))
        );

        vm.expectRevert(
            abi.encodeWithSelector(
                StreamMetadataRenderer.MetadataFieldInvalidUTF8.selector, bytes32("contractURI")
            )
        );
        metadata.updateContractURI(string(abi.encodePacked("ipfs://", bytes1(0xc0), bytes1(0xaf))));

        uint256 maximum = metadata.MAX_CONTRACT_URI_BYTES();
        vm.expectRevert(
            abi.encodeWithSelector(
                StreamMetadataRenderer.MetadataFieldTooLarge.selector,
                bytes32("contractURI"),
                maximum + 1,
                maximum
            )
        );
        metadata.updateContractURI(_ascii(maximum + 1));
    }

    function testConstructorRejectsInvalidCoreAndAdminContracts() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        EmptyMarker emptyMarker = new EmptyMarker();

        vm.expectRevert(abi.encodeWithSelector(StreamContractMetadata.InvalidCoreContract.selector));
        new StreamContractMetadata(address(0x1234), address(deployed.admins), INITIAL_URI);

        vm.expectRevert(
            abi.encodeWithSelector(StreamContractMetadata.InvalidAdminContract.selector)
        );
        new StreamContractMetadata(address(deployed.core), address(emptyMarker), INITIAL_URI);
    }

    function testUpdateAdminContractRequiresOldAdminAndValidNewAdmin() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        StreamContractMetadata metadata = new StreamContractMetadata(
            address(deployed.core), address(deployed.admins), INITIAL_URI
        );
        StreamAdmins replacementAdmins = new StreamAdmins(address(this));
        EmptyMarker emptyMarker = new EmptyMarker();

        vm.expectRevert(
            abi.encodeWithSelector(StreamContractMetadata.InvalidAdminContract.selector)
        );
        metadata.updateAdminContract(address(emptyMarker));

        metadata.updateAdminContract(address(replacementAdmins));

        metadata.adminsContract().assertEq(address(replacementAdmins), "admins not updated");
    }

    function testUpdateAdminContractUsesTargetScopedSelector() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        StreamContractMetadata first = new StreamContractMetadata(
            address(deployed.core), address(deployed.admins), INITIAL_URI
        );
        StreamContractMetadata second = new StreamContractMetadata(
            address(deployed.core), address(deployed.admins), INITIAL_URI
        );
        StreamAdmins replacementAdmins = new StreamAdmins(address(this));
        deployed.admins
            .registerFunctionAdmin(
                FUNCTION_ADMIN, address(first), first.updateAdminContract.selector, true
            );

        vm.prank(FUNCTION_ADMIN);
        (bool firstSuccess,) = address(first)
            .call(
                abi.encodeWithSelector(
                    first.updateAdminContract.selector, address(replacementAdmins)
                )
            );
        firstSuccess.assertTrue("target grant did not authorize target");

        vm.prank(FUNCTION_ADMIN);
        (bool secondSuccess,) = address(second)
            .call(
                abi.encodeWithSelector(
                    second.updateAdminContract.selector, address(replacementAdmins)
                )
            );
        secondSuccess.assertFalse("target grant authorized another metadata contract");
    }

    function _ascii(uint256 size) private pure returns (string memory) {
        bytes memory value = new bytes(size);
        for (uint256 i = 0; i < size; i++) {
            value[i] = 0x61;
        }
        return string(value);
    }
}

contract EmptyMarker {
    fallback() external { }
}
