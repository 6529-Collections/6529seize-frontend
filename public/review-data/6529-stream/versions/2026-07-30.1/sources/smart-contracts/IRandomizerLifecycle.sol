// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

interface IRandomizerLifecycle {
    enum RandomnessRequestState {
        None,
        Pending,
        Fulfilled,
        Stale,
        FailedPostProcessing
    }

    struct RandomnessRequest {
        uint256 collectionId;
        uint256 tokenId;
        address provider;
        uint256 providerRequestId;
        uint256 randomizerEpoch;
        RandomnessRequestState state;
        uint256 requestedBlock;
        uint256 requestedTimestamp;
        uint256 fulfilledBlock;
        uint256 fulfilledTimestamp;
        bytes32 derivedSeed;
        bytes32 rawOutputHash;
        bytes32 failureDataHash;
        uint256 postProcessingRetryCount;
    }

    function supportsRandomizerLifecycle() external view returns (bool);

    function retrieveRandomnessRequest(uint256 _requestId)
        external
        view
        returns (RandomnessRequest memory);

    function retrieveRandomnessRequestForToken(uint256 tokenId)
        external
        view
        returns (RandomnessRequest memory);

    function randomnessRequestState(uint256 _requestId)
        external
        view
        returns (RandomnessRequestState);

    function randomnessRequestStateForToken(uint256 tokenId)
        external
        view
        returns (RandomnessRequestState);

    function requestToToken(uint256 requestId) external view returns (uint256);

    function tokenToRequest(uint256 tokenId) external view returns (uint256);

    function tokenIdToCollection(uint256 tokenId) external view returns (uint256);

    function pendingRandomnessRequests(uint256 collectionId) external view returns (uint256);

    function totalPendingRandomnessRequests() external view returns (uint256);
}
