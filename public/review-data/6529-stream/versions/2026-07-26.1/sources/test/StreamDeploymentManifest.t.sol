// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../script/RehearseDeployment.s.sol";
import "../script/RehearseAuctionCeremony.s.sol";
import "../script/RehearseDeploymentSuite.s.sol";
import "../script/RehearseEmergencyRedeployment.s.sol";
import "../smart-contracts/AuctionContract.sol";
import "../smart-contracts/RandomizerRNG.sol";
import "../smart-contracts/RandomizerVRF.sol";
import "../smart-contracts/StreamAdmins.sol";
import "../smart-contracts/StreamAssetPolicyRegistry.sol";
import "../smart-contracts/StreamCollectionMetadata.sol";
import "../smart-contracts/StreamContractMetadata.sol";
import "../smart-contracts/StreamCore.sol";
import "../smart-contracts/StreamDrops.sol";
import "../smart-contracts/StreamMinter.sol";
import "../smart-contracts/StreamMintManager.sol";
import "../smart-contracts/StreamMintModuleRegistry.sol";
import "../smart-contracts/StreamPrimarySaleSettlement.sol";
import "../smart-contracts/StreamPreservationRecords.sol";
import "../smart-contracts/StreamRevenueResolver.sol";
import "./helpers/Assertions.sol";
import "./helpers/CharacterizationTestBase.sol";

contract StreamDeploymentManifestTest is CharacterizationTestBase {
    string private constant MANIFEST_SCHEMA_VERSION = "6529stream.deployment-manifest.v1";

    function testLocalDeploymentRehearsalWiresStackAndCeremony() public {
        vm.chainId(31_337);
        RehearseDeployment rehearsor = new RehearseDeployment();
        RehearseDeployment.DeploymentConfig memory config = rehearsor.defaultLocalConfig();

        RehearseDeployment.DeploymentResult memory result = rehearsor.deployLocal(config);

        Assertions.assertEq(result.chainId, 31_337, "chain id not recorded");
        Assertions.assertTrue(result.manifestHash != bytes32(0), "manifest hash missing");

        StreamAdmins admins = StreamAdmins(result.admins);
        StreamCore core = StreamCore(result.core);
        StreamContractMetadata metadata = StreamContractMetadata(result.contractMetadata);
        StreamDrops drops = StreamDrops(result.drops);
        StreamMinter minter = StreamMinter(result.minter);
        StreamAssetPolicyRegistry assetPolicyRegistry =
            StreamAssetPolicyRegistry(result.assetPolicyRegistry);
        StreamRevenueResolver revenueResolver = StreamRevenueResolver(result.revenueResolver);
        StreamPrimarySaleSettlement primarySaleSettlement =
            StreamPrimarySaleSettlement(result.primarySaleSettlement);

        Assertions.assertEq(admins.owner(), config.adminSafe, "admin owner not safe");
        Assertions.assertEq(core.owner(), config.adminSafe, "core owner not safe");
        Assertions.assertEq(
            assetPolicyRegistry.owner(), config.adminSafe, "asset policy owner not safe"
        );
        Assertions.assertEq(
            revenueResolver.owner(), config.adminSafe, "revenue resolver owner not safe"
        );
        Assertions.assertEq(
            primarySaleSettlement.owner(), config.adminSafe, "primary settlement owner not safe"
        );
        Assertions.assertTrue(admins.retrieveGlobalAdmin(config.adminSafe), "safe not admin");
        Assertions.assertFalse(admins.retrieveGlobalAdmin(config.deployer), "temp admin kept");
        Assertions.assertTrue(
            admins.retrieveFunctionAdmin(
                config.adminSafe, result.drops, drops.updateTDHsigner.selector
            ) == false,
            "unexpected function admin grant"
        );
        Assertions.assertTrue(admins.pauseGuardians(config.pauseGuardian), "guardian missing");
        Assertions.assertTrue(admins.unpauseAdmins(config.adminSafe), "unpause admin missing");
        Assertions.assertTrue(admins.signerManagers(config.adminSafe), "signer manager missing");
        Assertions.assertTrue(
            admins.signerLifecycleTargets(result.drops), "signer lifecycle target missing"
        );
        Assertions.assertEq(
            admins.emergencyRecipient(), config.emergencyRecipient, "emergency recipient"
        );

        Assertions.assertEq(core.minterContract(), result.minter, "core minter");
        Assertions.assertEq(metadata.streamCore(), result.core, "metadata core");
        Assertions.assertEq(metadata.adminsContract(), result.admins, "metadata admins");
        Assertions.assertEq(metadata.contractURI(), config.contractMetadataURI, "metadata uri");
        Assertions.assertEq(
            metadata.contractURIHash(),
            keccak256(bytes(config.contractMetadataURI)),
            "metadata uri hash"
        );
        Assertions.assertTrue(metadata.isStreamContractMetadata(), "metadata marker");
        _assertMetadataSatellites(result);
        Assertions.assertEq(minter.streamDrops(), result.drops, "minter drops");
        Assertions.assertEq(drops.auctionContract(), result.auctions, "drops auction");
        Assertions.assertEq(drops.payOutAddress(), config.payout, "drops payout");
        Assertions.assertEq(drops.curatorsPoolAddress(), result.curatorsPool, "drops curators pool");
        Assertions.assertTrue(revenueResolver.isStreamRevenueResolver(), "revenue resolver marker");
        Assertions.assertEq(
            revenueResolver.splitFactory(), result.splitFactory, "resolver split factory"
        );
        Assertions.assertTrue(
            primarySaleSettlement.isStreamPrimarySaleSettlement(), "primary settlement marker"
        );
        _assertMintModuleRegistry(result, config);
        Assertions.assertEq(
            address(primarySaleSettlement.revenueResolver()),
            result.revenueResolver,
            "settlement resolver"
        );
        Assertions.assertEq(
            address(primarySaleSettlement.assetPolicyRegistry()),
            result.assetPolicyRegistry,
            "settlement asset policy"
        );

        (uint256 startTime, uint256 endTime) =
            minter.retrieveCollectionPhases(result.sampleCollectionId);
        Assertions.assertEq(startTime, result.sampleMintStart, "mint start");
        Assertions.assertEq(endTime, result.sampleMintEnd, "mint end");

        (,, uint256 circulation, uint256 totalSupply,, address randomizer) =
            core.retrieveCollectionAdditionalData(result.sampleCollectionId);
        Assertions.assertEq(circulation, 0, "unexpected circulation");
        Assertions.assertEq(totalSupply, 10, "unexpected sample supply");
        Assertions.assertEq(randomizer, result.randomizerVrf, "sample randomizer");
        Assertions.assertTrue(
            NextGenRandomizerVRF(result.randomizerVrf).isRandomizerContract(), "vrf randomizer"
        );
        Assertions.assertTrue(
            NextGenRandomizerRNG(payable(result.randomizerRng)).isRandomizerContract(),
            "rng randomizer"
        );
        Assertions.assertTrue(
            StreamAuctions(result.auctions).isStreamAuctionsContract(), "auction contract"
        );
    }

    function _assertMintModuleRegistry(
        RehearseDeployment.DeploymentResult memory result,
        RehearseDeployment.DeploymentConfig memory config
    ) private view {
        StreamMintModuleRegistry mintModuleRegistry =
            StreamMintModuleRegistry(result.mintModuleRegistry);
        StreamMintManager mintManager = StreamMintManager(result.mintManager);

        Assertions.assertEq(
            mintModuleRegistry.owner(), config.adminSafe, "mint module registry owner not safe"
        );
        Assertions.assertTrue(
            mintModuleRegistry.isStreamMintModuleRegistry(), "mint module registry marker"
        );
        Assertions.assertEq(
            address(mintManager.moduleRegistry()),
            result.mintModuleRegistry,
            "mint manager module registry"
        );
    }

    function _assertMetadataSatellites(RehearseDeployment.DeploymentResult memory result)
        private
        view
    {
        StreamCollectionMetadata collectionMetadata =
            StreamCollectionMetadata(result.collectionMetadata);
        StreamPreservationRecords preservationRecords =
            StreamPreservationRecords(result.preservationRecords);

        Assertions.assertEq(
            collectionMetadata.streamCore(), result.core, "collection metadata core"
        );
        Assertions.assertEq(
            collectionMetadata.adminsContract(), result.admins, "collection metadata admins"
        );
        Assertions.assertTrue(
            collectionMetadata.isStreamCollectionMetadata(), "collection metadata marker"
        );
        Assertions.assertEq(
            preservationRecords.streamCore(), result.core, "preservation records core"
        );
        Assertions.assertEq(
            preservationRecords.adminsContract(), result.admins, "preservation records admins"
        );
        Assertions.assertTrue(
            preservationRecords.isStreamPreservationRecords(), "preservation records marker"
        );
    }

    function testDeploymentManifestJsonArtifactsParse() public view {
        string memory schema = vm.readFile("deployments/schema/deployment-manifest.schema.json");
        string memory example = vm.readFile("deployments/examples/anvil-6529stream-v0.1.0-001.json");

        Assertions.assertTrue(vm.parseJson(schema).length > 0, "schema json invalid");
        Assertions.assertTrue(vm.parseJson(example).length > 0, "example json invalid");
        Assertions.assertTrue(
            vm.parseJson(example, ".contracts.StreamCollectionMetadata").length > 0,
            "missing collection metadata contract entry"
        );
        Assertions.assertTrue(
            vm.parseJson(example, ".contracts.StreamPreservationRecords").length > 0,
            "missing preservation records contract entry"
        );
    }

    function testDeploymentManifestHashBindsSatelliteDeployments() public {
        vm.chainId(31_337);
        RehearseDeployment rehearsor = new RehearseDeployment();
        RehearseDeployment.DeploymentConfig memory config = rehearsor.defaultLocalConfig();

        RehearseDeployment.DeploymentResult memory first = rehearsor.deployLocal(config);
        RehearseDeployment.DeploymentResult memory second = rehearsor.deployLocal(config);

        Assertions.assertEq(
            first.manifestHash, _expectedManifestHash(config, first), "manifest hash reconstruction"
        );
        Assertions.assertTrue(
            first.collectionMetadata != second.collectionMetadata,
            "collection metadata address reused"
        );
        Assertions.assertTrue(
            first.preservationRecords != second.preservationRecords,
            "preservation records address reused"
        );
        Assertions.assertTrue(first.manifestHash != second.manifestHash, "manifest hash not bound");
        StreamCollectionMetadata reboundCollection =
            new StreamCollectionMetadata(first.core, first.admins, address(0));
        Assertions.assertTrue(
            _expectedManifestHashWithSatellites(
                config, first, address(reboundCollection), first.preservationRecords
            ) != first.manifestHash,
            "collection metadata identity not bound"
        );
        StreamPreservationRecords reboundPreservation =
            new StreamPreservationRecords(first.core, first.admins, address(0));
        Assertions.assertTrue(
            _expectedManifestHashWithSatellites(
                config, first, first.collectionMetadata, address(reboundPreservation)
            ) != first.manifestHash,
            "preservation records identity not bound"
        );
        Assertions.assertTrue(
            _expectedManifestHashWithSatellites(config, first, address(0), address(0))
                != first.manifestHash,
            "omitted metadata satellites not bound"
        );
    }

    function testDeploymentManifestHashBindsSatelliteAdminDependencies() public {
        vm.chainId(31_337);
        RehearseDeployment rehearsor = new RehearseDeployment();
        RehearseDeployment.DeploymentConfig memory config = rehearsor.defaultLocalConfig();

        RehearseDeployment.DeploymentResult memory collectionResult = rehearsor.deployLocal(config);
        bytes32 originalCollectionHash = _expectedManifestHash(config, collectionResult);
        StreamAdmins alternateCollectionAdmins = new StreamAdmins(config.tdhSigner);

        vm.prank(config.adminSafe);
        StreamCollectionMetadata(collectionResult.collectionMetadata)
            .updateAdminContract(address(alternateCollectionAdmins));

        Assertions.assertTrue(
            _expectedManifestHash(config, collectionResult) != originalCollectionHash,
            "collection metadata admin binding not bound"
        );

        RehearseDeployment.DeploymentResult memory preservationResult =
            rehearsor.deployLocal(config);
        bytes32 originalPreservationHash = _expectedManifestHash(config, preservationResult);
        StreamAdmins alternatePreservationAdmins = new StreamAdmins(config.tdhSigner);

        vm.prank(config.adminSafe);
        StreamPreservationRecords(preservationResult.preservationRecords)
            .updateAdminContract(address(alternatePreservationAdmins));

        Assertions.assertTrue(
            _expectedManifestHash(config, preservationResult) != originalPreservationHash,
            "preservation records admin binding not bound"
        );
    }

    function testLocalAuctionCeremonyRehearsalSettlesAndWithdrawsProceeds() public {
        vm.chainId(31_337);
        RehearseAuctionCeremony rehearsor = new RehearseAuctionCeremony();

        RehearseAuctionCeremony.AuctionCeremonyResult memory result = rehearsor.run();

        Assertions.assertEq(result.chainId, 31_337, "chain id not recorded");
        Assertions.assertTrue(result.deploymentManifestHash != bytes32(0), "manifest hash missing");
        Assertions.assertEq(result.collectionId, 1, "collection id");
        Assertions.assertTrue(result.dropId != bytes32(0), "drop id missing");
        Assertions.assertEq(result.tokenId, 1, "token id");
        Assertions.assertEq(
            result.finalOwner, address(0x00000000000000000000000000000000000065A2), "final owner"
        );
        Assertions.assertEq(
            result.highestBidder,
            address(0x00000000000000000000000000000000000065A2),
            "highest bidder"
        );
        Assertions.assertEq(result.highestBid, 4 ether, "highest bid");
        Assertions.assertEq(
            result.finalStatus, uint8(StreamAuctions.AuctionStatus.SettledWithBid), "final status"
        );
        Assertions.assertEq(result.posterProceedsWithdrawn, 2 ether, "poster proceeds");
        Assertions.assertEq(result.protocolProceedsWithdrawn, 1 ether, "protocol proceeds");
        Assertions.assertEq(result.curatorProceedsWithdrawn, 1 ether, "curator proceeds");
        Assertions.assertEq(result.totalOwedAfterWithdrawals, 0, "owed after withdrawals");
        Assertions.assertEq(
            keccak256(bytes(result.evidenceKind)),
            keccak256(bytes("local-anvil-auction-ceremony")),
            "evidence kind"
        );
    }

    function testLocalEmergencyRedeploymentRehearsalProducesReplacementEvidence() public {
        vm.chainId(31_337);
        RehearseEmergencyRedeployment rehearsor = new RehearseEmergencyRedeployment();

        RehearseEmergencyRedeployment.EmergencyRedeploymentResult memory result = rehearsor.run();

        Assertions.assertEq(result.chainId, 31_337, "chain id not recorded");
        Assertions.assertEq(
            result.evidenceKindHash,
            keccak256(bytes("local-anvil-emergency-redeployment")),
            "evidence kind"
        );
        Assertions.assertEq(
            result.oldLifecycleStateHash, keccak256(bytes("EmergencySuperseded")), "old lifecycle"
        );
        Assertions.assertEq(
            result.replacementLifecycleStateHash, keccak256(bytes("Rehearsed")), "new lifecycle"
        );
        Assertions.assertEq(
            result.oldDeploymentVersionHash,
            keccak256(bytes("anvil-6529stream-v0.1.0-001")),
            "old version"
        );
        Assertions.assertEq(
            result.replacementDeploymentVersionHash,
            keccak256(bytes("anvil-6529stream-v0.1.0-emergency-002")),
            "replacement version"
        );
        Assertions.assertTrue(result.oldManifestHash != bytes32(0), "old manifest missing");
        Assertions.assertTrue(
            result.replacementManifestHash != bytes32(0), "replacement manifest missing"
        );
        Assertions.assertTrue(
            result.oldManifestHash != result.replacementManifestHash, "manifest reused"
        );
        Assertions.assertTrue(
            result.oldDropDomainSeparator != result.replacementDropDomainSeparator,
            "drop domain reused"
        );
        Assertions.assertEq(
            result.adminSafe, address(0x0000000000000000000000000000000000006529), "admin safe"
        );
        Assertions.assertEq(result.tdhSigner, vm.addr(0xA11CE), "signer");
        Assertions.assertTrue(result.oldCore != result.replacementCore, "core reused");
        Assertions.assertTrue(result.oldDrops != result.replacementDrops, "drops reused");
        Assertions.assertTrue(result.oldAuctions != result.replacementAuctions, "auctions reused");
        Assertions.assertEq(result.oldCollectionId, 1, "old collection");
        Assertions.assertEq(result.replacementCollectionId, 1, "replacement collection");
        Assertions.assertEq(result.replacementTokenId, 1, "replacement token");
        Assertions.assertEq(
            result.replacementTokenOwner,
            address(0x00000000000000000000000000000000000065E2),
            "replacement token owner"
        );
        Assertions.assertTrue(
            result.replacementTokenHash != bytes32(0), "replacement token hash missing"
        );
        Assertions.assertEq(result.replacementSignerEpoch, 1, "replacement signer epoch");
    }

    function testAggregateDeploymentSuiteRunsAllRehearsals() public {
        vm.chainId(31_337);
        uint256 snapshotId = vm.snapshotState();
        vm.pauseGasMetering();
        RehearseDeploymentSuite suite = new RehearseDeploymentSuite();

        RehearseDeploymentSuite.DeploymentSuiteResult memory result = suite.run();
        vm.resumeGasMetering();

        Assertions.assertEq(
            result.suiteKindHash, keccak256(bytes("local-anvil-deployment-suite")), "suite kind"
        );
        Assertions.assertTrue(result.suiteHash != bytes32(0), "suite hash missing");
        Assertions.assertEq(
            result.suiteHash,
            keccak256(
                abi.encode(
                    result.suiteKindHash, result.deployment, result.auction, result.emergency
                )
            ),
            "suite hash"
        );
        Assertions.assertEq(result.deployment.chainId, 31_337, "deployment chain id");
        Assertions.assertEq(result.auction.chainId, 31_337, "auction chain id");
        Assertions.assertEq(result.emergency.chainId, 31_337, "emergency chain id");
        Assertions.assertTrue(
            result.deployment.manifestHash != bytes32(0), "deployment manifest missing"
        );
        Assertions.assertEq(
            keccak256(bytes(result.auction.evidenceKind)),
            keccak256(bytes("local-anvil-auction-ceremony")),
            "auction evidence kind"
        );
        Assertions.assertEq(
            result.auction.finalStatus,
            uint8(StreamAuctions.AuctionStatus.SettledWithBid),
            "auction final status"
        );
        Assertions.assertEq(result.auction.totalOwedAfterWithdrawals, 0, "auction owed");
        Assertions.assertEq(
            result.emergency.evidenceKindHash,
            keccak256(bytes("local-anvil-emergency-redeployment")),
            "emergency kind"
        );
        Assertions.assertTrue(
            result.emergency.oldManifestHash != result.emergency.replacementManifestHash,
            "emergency manifest reused"
        );
        Assertions.assertTrue(
            result.emergency.oldDropDomainSeparator
                != result.emergency.replacementDropDomainSeparator,
            "emergency domain reused"
        );

        Assertions.assertTrue(vm.revertToState(snapshotId), "revert suite snapshot");
        vm.chainId(31_337);
        vm.pauseGasMetering();
        RehearseDeploymentSuite replayedSuite = new RehearseDeploymentSuite();
        RehearseDeploymentSuite.DeploymentSuiteResult memory replayed = replayedSuite.run();
        vm.resumeGasMetering();
        Assertions.assertEq(replayed.suiteHash, result.suiteHash, "suite hash replay");
    }

    function _expectedManifestHash(
        RehearseDeployment.DeploymentConfig memory config,
        RehearseDeployment.DeploymentResult memory result
    ) private view returns (bytes32) {
        return _expectedManifestHashWithSatellites(
            config, result, result.collectionMetadata, result.preservationRecords
        );
    }

    function _expectedManifestHashWithSatellites(
        RehearseDeployment.DeploymentConfig memory config,
        RehearseDeployment.DeploymentResult memory result,
        address collectionMetadata,
        address preservationRecords
    ) private view returns (bytes32) {
        return keccak256(
            abi.encode(
                MANIFEST_SCHEMA_VERSION,
                _versionHash(config),
                _adminHash(config),
                _contractMetadataHash(config),
                _externalDependencyHash(config),
                _deployedContractsHash(result, collectionMetadata, preservationRecords),
                result.chainId,
                result.sampleCollectionId,
                result.sampleMintStart,
                result.sampleMintEnd
            )
        );
    }

    function _deployedContractsHash(
        RehearseDeployment.DeploymentResult memory result,
        address collectionMetadata,
        address preservationRecords
    ) private view returns (bytes32) {
        return keccak256(
            abi.encode(
                _deploymentIdentityHash(result, collectionMetadata, preservationRecords),
                _metadataCommerceHash(result),
                _mintRandomizerHash(result)
            )
        );
    }

    function _deploymentIdentityHash(
        RehearseDeployment.DeploymentResult memory result,
        address collectionMetadata,
        address preservationRecords
    ) private view returns (bytes32) {
        return keccak256(
            abi.encode(
                _contractBinding(result.admins),
                _contractBinding(result.dependencyRegistry),
                _contractBinding(result.core),
                _contractBinding(result.contractMetadata),
                _collectionMetadataBinding(collectionMetadata),
                _preservationRecordsBinding(preservationRecords)
            )
        );
    }

    function _collectionMetadataBinding(address collectionMetadata) private view returns (bytes32) {
        if (collectionMetadata.code.length == 0) {
            return keccak256(
                abi.encode(_contractBinding(collectionMetadata), address(0), address(0), address(0))
            );
        }
        StreamCollectionMetadata metadata = StreamCollectionMetadata(collectionMetadata);
        return keccak256(
            abi.encode(
                _contractBinding(collectionMetadata),
                metadata.streamCore(),
                metadata.adminsContract(),
                metadata.streamModuleSupersedes()
            )
        );
    }

    function _preservationRecordsBinding(address preservationRecords)
        private
        view
        returns (bytes32)
    {
        if (preservationRecords.code.length == 0) {
            return keccak256(
                abi.encode(
                    _contractBinding(preservationRecords), address(0), address(0), address(0)
                )
            );
        }
        StreamPreservationRecords records = StreamPreservationRecords(preservationRecords);
        return keccak256(
            abi.encode(
                _contractBinding(preservationRecords),
                records.streamCore(),
                records.adminsContract(),
                records.streamModuleSupersedes()
            )
        );
    }

    function _metadataCommerceHash(RehearseDeployment.DeploymentResult memory result)
        private
        view
        returns (bytes32)
    {
        return keccak256(
            abi.encode(
                _contractBinding(result.curatorsPool),
                _contractBinding(result.drops),
                _contractBinding(result.auctions),
                _contractBinding(result.assetPolicyRegistry),
                _contractBinding(result.splitFactory),
                _contractBinding(result.revenueResolver),
                _contractBinding(result.primarySaleSettlement)
            )
        );
    }

    function _mintRandomizerHash(RehearseDeployment.DeploymentResult memory result)
        private
        view
        returns (bytes32)
    {
        return keccak256(
            abi.encode(
                _contractBinding(result.minter),
                _contractBinding(result.mintLedger),
                _contractBinding(result.mintModuleRegistry),
                _contractBinding(result.mintManager),
                _contractBinding(result.randomizerVrf),
                _contractBinding(result.randomizerRng)
            )
        );
    }

    function _contractBinding(address target) private view returns (bytes32) {
        return keccak256(abi.encode(target, target.codehash));
    }

    function _contains(bytes memory input, bytes memory needle) private pure returns (bool) {
        if (needle.length == 0 || needle.length > input.length) return false;
        for (uint256 i = 0; i <= input.length - needle.length; i++) {
            bool matched = true;
            for (uint256 j = 0; j < needle.length; j++) {
                if (input[i + j] != needle[j]) {
                    matched = false;
                    break;
                }
            }
            if (matched) return true;
        }
        return false;
    }

    function _versionHash(RehearseDeployment.DeploymentConfig memory config)
        private
        pure
        returns (bytes32)
    {
        return keccak256(abi.encode(config.protocolVersion, config.deploymentVersion));
    }

    function _contractMetadataHash(RehearseDeployment.DeploymentConfig memory config)
        private
        pure
        returns (bytes32)
    {
        return keccak256(bytes(config.contractMetadataURI));
    }

    function _adminHash(RehearseDeployment.DeploymentConfig memory config)
        private
        pure
        returns (bytes32)
    {
        return keccak256(
            abi.encode(
                config.deployer,
                config.adminSafe,
                config.pauseGuardian,
                config.emergencyRecipient,
                config.tdhSigner,
                config.payout
            )
        );
    }

    function _externalDependencyHash(RehearseDeployment.DeploymentConfig memory config)
        private
        pure
        returns (bytes32)
    {
        return keccak256(
            abi.encode(
                config.delegation,
                config.vrfCoordinator,
                config.arrngController,
                config.vrfSubscriptionId
            )
        );
    }
}
