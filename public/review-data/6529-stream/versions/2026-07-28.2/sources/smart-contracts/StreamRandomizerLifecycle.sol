// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import "./IStreamCore.sol";

abstract contract StreamRandomizerLifecycle {
    uint256 public constant MAX_RANDOMNESS_POST_PROCESSING_RETRIES = 3;
    bytes32 public constant RANDOMNESS_SEED_TYPEHASH = keccak256(
        "6529StreamRandomnessSeed(address provider,uint256 requestId,uint256 collectionId,uint256 tokenId,uint256 randomizerEpoch,bytes32 rawOutputHash)"
    );

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

    error UnknownRandomnessRequest(uint256 requestId);
    error RandomnessRequestAlreadyExists(uint256 requestId);
    error TokenRandomnessRequestAlreadyExists(uint256 tokenId, uint256 requestId);
    error RandomnessRequestNotPending(uint256 requestId, RandomnessRequestState state);
    error WrongRandomnessProvider(
        uint256 requestId, address expectedProvider, address actualProvider
    );
    error WrongRandomnessTokenCollection(
        uint256 requestId, uint256 tokenId, uint256 expectedCollectionId, uint256 actualCollectionId
    );
    error StaleRandomnessRequest(
        uint256 requestId,
        uint256 expectedEpoch,
        uint256 actualEpoch,
        address expectedProvider,
        address actualProvider
    );
    error EmptyRandomWords(uint256 requestId);
    error ZeroDerivedSeed(uint256 requestId);
    error RandomnessRequestNotFulfilled(uint256 requestId, RandomnessRequestState state);
    error RandomnessRequestNotFailedPostProcessing(uint256 requestId, RandomnessRequestState state);
    error RandomnessPostProcessingRetryLimitReached(
        uint256 requestId, uint256 retryCount, uint256 maxRetryCount
    );

    mapping(uint256 => RandomnessRequest) private randomnessRequests;
    mapping(uint256 => uint256) public requestToToken;
    mapping(uint256 => uint256) public tokenToRequest;
    mapping(uint256 => uint256) public tokenIdToCollection;
    mapping(uint256 => uint256) private pendingRandomnessRequestsByCollection;
    uint256 private pendingRandomnessRequestCount;

    event RandomnessRequested(
        uint256 indexed requestId,
        uint256 indexed collectionId,
        uint256 indexed tokenId,
        address provider,
        uint256 randomizerEpoch
    );
    event RandomnessFulfilled(
        uint256 indexed requestId,
        uint256 indexed collectionId,
        uint256 indexed tokenId,
        address provider,
        uint256 randomizerEpoch,
        bytes32 derivedSeed,
        bytes32 rawOutputHash
    );
    event RandomnessRequestMarkedStale(
        uint256 indexed requestId,
        uint256 indexed collectionId,
        uint256 indexed tokenId,
        address provider,
        uint256 randomizerEpoch
    );
    event RandomnessPostProcessingFailed(
        uint256 indexed requestId,
        uint256 indexed collectionId,
        uint256 indexed tokenId,
        address provider,
        uint256 randomizerEpoch,
        bytes32 derivedSeed,
        bytes32 rawOutputHash,
        bytes32 failureDataHash
    );
    event RandomnessPostProcessingRetried(
        uint256 indexed requestId,
        uint256 indexed collectionId,
        uint256 indexed tokenId,
        address provider,
        uint256 randomizerEpoch,
        uint256 retryCount,
        bytes32 derivedSeed,
        bytes32 rawOutputHash
    );
    event RandomnessPostProcessingRetryFailed(
        uint256 indexed requestId,
        uint256 indexed collectionId,
        uint256 indexed tokenId,
        address provider,
        uint256 randomizerEpoch,
        uint256 retryCount,
        bytes32 derivedSeed,
        bytes32 rawOutputHash,
        bytes32 failureDataHash
    );
    event BurnedTokenRandomnessRecorded(
        uint256 indexed requestId,
        uint256 indexed collectionId,
        uint256 indexed tokenId,
        address provider,
        uint256 randomizerEpoch,
        bytes32 derivedSeed,
        bytes32 rawOutputHash
    );

    function retrieveRandomnessRequest(uint256 _requestId)
        public
        view
        returns (RandomnessRequest memory)
    {
        return randomnessRequests[_requestId];
    }

    function randomnessRequestState(uint256 _requestId)
        public
        view
        returns (RandomnessRequestState)
    {
        return randomnessRequests[_requestId].state;
    }

    function retrieveRandomnessRequestForToken(uint256 tokenId)
        public
        view
        returns (RandomnessRequest memory)
    {
        return randomnessRequests[tokenToRequest[tokenId]];
    }

    function randomnessRequestStateForToken(uint256 tokenId)
        public
        view
        returns (RandomnessRequestState)
    {
        return randomnessRequests[tokenToRequest[tokenId]].state;
    }

    function supportsRandomizerLifecycle() external pure returns (bool) {
        return true;
    }

    function pendingRandomnessRequests(uint256 collectionId) public view returns (uint256) {
        return pendingRandomnessRequestsByCollection[collectionId];
    }

    function totalPendingRandomnessRequests() public view returns (uint256) {
        return pendingRandomnessRequestCount;
    }

    function _recordRandomnessRequest(
        uint256 _requestId,
        uint256 _collectionId,
        uint256 _tokenId,
        uint256 _randomizerEpoch
    ) internal {
        if (_requestId == 0) {
            revert UnknownRandomnessRequest(_requestId);
        }
        if (randomnessRequests[_requestId].state != RandomnessRequestState.None) {
            revert RandomnessRequestAlreadyExists(_requestId);
        }
        // Keep tokenToRequest after fulfillment or stale marking: a token may only
        // receive randomness once. Burn/remint redraw policy is tracked separately.
        if (tokenToRequest[_tokenId] != 0) {
            revert TokenRandomnessRequestAlreadyExists(_tokenId, tokenToRequest[_tokenId]);
        }

        requestToToken[_requestId] = _tokenId;
        tokenToRequest[_tokenId] = _requestId;
        tokenIdToCollection[_tokenId] = _collectionId;
        pendingRandomnessRequestsByCollection[_collectionId] =
            pendingRandomnessRequestsByCollection[_collectionId] + 1;
        pendingRandomnessRequestCount = pendingRandomnessRequestCount + 1;
        randomnessRequests[_requestId] = RandomnessRequest({
            collectionId: _collectionId,
            tokenId: _tokenId,
            provider: address(this),
            providerRequestId: _requestId,
            randomizerEpoch: _randomizerEpoch,
            state: RandomnessRequestState.Pending,
            requestedBlock: block.number,
            requestedTimestamp: block.timestamp,
            fulfilledBlock: 0,
            fulfilledTimestamp: 0,
            derivedSeed: bytes32(0),
            rawOutputHash: bytes32(0),
            failureDataHash: bytes32(0),
            postProcessingRetryCount: 0
        });

        emit RandomnessRequested(
            _requestId, _collectionId, _tokenId, address(this), _randomizerEpoch
        );
    }

    function _fulfillRandomnessRequest(
        IStreamCore _core,
        uint256 _requestId,
        uint256[] memory _randomWords
    ) internal returns (uint256 collectionId, uint256 tokenId, bytes32 derivedSeed) {
        RandomnessRequest storage request = randomnessRequests[_requestId];
        if (request.state == RandomnessRequestState.None) {
            revert UnknownRandomnessRequest(_requestId);
        }
        if (request.state != RandomnessRequestState.Pending) {
            revert RandomnessRequestNotPending(_requestId, request.state);
        }
        // Defense-in-depth for future shared-storage or adapter migration paths.
        if (request.provider != address(this)) {
            revert WrongRandomnessProvider(_requestId, request.provider, address(this));
        }
        if (_randomWords.length == 0) {
            revert EmptyRandomWords(_requestId);
        }

        collectionId = request.collectionId;
        tokenId = request.tokenId;
        uint256 tokenCollectionId = _core.viewColIDforTokenID(tokenId);
        if (tokenCollectionId != collectionId) {
            revert WrongRandomnessTokenCollection(
                _requestId, tokenId, collectionId, tokenCollectionId
            );
        }
        uint256 currentEpoch = _core.viewRandomizerEpoch(collectionId);
        address currentProvider = _core.viewCollectionRandomizerContract(collectionId);
        if (currentEpoch != request.randomizerEpoch || currentProvider != address(this)) {
            revert StaleRandomnessRequest(
                _requestId, request.randomizerEpoch, currentEpoch, address(this), currentProvider
            );
        }

        bytes32 rawOutputHash = _hashRawRandomWords(_randomWords);
        derivedSeed = _deriveRandomnessSeed(
            request.provider,
            _requestId,
            collectionId,
            tokenId,
            request.randomizerEpoch,
            rawOutputHash
        );
        // This should be unreachable for keccak256 output, but the explicit
        // guard preserves the no-zero-seed invariant if derivation changes.
        if (derivedSeed == bytes32(0)) {
            revert ZeroDerivedSeed(_requestId);
        }

        request.state = RandomnessRequestState.Fulfilled;
        _decrementPendingRandomnessRequest(collectionId);
        request.fulfilledBlock = block.number;
        request.fulfilledTimestamp = block.timestamp;
        request.derivedSeed = derivedSeed;
        request.rawOutputHash = rawOutputHash;
        request.failureDataHash = bytes32(0);
    }

    function _confirmRandomnessFulfillment(uint256 _requestId) internal {
        RandomnessRequest storage request = randomnessRequests[_requestId];
        if (request.state == RandomnessRequestState.None) {
            revert UnknownRandomnessRequest(_requestId);
        }
        if (request.state != RandomnessRequestState.Fulfilled) {
            revert RandomnessRequestNotFulfilled(_requestId, request.state);
        }

        emit RandomnessFulfilled(
            _requestId,
            request.collectionId,
            request.tokenId,
            request.provider,
            request.randomizerEpoch,
            request.derivedSeed,
            request.rawOutputHash
        );
    }

    function _confirmBurnedTokenRandomnessRecorded(uint256 _requestId) internal {
        RandomnessRequest storage request = randomnessRequests[_requestId];
        if (request.state == RandomnessRequestState.None) {
            revert UnknownRandomnessRequest(_requestId);
        }
        if (request.state != RandomnessRequestState.Fulfilled) {
            revert RandomnessRequestNotFulfilled(_requestId, request.state);
        }

        emit BurnedTokenRandomnessRecorded(
            _requestId,
            request.collectionId,
            request.tokenId,
            request.provider,
            request.randomizerEpoch,
            request.derivedSeed,
            request.rawOutputHash
        );
    }

    function _markRandomnessPostProcessingFailed(uint256 _requestId, bytes memory failureData)
        internal
        returns (bytes32 failureDataHash)
    {
        failureDataHash = _setRandomnessPostProcessingFailedState(_requestId, failureData);
        RandomnessRequest storage request = randomnessRequests[_requestId];

        emit RandomnessPostProcessingFailed(
            _requestId,
            request.collectionId,
            request.tokenId,
            request.provider,
            request.randomizerEpoch,
            request.derivedSeed,
            request.rawOutputHash,
            failureDataHash
        );
    }

    function _setRandomnessPostProcessingFailedState(uint256 _requestId, bytes memory failureData)
        private
        returns (bytes32 failureDataHash)
    {
        RandomnessRequest storage request = randomnessRequests[_requestId];
        if (request.state == RandomnessRequestState.None) {
            revert UnknownRandomnessRequest(_requestId);
        }
        if (request.state != RandomnessRequestState.Fulfilled) {
            revert RandomnessRequestNotFulfilled(_requestId, request.state);
        }

        failureDataHash = keccak256(failureData);
        request.state = RandomnessRequestState.FailedPostProcessing;
        request.failureDataHash = failureDataHash;
    }

    function _prepareRandomnessPostProcessingRetry(IStreamCore _core, uint256 _requestId)
        internal
        returns (uint256 collectionId, uint256 tokenId, bytes32 derivedSeed, uint256 retryCount)
    {
        RandomnessRequest storage request = randomnessRequests[_requestId];
        if (request.state == RandomnessRequestState.None) {
            revert UnknownRandomnessRequest(_requestId);
        }
        if (request.state != RandomnessRequestState.FailedPostProcessing) {
            revert RandomnessRequestNotFailedPostProcessing(_requestId, request.state);
        }
        if (request.postProcessingRetryCount >= MAX_RANDOMNESS_POST_PROCESSING_RETRIES) {
            revert RandomnessPostProcessingRetryLimitReached(
                _requestId, request.postProcessingRetryCount, MAX_RANDOMNESS_POST_PROCESSING_RETRIES
            );
        }
        if (request.provider != address(this)) {
            revert WrongRandomnessProvider(_requestId, request.provider, address(this));
        }

        collectionId = request.collectionId;
        tokenId = request.tokenId;
        uint256 tokenCollectionId = _core.viewColIDforTokenID(tokenId);
        if (tokenCollectionId != collectionId) {
            revert WrongRandomnessTokenCollection(
                _requestId, tokenId, collectionId, tokenCollectionId
            );
        }
        uint256 currentEpoch = _core.viewRandomizerEpoch(collectionId);
        address currentProvider = _core.viewCollectionRandomizerContract(collectionId);
        if (currentEpoch != request.randomizerEpoch || currentProvider != address(this)) {
            revert StaleRandomnessRequest(
                _requestId, request.randomizerEpoch, currentEpoch, address(this), currentProvider
            );
        }

        derivedSeed = request.derivedSeed;
        if (derivedSeed == bytes32(0)) {
            revert ZeroDerivedSeed(_requestId);
        }

        retryCount = request.postProcessingRetryCount + 1;
        request.postProcessingRetryCount = retryCount;
        request.state = RandomnessRequestState.Fulfilled;
        request.failureDataHash = bytes32(0);
    }

    function _confirmRandomnessPostProcessingRetry(uint256 _requestId, uint256 retryCount)
        internal
    {
        RandomnessRequest storage request = randomnessRequests[_requestId];
        if (request.state == RandomnessRequestState.None) {
            revert UnknownRandomnessRequest(_requestId);
        }
        if (request.state != RandomnessRequestState.Fulfilled) {
            revert RandomnessRequestNotFulfilled(_requestId, request.state);
        }

        request.fulfilledBlock = block.number;
        request.fulfilledTimestamp = block.timestamp;

        emit RandomnessPostProcessingRetried(
            _requestId,
            request.collectionId,
            request.tokenId,
            request.provider,
            request.randomizerEpoch,
            retryCount,
            request.derivedSeed,
            request.rawOutputHash
        );
        _confirmRandomnessFulfillment(_requestId);
    }

    function _markRandomnessPostProcessingRetryFailed(
        uint256 _requestId,
        bytes memory failureData,
        uint256 retryCount
    ) internal {
        bytes32 failureDataHash = _setRandomnessPostProcessingFailedState(_requestId, failureData);
        RandomnessRequest storage request = randomnessRequests[_requestId];
        emit RandomnessPostProcessingRetryFailed(
            _requestId,
            request.collectionId,
            request.tokenId,
            request.provider,
            request.randomizerEpoch,
            retryCount,
            request.derivedSeed,
            request.rawOutputHash,
            failureDataHash
        );
    }

    function _markRandomnessRequestStale(uint256 _requestId) internal {
        RandomnessRequest storage request = randomnessRequests[_requestId];
        if (request.state == RandomnessRequestState.None) {
            revert UnknownRandomnessRequest(_requestId);
        }
        if (request.state != RandomnessRequestState.Pending) {
            revert RandomnessRequestNotPending(_requestId, request.state);
        }

        request.state = RandomnessRequestState.Stale;
        _decrementPendingRandomnessRequest(request.collectionId);
        emit RandomnessRequestMarkedStale(
            _requestId,
            request.collectionId,
            request.tokenId,
            request.provider,
            request.randomizerEpoch
        );
    }

    function _decrementPendingRandomnessRequest(uint256 collectionId) private {
        pendingRandomnessRequestsByCollection[collectionId] =
            pendingRandomnessRequestsByCollection[collectionId] - 1;
        pendingRandomnessRequestCount = pendingRandomnessRequestCount - 1;
    }

    function _hashRawRandomWords(uint256[] memory _randomWords) private pure returns (bytes32) {
        return keccak256(abi.encode(_randomWords));
    }

    function _deriveRandomnessSeed(
        address provider,
        uint256 requestId,
        uint256 collectionId,
        uint256 tokenId,
        uint256 randomizerEpoch,
        bytes32 rawOutputHash
    ) private pure returns (bytes32) {
        return keccak256(
            abi.encode(
                RANDOMNESS_SEED_TYPEHASH,
                provider,
                requestId,
                collectionId,
                tokenId,
                randomizerEpoch,
                rawOutputHash
            )
        );
    }
}
