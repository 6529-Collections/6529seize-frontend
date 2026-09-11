// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../smart-contracts/Bytes32Strings.sol";
import "../smart-contracts/NFTdelegation.sol";
import "../smart-contracts/StreamCore.sol";
import "../smart-contracts/Strings.sol";
import "./helpers/Assertions.sol";
import "./helpers/CharacterizationTestBase.sol";
import "./helpers/StreamFixture.sol";

contract Bytes32StringsHarness {
    function containsExactCharacterQty(bytes32 source, uint8 utf8CharCode, uint8 targetQty)
        external
        pure
        returns (bool)
    {
        return Bytes32Strings.containsExactCharacterQty(source, utf8CharCode, targetQty);
    }
}

contract StreamInitializationTest is CharacterizationTestBase, StreamFixture {
    using Assertions for bool;
    using Assertions for string;
    using Assertions for uint256;
    using Strings for uint256;

    address private constant DELEGATOR = address(0xD1E9A70A);
    address private constant DELEGATE = address(0xDE1E9A7E);
    address private constant SUBDELEGATE = address(0x5BDE1E9A7E);
    address private constant OTHER = address(0xB0B);
    address private constant COLLECTION = address(0xC011EC710A);
    uint256 private constant USE_CASE = 1;
    uint256 private constant TOKEN_ID = 42;

    function testBytes32CharacterCountingUsesExplicitZeroStart() public {
        Bytes32StringsHarness harness = new Bytes32StringsHarness();
        bytes32 source = bytes32("abacad");

        harness.containsExactCharacterQty(source, uint8(0x61), 3).assertTrue("a count mismatch");
        harness.containsExactCharacterQty(source, uint8(0x7a), 0)
            .assertTrue("missing character should count as zero");
        harness.containsExactCharacterQty(source, uint8(0x61), 0)
            .assertFalse("nonzero character count reported as zero");
    }

    function testDelegationStatusLookupsDefaultFalseWhenNoRecordsExist() public {
        DelegationManagementContract delegation = new DelegationManagementContract();

        delegation.retrieveTokenStatus(DELEGATOR, COLLECTION, DELEGATE, USE_CASE, TOKEN_ID)
            .assertFalse("missing token delegation reported true");
        delegation.retrieveSubDelegationStatus(DELEGATOR, COLLECTION, SUBDELEGATE)
            .assertFalse("missing subdelegation reported true");
        delegation.retrieveStatusOfActiveDelegator(
                DELEGATOR, COLLECTION, DELEGATE, block.timestamp, USE_CASE
            ).assertFalse("missing active delegation reported true");
    }

    function testDelegationStatusLookupsFindOnlyMatchingRecords() public {
        DelegationManagementContract delegation = new DelegationManagementContract();
        uint256 expiry = block.timestamp + 1 days;

        vm.prank(DELEGATOR);
        delegation.registerDelegationAddress(
            COLLECTION, DELEGATE, expiry, USE_CASE, false, TOKEN_ID
        );

        delegation.retrieveTokenStatus(DELEGATOR, COLLECTION, DELEGATE, USE_CASE, TOKEN_ID)
            .assertTrue("token delegation not found");
        delegation.retrieveTokenStatus(DELEGATOR, COLLECTION, DELEGATE, USE_CASE, TOKEN_ID + 1)
            .assertFalse("different token matched");
        delegation.retrieveStatusOfActiveDelegator(
                DELEGATOR, COLLECTION, DELEGATE, block.timestamp, USE_CASE
            ).assertTrue("active delegator not found");
        delegation.retrieveStatusOfActiveDelegator(
                OTHER, COLLECTION, DELEGATE, block.timestamp, USE_CASE
            ).assertFalse("different delegator matched");
        delegation.retrieveStatusOfActiveDelegator(
                DELEGATOR, COLLECTION, DELEGATE, expiry, USE_CASE
            ).assertFalse("expired delegation reported active");
    }

    function testSubdelegationRightsGateRegisterAndRevokePaths() public {
        DelegationManagementContract delegation = new DelegationManagementContract();
        uint256 expiry = block.timestamp + 1 days;

        vm.prank(SUBDELEGATE);
        vm.expectRevert();
        delegation.registerDelegationAddressUsingSubDelegation(
            DELEGATOR, COLLECTION, DELEGATE, expiry, USE_CASE, false, TOKEN_ID
        );

        vm.prank(DELEGATOR);
        delegation.registerDelegationAddress(COLLECTION, SUBDELEGATE, expiry, 998, true, TOKEN_ID);

        delegation.retrieveSubDelegationStatus(DELEGATOR, COLLECTION, SUBDELEGATE)
            .assertTrue("subdelegation rights not found");

        vm.prank(SUBDELEGATE);
        delegation.registerDelegationAddressUsingSubDelegation(
            DELEGATOR, COLLECTION, DELEGATE, expiry, USE_CASE, false, TOKEN_ID
        );

        delegation.retrieveTokenStatus(DELEGATOR, COLLECTION, DELEGATE, USE_CASE, TOKEN_ID)
            .assertTrue("subdelegated token registration missing");

        vm.prank(SUBDELEGATE);
        delegation.revokeDelegationAddressUsingSubdelegation(
            DELEGATOR, COLLECTION, DELEGATE, USE_CASE
        );

        delegation.retrieveTokenStatus(DELEGATOR, COLLECTION, DELEGATE, USE_CASE, TOKEN_ID)
            .assertFalse("revoked token delegation still active");
        delegation.retrieveGlobalStatusOfDelegation(DELEGATOR, COLLECTION, DELEGATE, USE_CASE)
            .assertFalse("revoked global delegation still active");
    }

    function testGenerativeScriptAccumulatorStartsEmptyForEmptyCollectionScript() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        uint256 collectionId = 2;
        uint256 tokenId = 1;
        uint256 salt = 99;
        string[] memory emptyScripts = new string[](0);

        deployed.core
            .createCollection(
                "Empty",
                "6529",
                "Description",
                "https://6529.io",
                "CC0",
                "ipfs://empty/",
                "https://cdn.example/script.js",
                bytes32(0),
                emptyScripts
            );
        deployed.core.setCollectionData(collectionId, address(0xA11CE), 5, 3, 1 days);
        deployed.core.addRandomizer(collectionId, address(deployed.randomizer));
        deployed.minter
            .setCollectionPhases(collectionId, block.timestamp, block.timestamp + 30 days);

        vm.prank(address(deployed.minter));
        deployed.core.mint(tokenId, address(0xA11CE), "4,5", salt, collectionId);

        deployed.core.retrieveGenerativeScript(tokenId)
            .assertEq(
                _expectedGenerativeScript(tokenId, collectionId, salt),
                "empty script render changed"
            );
    }

    function testSetCollectionDataRejectsInitialZeroSupplyWithTypedError() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        string[] memory emptyScripts = new string[](0);

        deployed.core
            .createCollection(
                "Zero Supply",
                "6529",
                "Description",
                "https://6529.io",
                "CC0",
                "ipfs://zero-supply/",
                "https://cdn.example/script.js",
                bytes32(0),
                emptyScripts
            );

        vm.expectRevert(abi.encodeWithSelector(StreamCore.CollectionSupplyTooLarge.selector));
        deployed.core.setCollectionData(2, address(0xA11CE), 5, 0, 1 days);
    }

    function testMinterReturnsLastMintedIndexFromExplicitZeroStart() public {
        DeployedStream memory deployed = deployStream(address(0xBEEF), address(0xCAFE));
        address[] memory recipients = new address[](2);
        string[] memory tokenData = new string[](2);
        uint256[] memory salts = new uint256[](2);
        uint256[] memory quantities = new uint256[](2);

        recipients[0] = address(0xA11CE);
        recipients[1] = address(0xB0B);
        tokenData[0] = "1";
        tokenData[1] = "2";
        salts[0] = 11;
        salts[1] = 22;
        quantities[0] = 1;
        quantities[1] = 2;

        vm.prank(address(deployed.drops));
        uint256 lastMintedIndex = deployed.minter.mint(recipients, tokenData, salts, 1, quantities);

        lastMintedIndex.assertEq(3, "wrong last minted index");
    }

    function _expectedGenerativeScript(uint256 tokenId, uint256 collectionId, uint256 salt)
        private
        pure
        returns (string memory)
    {
        bytes32 tokenHash = keccak256(abi.encode(collectionId, tokenId, salt));
        return string.concat(
            "let hash='",
            Strings.toHexString(uint256(tokenHash), 32),
            "';let tokenId=",
            tokenId.toString(),
            ";let tokenDataRaw='4,5';let tokenData=JSON.parse('['+tokenDataRaw+']')",
            ";let dependencyScript='';"
        );
    }
}
