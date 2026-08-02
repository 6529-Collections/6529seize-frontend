// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../../smart-contracts/IStreamGovernedParameterAuthority.sol";

/// @notice Governance-V2 context stand-in with adversarial ABI modes.
contract MockGovernedParameterAuthority is IStreamGovernedParameterAuthority {
    enum MarkerResponseMode {
        Canonical,
        Reverting,
        Short,
        Oversized,
        NonCanonical,
        GasHeavy
    }

    enum ResponseMode {
        Canonical,
        Reverting,
        Short,
        Oversized,
        NonCanonicalExecuting,
        NonCanonicalActionClass,
        GasHeavy
    }

    bool private immutable _validMarker;
    bool private _executing;
    bytes32 private _actionId;
    uint8 private _actionClass;
    bytes32 private _scopeHash;
    bytes32 private _oldValueHash;
    bytes32 private _newValueHash;
    MarkerResponseMode private _markerResponseMode;
    ResponseMode private _responseMode;

    constructor(bool validMarker) {
        _validMarker = validMarker;
    }

    function isStreamGovernedParameterAuthority() external view override returns (bool) {
        MarkerResponseMode mode = _markerResponseMode;
        if (mode == MarkerResponseMode.Reverting) revert("marker unavailable");
        if (mode == MarkerResponseMode.GasHeavy) {
            uint256 start = gasleft();
            while (start - gasleft() < 1_000_000) { }
        }
        if (mode == MarkerResponseMode.Canonical || mode == MarkerResponseMode.GasHeavy) {
            return _validMarker;
        }

        uint256 length = mode == MarkerResponseMode.Short ? 31 : 32;
        if (mode == MarkerResponseMode.Oversized) length = 64;
        uint256 markerWord = mode == MarkerResponseMode.NonCanonical ? 2 : _validMarker ? 1 : 0;
        bytes memory response = new bytes(length);
        assembly ("memory-safe") {
            mstore(add(response, 32), markerWord)
            if eq(length, 64) { mstore(add(response, 64), 1) }
            return(add(response, 32), length)
        }
    }

    function setMarkerResponseMode(MarkerResponseMode responseMode) external {
        _markerResponseMode = responseMode;
    }

    function setCurrentAction(
        bool executing,
        bytes32 actionId,
        uint8 actionClass,
        bytes32 scopeHash,
        bytes32 oldValueHash,
        bytes32 newValueHash
    ) external {
        _executing = executing;
        _actionId = actionId;
        _actionClass = actionClass;
        _scopeHash = scopeHash;
        _oldValueHash = oldValueHash;
        _newValueHash = newValueHash;
    }

    function setResponseMode(ResponseMode responseMode) external {
        _responseMode = responseMode;
    }

    function currentAction()
        external
        view
        override
        returns (bool, bytes32, uint8, bytes32, bytes32, bytes32)
    {
        ResponseMode mode = _responseMode;
        if (mode == ResponseMode.Reverting) revert("context unavailable");
        if (mode == ResponseMode.GasHeavy) {
            uint256 start = gasleft();
            while (start - gasleft() < 1_000_000) { }
        }
        if (mode == ResponseMode.Canonical) {
            return (_executing, _actionId, _actionClass, _scopeHash, _oldValueHash, _newValueHash);
        }

        uint256 length = mode == ResponseMode.Short ? 160 : 192;
        if (mode == ResponseMode.Oversized) length = 224;
        uint256 executingWord = mode == ResponseMode.NonCanonicalExecuting ? 2 : _executing ? 1 : 0;
        uint256 actionClassWord =
            mode == ResponseMode.NonCanonicalActionClass ? 256 : uint256(_actionClass);
        bytes memory response = new bytes(length);
        bytes32 actionId = _actionId;
        bytes32 scopeHash = _scopeHash;
        bytes32 oldValueHash = _oldValueHash;
        bytes32 newValueHash = _newValueHash;
        assembly ("memory-safe") {
            mstore(add(response, 32), executingWord)
            mstore(add(response, 64), actionId)
            mstore(add(response, 96), actionClassWord)
            mstore(add(response, 128), scopeHash)
            mstore(add(response, 160), oldValueHash)
            if gt(length, 160) { mstore(add(response, 192), newValueHash) }
            if eq(length, 224) { mstore(add(response, 224), 1) }
            return(add(response, 32), length)
        }
    }
}

/// @notice Complete authority seam whose reads exercise repricing-sensitive work.
contract GasHeavyGovernedParameterAuthority is IStreamGovernedParameterAuthority {
    function isStreamGovernedParameterAuthority() external view override returns (bool) {
        uint256 start = gasleft();
        while (start - gasleft() < 1_000_000) { }
        return true;
    }

    function currentAction()
        external
        view
        override
        returns (bool, bytes32, uint8, bytes32, bytes32, bytes32)
    {
        uint256 start = gasleft();
        while (start - gasleft() < 1_000_000) { }
        return (false, bytes32(0), 0, bytes32(0), bytes32(0), bytes32(0));
    }
}
