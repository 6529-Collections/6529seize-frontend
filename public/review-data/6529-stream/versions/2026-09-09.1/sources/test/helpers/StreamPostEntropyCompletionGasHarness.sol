// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../../smart-contracts/vendor/openzeppelin/ERC721.sol";
import "../../smart-contracts/vendor/openzeppelin/IERC721Receiver.sol";

interface IStreamPostEntropyMintCoordinator {
    function onTokenMinted(uint256 collectionId, uint256 tokenId, bytes32 mintCommitment)
        external
        returns (uint256 entryGas, uint256 remainingGas);
}

/// @dev Test-only target fixture for issue #672. This contract deliberately does not alter
///      StreamCore. It isolates the planned post-coordinator EOA completion tail so the real
///      entropy cutover can consume a checksum-bound, production-profile measurement in #654.
contract StreamPostEntropyCompletionGasHarness is ERC721 {
    error EntropyRegistrationFailed();
    error InsufficientParentGas(uint256 available, uint256 required);
    error InvalidGasModel();
    error MintAlreadyPrepared();
    error MintNotPrepared();

    uint256 public constant POST_ENTROPY_PARENT_RESERVE = 162_000;

    struct PreparedMint {
        bool exists;
        uint256 collectionId;
        address coordinator;
    }

    mapping(uint256 => PreparedMint) private _preparedMints;
    mapping(uint256 => uint256) public tokenIdentityCollection;
    mapping(uint256 => address) public coordinatorAtMint;
    mapping(uint256 => uint256) public collectionLiveSupply;
    uint256 public liveTokenSupply;

    mapping(uint256 => bytes32) public tokenFreezeMetadataRecordHashes;
    mapping(uint256 => uint256) public collectionLiveTokenMetadataAccumulators;
    mapping(uint256 => uint256) public collectionPendingMetadataCounts;

    constructor() ERC721("Post Entropy Completion Fixture", "PECF") { }

    /// @dev Planning lower bound for the EIP-150 forwarding and EOA-tail terms only. It excludes
    ///      ABI encoding, memory expansion, CALL costs, and source work before the CALL opcode.
    function planningParentGasLowerBound(uint256 registrationGasLimit)
        public
        pure
        returns (uint256 required)
    {
        if (registrationGasLimit == 0) {
            revert InvalidGasModel();
        }
        uint256 quotient = registrationGasLimit / 63;
        uint256 remainder = registrationGasLimit % 63;
        uint256 eip150Retained = quotient + (remainder == 0 ? 0 : 1);
        if (
            registrationGasLimit > type(uint256).max - eip150Retained
                || registrationGasLimit + eip150Retained
                    > type(uint256).max - POST_ENTROPY_PARENT_RESERVE
        ) {
            revert InvalidGasModel();
        }
        required = registrationGasLimit + eip150Retained + POST_ENTROPY_PARENT_RESERVE;
    }

    function satisfiesPlanningParentGasLowerBound(
        uint256 availableGas,
        uint256 registrationGasLimit
    )
        external
        pure
        returns (bool)
    {
        return availableGas >= planningParentGasLowerBound(registrationGasLimit);
    }

    function completeMint(
        uint256 collectionId,
        uint256 tokenId,
        address initialRecipient,
        address coordinator,
        bytes32 mintCommitment,
        uint256 registrationGasLimit
    )
        external
        returns (
            uint256 postCoordinatorTailGas,
            uint256 coordinatorEntryGas,
            uint256 coordinatorRemainingGas
        )
    {
        _prepareIdentity(collectionId, tokenId, coordinator);
        uint256 availableGas = gasleft();
        // This target-fixture guard exercises only the planning lower bound. Issue #654 must
        // measure and enforce the complete candidate-instance boundary at the actual CALL.
        uint256 requiredGas = planningParentGasLowerBound(registrationGasLimit);
        if (availableGas < requiredGas) {
            revert InsufficientParentGas(availableGas, requiredGas);
        }
        (coordinatorEntryGas, coordinatorRemainingGas) = _registerEntropy(
            collectionId, tokenId, coordinator, mintCommitment, registrationGasLimit
        );
        postCoordinatorTailGas =
            _completePostCoordinatorTail(collectionId, tokenId, initialRecipient);
    }

    /// @dev Splits the target path only for deterministic tail measurement. Behavioral tests use
    ///      completeMint so identity, registration, completion, and rollback remain atomic.
    function preparePostCoordinatorMeasurement(
        uint256 collectionId,
        uint256 tokenId,
        address coordinator,
        bytes32 mintCommitment,
        uint256 registrationGasLimit
    ) external {
        _prepareIdentity(collectionId, tokenId, coordinator);
        _registerEntropy(collectionId, tokenId, coordinator, mintCommitment, registrationGasLimit);
    }

    function completePostCoordinatorMeasurement(
        uint256 collectionId,
        uint256 tokenId,
        address initialRecipient
    ) external returns (uint256 postCoordinatorTailGas) {
        postCoordinatorTailGas = _completePostCoordinatorTail(
            collectionId, tokenId, initialRecipient
        );
    }

    function preparedMint(uint256 tokenId) external view returns (PreparedMint memory) {
        return _preparedMints[tokenId];
    }

    function exists(uint256 tokenId) external view returns (bool) {
        return _exists(tokenId);
    }

    function _prepareIdentity(uint256 collectionId, uint256 tokenId, address coordinator) private {
        if (_preparedMints[tokenId].exists || tokenIdentityCollection[tokenId] != 0) {
            revert MintAlreadyPrepared();
        }
        tokenIdentityCollection[tokenId] = collectionId;
        coordinatorAtMint[tokenId] = coordinator;
        _preparedMints[tokenId] =
            PreparedMint({ exists: true, collectionId: collectionId, coordinator: coordinator });
    }

    function _registerEntropy(
        uint256 collectionId,
        uint256 tokenId,
        address coordinator,
        bytes32 mintCommitment,
        uint256 registrationGasLimit
    ) private returns (uint256 entryGas, uint256 remainingGas) {
        (bool success, bytes memory returndata) = coordinator.call{ gas: registrationGasLimit }(
            abi.encodeCall(
                IStreamPostEntropyMintCoordinator.onTokenMinted,
                (collectionId, tokenId, mintCommitment)
            )
        );
        if (!success || returndata.length != 64) {
            revert EntropyRegistrationFailed();
        }
        (entryGas, remainingGas) = abi.decode(returndata, (uint256, uint256));
    }

    function _completePostCoordinatorTail(
        uint256 collectionId,
        uint256 tokenId,
        address initialRecipient
    ) private returns (uint256 postCoordinatorTailGas) {
        PreparedMint storage prepared = _preparedMints[tokenId];
        if (
            !prepared.exists || prepared.collectionId != collectionId
                || prepared.coordinator != coordinatorAtMint[tokenId]
        ) {
            revert MintNotPrepared();
        }

        uint256 gasBeforeTail = gasleft();
        delete _preparedMints[tokenId];

        bytes32 metadataRecordHash =
            keccak256(abi.encode(collectionId, tokenId, coordinatorAtMint[tokenId]));
        tokenFreezeMetadataRecordHashes[tokenId] = metadataRecordHash;
        collectionLiveTokenMetadataAccumulators[collectionId] ^= uint256(metadataRecordHash);
        unchecked {
            collectionPendingMetadataCounts[collectionId] += 1;
            collectionLiveSupply[collectionId] += 1;
            liveTokenSupply += 1;
        }
        _safeMint(initialRecipient, tokenId);
        postCoordinatorTailGas = gasBeforeTail - gasleft();
    }
}

contract StreamFullStipendEntropyCoordinator is IStreamPostEntropyMintCoordinator {
    function onTokenMinted(uint256, uint256, bytes32)
        external
        view
        returns (uint256 entryGas, uint256 remainingGas)
    {
        entryGas = gasleft();
        while (gasleft() > 5_000) { }
        remainingGas = gasleft();
    }
}

contract StreamNoopEntropyCoordinator is IStreamPostEntropyMintCoordinator {
    function onTokenMinted(uint256, uint256, bytes32)
        external
        view
        returns (uint256 entryGas, uint256 remainingGas)
    {
        entryGas = gasleft();
        remainingGas = gasleft();
    }
}

contract StreamRevertingEntropyCoordinator is IStreamPostEntropyMintCoordinator {
    function onTokenMinted(uint256, uint256, bytes32) external pure returns (uint256, uint256) {
        revert();
    }
}

contract StreamGasBurningERC721Receiver is IERC721Receiver {
    uint256 private immutable _gasToBurn;

    constructor(uint256 gasToBurn) {
        _gasToBurn = gasToBurn;
    }

    function onERC721Received(address, address, uint256, bytes calldata)
        external
        view
        returns (bytes4)
    {
        uint256 startGas = gasleft();
        while (startGas - gasleft() < _gasToBurn) { }
        return IERC721Receiver.onERC721Received.selector;
    }
}

contract StreamRevertingERC721Receiver is IERC721Receiver {
    function onERC721Received(address, address, uint256, bytes calldata)
        external
        pure
        returns (bytes4)
    {
        revert();
    }
}
