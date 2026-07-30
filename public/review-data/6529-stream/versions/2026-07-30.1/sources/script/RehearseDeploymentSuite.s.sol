// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./RehearseAuctionCeremony.s.sol";
import "./RehearseDeployment.s.sol";
import "./RehearseEmergencyRedeployment.s.sol";

contract RehearseDeploymentSuite {
    bytes32 public constant SUITE_KIND_HASH = keccak256("local-anvil-deployment-suite");

    struct DeploymentSuiteResult {
        bytes32 suiteKindHash;
        RehearseDeployment.DeploymentResult deployment;
        RehearseAuctionCeremony.AuctionCeremonyResult auction;
        RehearseEmergencyRedeployment.EmergencyRedeploymentResult emergency;
        bytes32 suiteHash;
    }

    function run() external returns (DeploymentSuiteResult memory result) {
        result.deployment = (new RehearseDeployment()).run();
        result.auction = (new RehearseAuctionCeremony()).run();
        result.emergency = (new RehearseEmergencyRedeployment()).run();
        result.suiteKindHash = SUITE_KIND_HASH;
        result.suiteHash = _suiteHash(result);
    }

    function _suiteHash(DeploymentSuiteResult memory result) private pure returns (bytes32) {
        return keccak256(
            abi.encode(result.suiteKindHash, result.deployment, result.auction, result.emergency)
        );
    }
}
