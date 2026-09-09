// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../../vendor/openzeppelin/IERC165.sol";
import "../../interfaces/stream/IStreamMintGate.sol";
import "../../interfaces/stream/IStreamMintManager.sol";
import "../../interfaces/stream/IStreamMintModuleRegistry.sol";
import "./StreamMintOperationIdentity.sol";

/// @notice Closed-world gate configuration and request validation for StreamMintManager.
/// @dev Linked so complete gate validation does not make the manager undeployable.
library StreamMintGateValidator {
    uint256 private constant GATE_ERC165_PROBE_GAS = 30_000;
    uint256 private constant MAX_GATE_NULLIFIERS = 16;

    struct GateCall {
        address gate;
        uint32 gasLimit;
        address executor;
        uint256 collectionId;
        bytes32 phaseId;
        address payer;
        address authorizer;
        address[] initialRecipients;
        address[] beneficiaries;
        bytes32 contextHash;
        bytes32 policyHash;
        bytes gateData;
    }

    function validateConfiguration(
        IStreamMintManager.MintGateConfig calldata gateConfig,
        IStreamMintModuleRegistry moduleRegistry
    ) external view returns (IStreamMintManager.MintGateConfig memory) {
        if (gateConfig.gate == address(0)) {
            if (
                gateConfig.gateConfigHash != bytes32(0) || gateConfig.gateCodehash != bytes32(0)
                    || gateConfig.gateMetadataHash != bytes32(0)
                    || gateConfig.gateSemanticVersion != 0 || gateConfig.gateGasLimit != 0
            ) {
                revert IStreamMintManager.InvalidMintGate(gateConfig.gate);
            }
            return gateConfig;
        }
        if (gateConfig.gateConfigHash == bytes32(0)) {
            revert IStreamMintManager.InvalidMintGate(gateConfig.gate);
        }

        IStreamMintModuleRegistry.MintModuleInfo memory info =
            _requireActiveGateInfo(moduleRegistry, gateConfig.gate);
        bytes32 actualCodehash = gateConfig.gate.codehash;
        if (gateConfig.gateCodehash != bytes32(0) && gateConfig.gateCodehash != actualCodehash) {
            revert IStreamMintManager.MintGateCodehashChanged(
                gateConfig.gate, gateConfig.gateCodehash, actualCodehash
            );
        }
        if (
            gateConfig.gateMetadataHash != bytes32(0)
                && gateConfig.gateMetadataHash != info.metadataHash
        ) {
            revert IStreamMintManager.InvalidMintGate(gateConfig.gate);
        }
        if (
            gateConfig.gateSemanticVersion != 0
                && gateConfig.gateSemanticVersion != info.semanticVersion
        ) {
            revert IStreamMintManager.InvalidMintGate(gateConfig.gate);
        }
        if (gateConfig.gateGasLimit != 0 && gateConfig.gateGasLimit != info.gasLimit) {
            revert IStreamMintManager.InvalidMintGate(gateConfig.gate);
        }

        return IStreamMintManager.MintGateConfig({
            gate: gateConfig.gate,
            gateConfigHash: gateConfig.gateConfigHash,
            gateCodehash: actualCodehash,
            gateMetadataHash: info.metadataHash,
            gateSemanticVersion: info.semanticVersion,
            gateGasLimit: info.gasLimit
        });
    }

    function validateAuthorization(
        IStreamMintManager.MintBatch calldata batch,
        bytes calldata gateData,
        uint256 quantity,
        bytes32 boundPolicyHash,
        IStreamMintManager.MintGateConfig memory gateConfig,
        IStreamMintModuleRegistry moduleRegistry,
        address executor
    ) external view returns (StreamMintOperationIdentity.MintAuthorization memory) {
        if (batch.authorizationId == bytes32(0)) {
            revert IStreamMintManager.MintAuthorizationRequired(batch.collectionId, batch.phaseId);
        }
        if (gateConfig.gate == address(0)) {
            if (batch.authorizer != address(0)) {
                revert IStreamMintManager.MintInvalidAuthorizerKind(
                    uint8(IStreamMintManager.AuthorizerKind.NONE), batch.authorizer
                );
            }
            return StreamMintOperationIdentity.MintAuthorization({
                authorizationId: batch.authorizationId,
                nullifiers: new bytes32[](0),
                authorizer: address(0),
                authorizerKind: IStreamMintManager.AuthorizerKind.NONE,
                maxQuantity: 0,
                gateHash: bytes32(0)
            });
        }

        _requireGateStillActive(moduleRegistry, gateConfig);
        IStreamMintGate.GateResult memory result =
            _callGate(batch, gateData, boundPolicyHash, gateConfig, executor);
        if (result.nullifiers.length > MAX_GATE_NULLIFIERS) {
            revert IStreamMintManager.MintGateNullifierCountExceeded(
                result.nullifiers.length, MAX_GATE_NULLIFIERS
            );
        }
        _canonicalizeNullifiers(result.nullifiers);
        if (result.maxQuantity != 0 && quantity > result.maxQuantity) {
            revert IStreamMintManager.MintGateQuantityExceeded(quantity, result.maxQuantity);
        }
        if (result.gateHash == bytes32(0)) {
            revert IStreamMintManager.MintGateHashRequired(gateConfig.gate);
        }
        if (result.authorizer != batch.authorizer) {
            revert IStreamMintManager.MintGateAuthorizerMismatch(
                batch.authorizer, result.authorizer
            );
        }
        _requireAuthorizerKind(result.authorizerKind, result.authorizer, executor);
        if (result.authorizationId != batch.authorizationId) {
            revert IStreamMintManager.MintGateAuthorizationMismatch(
                batch.authorizationId, result.authorizationId
            );
        }
        return StreamMintOperationIdentity.MintAuthorization({
            authorizationId: result.authorizationId,
            nullifiers: result.nullifiers,
            authorizer: result.authorizer,
            authorizerKind: IStreamMintManager.AuthorizerKind(result.authorizerKind),
            maxQuantity: result.maxQuantity,
            gateHash: result.gateHash
        });
    }

    function _callGate(
        IStreamMintManager.MintBatch calldata batch,
        bytes calldata gateData,
        bytes32 boundPolicyHash,
        IStreamMintManager.MintGateConfig memory gateConfig,
        address executor
    ) private view returns (IStreamMintGate.GateResult memory) {
        // Every GateCall field is assigned below before any field is read or encoded.
        // slither-disable-next-line uninitialized-local
        GateCall memory gateCall;
        gateCall.gate = gateConfig.gate;
        gateCall.gasLimit = gateConfig.gateGasLimit;
        gateCall.executor = executor;
        gateCall.collectionId = batch.collectionId;
        gateCall.phaseId = batch.phaseId;
        gateCall.payer = batch.payer;
        gateCall.authorizer = batch.authorizer;
        gateCall.initialRecipients = batch.initialRecipients;
        gateCall.beneficiaries = batch.beneficiaries;
        gateCall.contextHash = batch.contextHash;
        gateCall.policyHash = boundPolicyHash;
        gateCall.gateData = gateData;

        bytes memory payload = abi.encodeWithSelector(
            IStreamMintGate.validateMint.selector,
            address(this),
            gateCall.executor,
            gateCall.collectionId,
            gateCall.phaseId,
            gateCall.payer,
            gateCall.authorizer,
            gateCall.initialRecipients,
            gateCall.beneficiaries,
            gateCall.contextHash,
            gateCall.policyHash,
            gateCall.gateData
        );
        (bool ok, bytes memory returndata) =
            gateCall.gate.staticcall{ gas: gateCall.gasLimit }(payload);
        if (!ok) {
            revert IStreamMintManager.MintGateValidationFailed(gateCall.gate);
        }
        return abi.decode(returndata, (IStreamMintGate.GateResult));
    }

    function _requireAuthorizerKind(uint8 kind, address authorizer, address executor) private pure {
        if (kind > uint8(IStreamMintManager.AuthorizerKind.CALLER_ADAPTER)) {
            revert IStreamMintManager.MintInvalidAuthorizerKind(kind, authorizer);
        }
        IStreamMintManager.AuthorizerKind authorizerKind = IStreamMintManager.AuthorizerKind(kind);
        if (
            (authorizerKind == IStreamMintManager.AuthorizerKind.NONE && authorizer != address(0))
                || (authorizerKind != IStreamMintManager.AuthorizerKind.NONE
                    && authorizer == address(0))
                || (authorizerKind == IStreamMintManager.AuthorizerKind.CALLER_ADAPTER
                    && authorizer != executor)
        ) {
            revert IStreamMintManager.MintInvalidAuthorizerKind(kind, authorizer);
        }
    }

    function _canonicalizeNullifiers(bytes32[] memory nullifiers) private pure {
        for (uint256 i = 0; i < nullifiers.length; i++) {
            bytes32 value = nullifiers[i];
            if (value == bytes32(0)) {
                revert IStreamMintManager.MintGateNullifiersUnsupported(value);
            }
            uint256 j = i;
            while (j != 0 && uint256(nullifiers[j - 1]) > uint256(value)) {
                nullifiers[j] = nullifiers[j - 1];
                j--;
            }
            if (j != 0 && nullifiers[j - 1] == value) {
                revert IStreamMintManager.MintGateNullifiersUnsupported(value);
            }
            nullifiers[j] = value;
        }
    }

    function _requireGateStillActive(
        IStreamMintModuleRegistry moduleRegistry,
        IStreamMintManager.MintGateConfig memory gateConfig
    ) private view {
        IStreamMintModuleRegistry.MintModuleInfo memory info =
            _requireActiveGateInfo(moduleRegistry, gateConfig.gate);
        bytes32 actualCodehash = gateConfig.gate.codehash;
        if (actualCodehash != gateConfig.gateCodehash || actualCodehash != info.codehash) {
            revert IStreamMintManager.MintGateCodehashChanged(
                gateConfig.gate, gateConfig.gateCodehash, actualCodehash
            );
        }
        if (
            info.metadataHash != gateConfig.gateMetadataHash
                || info.semanticVersion != gateConfig.gateSemanticVersion
                || info.gasLimit != gateConfig.gateGasLimit
        ) {
            revert IStreamMintManager.MintGateNotActive(gateConfig.gate);
        }
    }

    function _requireActiveGateInfo(IStreamMintModuleRegistry moduleRegistry, address gate)
        private
        view
        returns (IStreamMintModuleRegistry.MintModuleInfo memory info)
    {
        try moduleRegistry.moduleInfo(gate) returns (
            IStreamMintModuleRegistry.MintModuleInfo memory moduleInfo
        ) {
            info = moduleInfo;
        } catch {
            revert IStreamMintManager.MintGateNotActive(gate);
        }
        if (
            info.status != IStreamMintModuleRegistry.ModuleStatus.ACTIVE
                || info.interfaceId != type(IStreamMintGate).interfaceId || info.gasLimit == 0
                || gate.code.length == 0 || info.codehash != gate.codehash
                || !_gateAdvertisesInterface(gate)
        ) {
            revert IStreamMintManager.MintGateNotActive(gate);
        }
    }

    function _gateAdvertisesInterface(address gate) private view returns (bool) {
        try IERC165(gate).supportsInterface{ gas: GATE_ERC165_PROBE_GAS }(
            type(IStreamMintGate).interfaceId
        ) returns (
            bool supported
        ) {
            return supported;
        } catch {
            return false;
        }
    }
}
