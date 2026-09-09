// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../../interfaces/stream/IStreamCore.sol";
import "../../interfaces/stream/IStreamMintManager.sol";

/// @notice Core token execution and token-level event emission for StreamMintManager.
/// @dev Library calls execute by delegatecall, so events retain the manager as their emitter.
library StreamMintCoreExecutor {
    event MintTokenExecuted(
        uint16 schemaVersion,
        bytes32 indexed operationId,
        uint256 indexed tokenId,
        bytes32 indexed operationRoot,
        uint256 collectionId,
        bytes32 phaseId,
        uint256 tokenIndex,
        address initialRecipient,
        address beneficiary,
        bytes32 tokenDataHash,
        bytes32 mintCommitment
    );
    event PreparedMintStarted(
        uint16 schemaVersion,
        bytes32 indexed operationId,
        uint256 indexed tokenId,
        uint256 indexed collectionId,
        bytes32 operationRoot,
        uint256 collectionSerial,
        address beneficiary,
        bytes32 tokenDataHash,
        bytes32 mintCommitment
    );
    event PreparedMintCompleted(
        uint16 schemaVersion,
        bytes32 indexed operationId,
        uint256 indexed tokenId,
        uint256 indexed collectionId,
        bytes32 operationRoot,
        address initialRecipient
    );

    struct TokenExecutionFact {
        bytes32 operationId;
        uint256 tokenId;
        bytes32 operationRoot;
        uint256 collectionId;
        bytes32 phaseId;
        uint256 tokenIndex;
        address initialRecipient;
        address beneficiary;
        bytes32 tokenDataHash;
        bytes32 mintCommitment;
        uint256 collectionSerial;
    }

    function executeSingleStep(
        IStreamCore core,
        IStreamMintManager.MintBatch calldata batch,
        uint256 tokenIndex,
        bytes32 operationRoot,
        bytes32 operationId,
        uint16 schemaVersion
    ) external returns (uint256 tokenId) {
        bytes32 tokenDataHash = keccak256(batch.tokenData[tokenIndex]);
        // Single-step identity is emitted by Core's TokenIdentityAllocated event.
        // slither-disable-next-line unused-return
        (tokenId,) = core.mintFromManager(
            batch.collectionId,
            batch.initialRecipients[tokenIndex],
            batch.tokenData[tokenIndex],
            tokenDataHash,
            batch.mintCommitments[tokenIndex]
        );
        TokenExecutionFact memory fact = _tokenExecutionFact(
            batch, tokenIndex, operationRoot, operationId, tokenId, tokenDataHash
        );
        emit MintTokenExecuted(
            schemaVersion,
            fact.operationId,
            fact.tokenId,
            fact.operationRoot,
            fact.collectionId,
            fact.phaseId,
            fact.tokenIndex,
            fact.initialRecipient,
            fact.beneficiary,
            fact.tokenDataHash,
            fact.mintCommitment
        );
    }

    function executePrepared(
        IStreamCore core,
        IStreamMintManager.MintBatch calldata batch,
        uint256 tokenIndex,
        bytes32 operationRoot,
        bytes32 operationId,
        uint16 schemaVersion
    ) external returns (uint256 tokenId) {
        bytes32 tokenDataHash = keccak256(batch.tokenData[tokenIndex]);
        uint256 collectionSerial;
        (tokenId, collectionSerial) = core.prepareMintFromManager(
            batch.collectionId, batch.tokenData[tokenIndex], tokenDataHash, operationId
        );
        TokenExecutionFact memory fact = _tokenExecutionFact(
            batch, tokenIndex, operationRoot, operationId, tokenId, tokenDataHash
        );
        fact.collectionSerial = collectionSerial;
        emit PreparedMintStarted(
            schemaVersion,
            fact.operationId,
            fact.tokenId,
            fact.collectionId,
            fact.operationRoot,
            fact.collectionSerial,
            fact.beneficiary,
            fact.tokenDataHash,
            fact.mintCommitment
        );
        core.completePreparedMintFromManager(
            tokenId, fact.initialRecipient, operationId, fact.mintCommitment
        );
        emit PreparedMintCompleted(
            schemaVersion,
            fact.operationId,
            fact.tokenId,
            fact.collectionId,
            fact.operationRoot,
            fact.initialRecipient
        );
    }

    function _tokenExecutionFact(
        IStreamMintManager.MintBatch calldata batch,
        uint256 tokenIndex,
        bytes32 operationRoot,
        bytes32 operationId,
        uint256 tokenId,
        bytes32 tokenDataHash
    ) private pure returns (TokenExecutionFact memory fact) {
        fact.operationId = operationId;
        fact.tokenId = tokenId;
        fact.operationRoot = operationRoot;
        fact.collectionId = batch.collectionId;
        fact.phaseId = batch.phaseId;
        fact.tokenIndex = tokenIndex;
        fact.initialRecipient = batch.initialRecipients[tokenIndex];
        fact.beneficiary = batch.beneficiaries[tokenIndex];
        fact.tokenDataHash = tokenDataHash;
        fact.mintCommitment = batch.mintCommitments[tokenIndex];
    }
}
