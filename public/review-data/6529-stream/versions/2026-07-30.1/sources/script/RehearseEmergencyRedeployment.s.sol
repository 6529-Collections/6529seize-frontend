// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../smart-contracts/IRandomizer.sol";
import "../smart-contracts/IStreamCore.sol";
import "../smart-contracts/StreamAdmins.sol";
import "../smart-contracts/StreamCore.sol";
import "../smart-contracts/StreamDrops.sol";
import "./RehearseDeployment.s.sol";

interface EmergencyRedeploymentVm {
    function addr(uint256 privateKey) external returns (address);
    function sign(uint256 privateKey, bytes32 digest)
        external
        returns (uint8 v, bytes32 r, bytes32 s);
    function startBroadcast(address broadcaster) external;
    function stopBroadcast() external;
}

contract EmergencyRedeploymentRandomizer is IRandomizer {
    IStreamCore private immutable core;

    constructor(address core_) {
        core = IStreamCore(core_);
    }

    function calculateTokenHash(uint256 collectionId, uint256 mintIndex, uint256 saltfunO)
        external
    {
        core.setTokenHash(
            collectionId, mintIndex, deterministicHash(collectionId, mintIndex, saltfunO)
        );
    }

    function deterministicHash(uint256 collectionId, uint256 mintIndex, uint256 saltfunO)
        public
        pure
        returns (bytes32)
    {
        return keccak256(
            abi.encode("local-emergency-redeployment", collectionId, mintIndex, saltfunO)
        );
    }

    function isRandomizerContract() external pure returns (bool) {
        return true;
    }
}

contract RehearseEmergencyRedeployment {
    EmergencyRedeploymentVm private constant vm =
        EmergencyRedeploymentVm(address(uint160(uint256(keccak256("hevm cheat code")))));

    uint256 private constant SIGNER_KEY = 0xA11CE;
    string private constant REPLACEMENT_DEPLOYMENT_VERSION =
        "anvil-6529stream-v0.1.0-emergency-002";
    bytes32 private constant EVIDENCE_KIND_HASH = keccak256("local-anvil-emergency-redeployment");
    bytes32 private constant OLD_LIFECYCLE_STATE_HASH = keccak256("EmergencySuperseded");
    bytes32 private constant REPLACEMENT_LIFECYCLE_STATE_HASH = keccak256("Rehearsed");
    string private constant TOKEN_DATA = "emergency-redeployment-smoke";
    address private constant POSTER = address(0x00000000000000000000000000000000000065E1);
    address private constant RECIPIENT = address(0x00000000000000000000000000000000000065E2);

    struct EmergencyRedeploymentResult {
        bytes32 evidenceKindHash;
        uint256 chainId;
        bytes32 oldLifecycleStateHash;
        bytes32 replacementLifecycleStateHash;
        bytes32 oldDeploymentVersionHash;
        bytes32 replacementDeploymentVersionHash;
        bytes32 oldManifestHash;
        bytes32 replacementManifestHash;
        bytes32 oldDropDomainSeparator;
        bytes32 replacementDropDomainSeparator;
        address adminSafe;
        address tdhSigner;
        address oldCore;
        address replacementCore;
        address oldDrops;
        address replacementDrops;
        address oldAuctions;
        address replacementAuctions;
        uint256 oldCollectionId;
        uint256 replacementCollectionId;
        uint256 replacementTokenId;
        address replacementTokenOwner;
        bytes32 replacementTokenHash;
        uint256 replacementSignerEpoch;
    }

    function run() external returns (EmergencyRedeploymentResult memory result) {
        RehearseDeployment deployment = new RehearseDeployment();
        RehearseDeployment.DeploymentConfig memory oldConfig = deployment.defaultLocalConfig();
        oldConfig.tdhSigner = vm.addr(SIGNER_KEY);
        bytes32 oldDeploymentVersionHash = keccak256(bytes(oldConfig.deploymentVersion));

        RehearseDeployment.DeploymentResult memory oldDeployment = deployment.deployLocal(oldConfig);
        _assertDeploymentCeremony(oldDeployment, oldConfig);

        RehearseDeployment.DeploymentConfig memory replacementConfig =
            deployment.defaultLocalConfig();
        replacementConfig.tdhSigner = oldConfig.tdhSigner;
        replacementConfig.deploymentVersion = REPLACEMENT_DEPLOYMENT_VERSION;
        bytes32 replacementDeploymentVersionHash =
            keccak256(bytes(replacementConfig.deploymentVersion));
        _assert(
            oldDeploymentVersionHash != replacementDeploymentVersionHash,
            "deployment version reused"
        );
        RehearseDeployment.DeploymentResult memory replacementDeployment =
            deployment.deployLocal(replacementConfig);
        _assertDeploymentCeremony(replacementDeployment, replacementConfig);
        _assertDistinctDeployments(oldDeployment, replacementDeployment);

        (uint256 tokenId, bytes32 tokenHash, uint256 signerEpoch) =
            _smokeMintReplacement(replacementDeployment, replacementConfig);

        bytes32 oldDomainSeparator = StreamDrops(oldDeployment.drops).domainSeparator();
        bytes32 replacementDomainSeparator =
            StreamDrops(replacementDeployment.drops).domainSeparator();
        _assert(oldDomainSeparator != replacementDomainSeparator, "drop domain reused");

        result = EmergencyRedeploymentResult({
            evidenceKindHash: EVIDENCE_KIND_HASH,
            chainId: replacementDeployment.chainId,
            oldLifecycleStateHash: OLD_LIFECYCLE_STATE_HASH,
            replacementLifecycleStateHash: REPLACEMENT_LIFECYCLE_STATE_HASH,
            oldDeploymentVersionHash: oldDeploymentVersionHash,
            replacementDeploymentVersionHash: replacementDeploymentVersionHash,
            oldManifestHash: oldDeployment.manifestHash,
            replacementManifestHash: replacementDeployment.manifestHash,
            oldDropDomainSeparator: oldDomainSeparator,
            replacementDropDomainSeparator: replacementDomainSeparator,
            adminSafe: replacementConfig.adminSafe,
            tdhSigner: replacementConfig.tdhSigner,
            oldCore: oldDeployment.core,
            replacementCore: replacementDeployment.core,
            oldDrops: oldDeployment.drops,
            replacementDrops: replacementDeployment.drops,
            oldAuctions: oldDeployment.auctions,
            replacementAuctions: replacementDeployment.auctions,
            oldCollectionId: oldDeployment.sampleCollectionId,
            replacementCollectionId: replacementDeployment.sampleCollectionId,
            replacementTokenId: tokenId,
            replacementTokenOwner: StreamCore(replacementDeployment.core).ownerOf(tokenId),
            replacementTokenHash: tokenHash,
            replacementSignerEpoch: signerEpoch
        });
    }

    function _assertDeploymentCeremony(
        RehearseDeployment.DeploymentResult memory deployed,
        RehearseDeployment.DeploymentConfig memory config
    ) private view {
        StreamAdmins admins = StreamAdmins(deployed.admins);
        _assert(admins.owner() == config.adminSafe, "admins owner not safe");
        _assert(StreamCore(deployed.core).owner() == config.adminSafe, "core owner not safe");
        _assert(admins.retrieveGlobalAdmin(config.adminSafe), "safe not admin");
        _assert(!admins.retrieveGlobalAdmin(config.deployer), "deployer admin retained");
        _assert(admins.emergencyRecipient() == config.emergencyRecipient, "emergency recipient");
        _assert(StreamDrops(deployed.drops).tdhSigner() == config.tdhSigner, "signer mismatch");
    }

    function _assertDistinctDeployments(
        RehearseDeployment.DeploymentResult memory oldDeployment,
        RehearseDeployment.DeploymentResult memory replacementDeployment
    ) private pure {
        _assert(oldDeployment.manifestHash != bytes32(0), "old manifest missing");
        _assert(replacementDeployment.manifestHash != bytes32(0), "replacement manifest missing");
        _assert(oldDeployment.manifestHash != replacementDeployment.manifestHash, "manifest reused");
        _assert(oldDeployment.core != replacementDeployment.core, "core reused");
        _assert(oldDeployment.drops != replacementDeployment.drops, "drops reused");
        _assert(oldDeployment.auctions != replacementDeployment.auctions, "auctions reused");
    }

    function _smokeMintReplacement(
        RehearseDeployment.DeploymentResult memory deployed,
        RehearseDeployment.DeploymentConfig memory config
    ) private returns (uint256 tokenId, bytes32 tokenHash, uint256 signerEpoch) {
        StreamCore core = StreamCore(deployed.core);
        StreamDrops drops = StreamDrops(deployed.drops);

        vm.startBroadcast(config.adminSafe);
        EmergencyRedeploymentRandomizer randomizer =
            new EmergencyRedeploymentRandomizer(address(core));
        core.addRandomizer(deployed.sampleCollectionId, address(randomizer));
        vm.stopBroadcast();

        StreamDrops.DropAuthorization memory authorization =
            _buildAuthorization(drops, deployed.sampleCollectionId);
        bytes memory signature = _signAuthorization(drops, authorization);

        vm.startBroadcast(RECIPIENT);
        drops.mintDrop(authorization, TOKEN_DATA, signature);
        vm.stopBroadcast();

        signerEpoch = authorization.signerEpoch;
        tokenId = drops.retrieveTokenID(authorization.dropId);
        tokenHash = core.retrieveTokenHash(tokenId);
        bytes32 expectedTokenHash =
            randomizer.deterministicHash(deployed.sampleCollectionId, tokenId, 0);

        _assert(core.ownerOf(tokenId) == RECIPIENT, "replacement mint owner");
        _assert(drops.isDropConsumed(authorization.dropId), "replacement drop not consumed");
        _assert(tokenHash != bytes32(0), "replacement token hash missing");
        _assert(tokenHash == expectedTokenHash, "replacement token hash mismatch");
        _assert(drops.totalOwed() == 0, "replacement owed funds");
    }

    function _buildAuthorization(StreamDrops drops, uint256 collectionId)
        private
        view
        returns (StreamDrops.DropAuthorization memory authorization)
    {
        uint256 nonce = 20;
        uint256 salt = 21;
        uint256 signerEpoch = drops.signerEpoch();
        authorization = StreamDrops.DropAuthorization({
            dropId: drops.deriveDropId(drops.tdhSigner(), signerEpoch, nonce, salt),
            poster: POSTER,
            recipient: RECIPIENT,
            payer: address(0),
            collectionId: collectionId,
            saleMode: drops.SALE_MODE_FIXED_PRICE(),
            tokenDataHash: keccak256(bytes(TOKEN_DATA)),
            price: 0,
            quantity: 1,
            auctionReservePrice: 0,
            auctionEndTime: 0,
            salt: salt,
            nonce: nonce,
            deadline: block.timestamp + 1 days,
            signerEpoch: signerEpoch
        });
    }

    function _signAuthorization(
        StreamDrops drops,
        StreamDrops.DropAuthorization memory authorization
    ) private returns (bytes memory) {
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(
            SIGNER_KEY, drops.hashDropAuthorization(authorization)
        );
        return abi.encodePacked(r, s, v);
    }

    function _assert(bool condition, string memory message) private pure {
        require(condition, message);
    }
}
