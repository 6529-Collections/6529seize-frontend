// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./helpers/Assertions.sol";
import "./helpers/CharacterizationTestBase.sol";
import "./helpers/StreamFixture.sol";

contract StreamRoyaltyTest is CharacterizationTestBase, StreamFixture {
    using Assertions for address;
    using Assertions for bool;
    using Assertions for uint256;

    bytes4 private constant ERC165_INTERFACE_ID = 0x01ffc9a7;
    bytes4 private constant ERC721_INTERFACE_ID = 0x80ac58cd;
    bytes4 private constant ERC721_METADATA_INTERFACE_ID = 0x5b5e139f;
    bytes4 private constant ERC2981_INTERFACE_ID = 0x2a55205a;
    bytes4 private constant ERC4906_INTERFACE_ID = 0x49064906;
    bytes4 private constant ERC721_ENUMERABLE_INTERFACE_ID = 0x780e9d63;
    address private constant ROYALTY_RECEIVER = 0xC8ed02aFEBD9aCB14c33B5330c803feacAF01377;
    uint256 private constant ROYALTY_BPS = 690;
    uint256 private constant ROYALTY_DENOMINATOR = 10_000;

    function testSupportsErc2981Interface() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));

        deployed.core.supportsInterface(ERC2981_INTERFACE_ID).assertTrue("missing ERC-2981");
    }

    function testRoyaltyRefactorKeepsRetainedInterfaceSupport() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));

        deployed.core.supportsInterface(ERC165_INTERFACE_ID).assertTrue("missing ERC-165");
        deployed.core.supportsInterface(ERC721_INTERFACE_ID).assertTrue("missing ERC-721");
        deployed.core.supportsInterface(ERC721_METADATA_INTERFACE_ID)
            .assertTrue("missing ERC-721 metadata");
        deployed.core.supportsInterface(ERC2981_INTERFACE_ID).assertTrue("missing ERC-2981");
        deployed.core.supportsInterface(ERC4906_INTERFACE_ID).assertTrue("missing ERC-4906");
        deployed.core.supportsInterface(ERC721_ENUMERABLE_INTERFACE_ID)
            .assertFalse("unexpected ERC-721 Enumerable support");
    }

    function testDefaultRoyaltyIsFixedAt690BasisPoints() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));

        (address receiver, uint256 royaltyAmount) =
            deployed.core.royaltyInfo(1, 1 ether);

        receiver.assertEq(ROYALTY_RECEIVER, "royalty receiver");
        royaltyAmount.assertEq(0.069 ether, "royalty amount");
    }

    function testLargeSalePriceMatchesCheckedOZStyleRoyaltyMath() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        uint256 salePrice = type(uint256).max / ROYALTY_BPS;

        (address receiver, uint256 royaltyAmount) = deployed.core.royaltyInfo(1, salePrice);

        receiver.assertEq(ROYALTY_RECEIVER, "royalty receiver");
        royaltyAmount.assertEq(salePrice * ROYALTY_BPS / ROYALTY_DENOMINATOR, "large sale royalty");
    }

    function testRoyaltyMathUsesCheckedOverflowSemantics() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));

        vm.expectRevert();
        deployed.core.royaltyInfo(1, type(uint256).max / ROYALTY_BPS + 1);
    }

    function testDefaultRoyaltyAppliesToArbitraryTokenIds() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));

        (address firstReceiver, uint256 firstAmount) = deployed.core.royaltyInfo(1, 10_000);
        (address secondReceiver, uint256 secondAmount) = deployed.core.royaltyInfo(999_999, 10_000);

        firstReceiver.assertEq(ROYALTY_RECEIVER, "first receiver");
        secondReceiver.assertEq(ROYALTY_RECEIVER, "second receiver");
        firstAmount.assertEq(690, "first amount");
        secondAmount.assertEq(690, "second amount");
    }

    function testZeroSalePriceHasZeroRoyaltyAmount() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));

        (address receiver, uint256 royaltyAmount) = deployed.core.royaltyInfo(1, 0);

        receiver.assertEq(ROYALTY_RECEIVER, "royalty receiver");
        royaltyAmount.assertEq(0, "zero sale royalty");
    }
}
