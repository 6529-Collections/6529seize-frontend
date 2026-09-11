// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../smart-contracts/DependencyRegistry.sol";
import "../smart-contracts/RandomizerVRF.sol";
import "../smart-contracts/StreamContractMetadata.sol";
import "../smart-contracts/StreamCore.sol";
import "../smart-contracts/StreamRandomizerLifecycle.sol";
import "./helpers/CharacterizationTestBase.sol";
import "./helpers/StreamFixture.sol";
import "./mocks/MockRandomizerCore.sol";

contract StreamCustomErrorNegativeTest is CharacterizationTestBase, StreamFixture {
    uint256 private constant COLLECTION_ID = 1;
    uint256 private constant TOKEN_ID = 1;
    address private constant PAYOUT = address(0x2002);
    address private constant CURATORS_POOL = address(0x3003);
    address private constant UNAUTHORIZED = address(0xBAD);

    function testRepresentativeCustomErrorSelectorsMatchReleaseSurface() public pure {
        _assertSelector(StreamCore.FunctionAdminUnauthorized.selector, bytes4(0x9a763740));
        _assertSelector(StreamCore.NotMinterContract.selector, bytes4(0x3acd46d7));
        _assertSelector(StreamCore.MetadataFieldTooLarge.selector, bytes4(0x46caadcb));
        _assertSelector(StreamCore.UnsafeMetadataURI.selector, bytes4(0x97dbd465));
        _assertSelector(DependencyRegistry.DependencyKeyReserved.selector, bytes4(0x09fd460b));
        _assertSelector(StreamContractMetadata.InvalidCoreContract.selector, bytes4(0xf48e6f72));
        _assertSelector(
            StreamRandomizerLifecycle.UnknownRandomnessRequest.selector, bytes4(0xab2112a6)
        );
        _assertSelector(
            StreamRandomizerLifecycle.TokenRandomnessRequestAlreadyExists.selector,
            bytes4(0xa68fbeff)
        );
    }

    function testLowLevelMutationProbesKeepSecurityErrorsTyped() public {
        DeployedStream memory deployed = deployStream(PAYOUT, CURATORS_POOL);

        _assertCallRevertsWithSelector(
            UNAUTHORIZED,
            address(deployed.core),
            abi.encodeWithSelector(deployed.core.changeMetadataView.selector, COLLECTION_ID, true),
            StreamCore.FunctionAdminUnauthorized.selector
        );

        _assertCallRevertsWithSelector(
            address(this),
            address(deployed.core),
            abi.encodeWithSelector(
                deployed.core.mint.selector,
                TOKEN_ID,
                address(this),
                "bad-minter",
                uint256(7),
                COLLECTION_ID
            ),
            StreamCore.NotMinterContract.selector
        );

        _assertCallRevertsWithSelector(
            address(this),
            address(deployed.dependencyRegistry),
            abi.encodeWithSelector(
                deployed.dependencyRegistry.addDependency.selector,
                bytes32(0),
                _singleChunk("reserved-key")
            ),
            DependencyRegistry.DependencyKeyReserved.selector
        );
    }

    function testMetadataMutationRejectsOversizedCollectionNameWithArguments() public {
        DeployedStream memory deployed = deployStream(PAYOUT, CURATORS_POOL);
        uint256 maximum = deployed.core.MAX_COLLECTION_TEXT_BYTES();

        vm.expectRevert(
            abi.encodeWithSelector(
                StreamCore.MetadataFieldTooLarge.selector,
                bytes32("collection.name"),
                maximum + 1,
                maximum
            )
        );
        deployed.core
            .createCollection(
                _repeat("n", maximum + 1),
                "6529",
                "Description",
                "https://6529.io",
                "CC0",
                "ipfs://base/",
                "https://cdn.example/script.js",
                bytes32(0),
                _singleChunk("function draw(){}")
            );
    }

    function testContractMetadataRejectsInvalidCoreWithTypedError() public {
        DeployedStream memory deployed = deployStream(PAYOUT, CURATORS_POOL);

        vm.expectRevert(abi.encodeWithSelector(StreamContractMetadata.InvalidCoreContract.selector));
        new StreamContractMetadata(address(0x1234), address(deployed.admins), "ipfs://contract");
    }

    function testRandomizerLifecycleRejectsUnknownAndDuplicateTokenRequestsWithArguments() public {
        DeployedStream memory deployed = deployStream(PAYOUT, CURATORS_POOL);
        MockRandomizerCore core = new MockRandomizerCore();
        ADV012MockVrfCoordinator coordinator = new ADV012MockVrfCoordinator();
        NextGenRandomizerVRF vrf = new NextGenRandomizerVRF(
            1, address(coordinator), address(core), address(deployed.admins)
        );
        core.setRandomizer(COLLECTION_ID, address(vrf), 1);
        core.setTokenCollection(TOKEN_ID, COLLECTION_ID);

        vm.expectRevert(
            abi.encodeWithSelector(
                StreamRandomizerLifecycle.UnknownRandomnessRequest.selector, uint256(999)
            )
        );
        coordinator.fulfill(vrf, 999, _words(1));

        vm.prank(address(core));
        vrf.calculateTokenHash(COLLECTION_ID, TOKEN_ID, 123);

        vm.expectRevert(
            abi.encodeWithSelector(
                StreamRandomizerLifecycle.TokenRandomnessRequestAlreadyExists.selector,
                TOKEN_ID,
                uint256(1)
            )
        );
        vm.prank(address(core));
        vrf.calculateTokenHash(COLLECTION_ID, TOKEN_ID, 456);
    }

    function _assertSelector(bytes4 actual, bytes4 expected) private pure {
        require(actual == expected, "selector drift");
    }

    function _assertCallRevertsWithSelector(
        address sender,
        address target,
        bytes memory callData,
        bytes4 expectedSelector
    ) private {
        vm.prank(sender);
        (bool success, bytes memory revertData) = target.call(callData);
        require(!success, "mutation call succeeded");
        require(revertData.length >= 4, "missing revert selector");
        require(_selectorOf(revertData) == expectedSelector, "wrong revert selector");
    }

    function _selectorOf(bytes memory revertData) private pure returns (bytes4 selector) {
        require(revertData.length >= 4, "missing revert selector");
        assembly {
            selector := mload(add(revertData, 32))
        }
    }

    function _singleChunk(string memory value) private pure returns (string[] memory chunks) {
        chunks = new string[](1);
        chunks[0] = value;
    }

    function _repeat(string memory character, uint256 count) private pure returns (string memory) {
        bytes memory unit = bytes(character);
        require(unit.length == 1, "single byte only");
        bytes memory output = new bytes(count);
        for (uint256 i = 0; i < count; i++) {
            output[i] = unit[0];
        }
        return string(output);
    }

    function _words(uint256 word) private pure returns (uint256[] memory words) {
        words = new uint256[](1);
        words[0] = word;
    }
}

contract ADV012MockVrfCoordinator {
    uint256 public nextRequestId = 1;

    // Deliberately permissive: this suite exercises lifecycle errors, not VRF request params.
    function requestRandomWords(bytes32, uint64, uint16, uint32, uint32)
        external
        returns (uint256 requestId)
    {
        requestId = nextRequestId;
        nextRequestId++;
    }

    function fulfill(NextGenRandomizerVRF randomizer, uint256 requestId, uint256[] memory words)
        external
    {
        randomizer.rawFulfillRandomWords(requestId, words);
    }
}
