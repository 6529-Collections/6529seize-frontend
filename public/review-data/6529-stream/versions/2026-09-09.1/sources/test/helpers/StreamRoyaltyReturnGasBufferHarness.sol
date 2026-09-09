// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../../smart-contracts/vendor/openzeppelin/Base64.sol";
import "../../smart-contracts/interfaces/stream/IStreamGasParameterHost.sol";
import "../../smart-contracts/vendor/openzeppelin/Math.sol";
import "../../smart-contracts/core/StreamCoreReadBuffer.sol";
import "../../smart-contracts/domains/parameters/StreamGasParameterHost.sol";
import "../../smart-contracts/vendor/openzeppelin/Strings.sol";

/// @dev Target fixture for issue #671. It models the three future Core consumers without
///      changing transitional StreamCore bytecode. Issue #654 owns final Core integration.
contract StreamRoyaltyReturnGasBufferHarness is StreamGasParameterHost {
    using Strings for uint256;

    uint256 public constant MAX_METADATA_RETURNDATA = 65_536;
    uint256 public constant ROYALTY_RETURNDATA = 64;
    uint256 public constant MAX_ROYALTY_BPS = 10_000;

    // Updated only from the checked six-scenario completion snapshot.
    uint256 public constant SHARED_BUFFER_FLOOR = 1_460_000;
    uint256 public constant SHARED_BUFFER_GENESIS = 2_910_000;
    uint256 public constant ROYALTY_LIMIT_GENESIS = 50_000;
    uint256 public constant METADATA_LIMIT_GENESIS = 500_000;

    bytes32 public constant ROYALTY_RESOLVER_GAS_LIMIT =
        keccak256("6529STREAM_GGP_ROYALTY_RESOLVER_GAS_LIMIT");
    bytes32 public constant ROYALTY_RETURN_GAS_BUFFER =
        keccak256("6529STREAM_GGP_ROYALTY_RETURN_GAS_BUFFER");
    bytes32 public constant METADATA_ROUTER_GAS_LIMIT =
        keccak256("6529STREAM_GGP_METADATA_ROUTER_GAS_LIMIT");

    bytes4 private constant _ROYALTY_SELECTOR = bytes4(keccak256("royaltyReceiverAndBps()"));
    bytes4 private constant _TOKEN_URI_SELECTOR = bytes4(keccak256("tokenURIForCore()"));
    bytes4 private constant _CONTRACT_URI_SELECTOR = bytes4(keccak256("contractURIForCore()"));

    constructor(address authority) StreamGasParameterHost(authority) {
        _registerGasParameter(
            GasParameterConfig({
                name: "ROYALTY_RESOLVER_GAS_LIMIT",
                genesisValue: ROYALTY_LIMIT_GENESIS,
                floor: ROYALTY_LIMIT_GENESIS / 2,
                failureClass: FAILURE_CLASS_FORWARDING_CAP
            })
        );
        _registerGasParameter(
            GasParameterConfig({
                name: "ROYALTY_RETURN_GAS_BUFFER",
                genesisValue: SHARED_BUFFER_GENESIS,
                floor: SHARED_BUFFER_FLOOR,
                failureClass: FAILURE_CLASS_FORWARDING_CAP
            })
        );
        _registerGasParameter(
            GasParameterConfig({
                name: "METADATA_ROUTER_GAS_LIMIT",
                genesisValue: METADATA_LIMIT_GENESIS,
                floor: METADATA_LIMIT_GENESIS / 2,
                failureClass: FAILURE_CLASS_FORWARDING_CAP
            })
        );
    }

    function parentGasSufficient(uint256 availableGas, uint256 gasLimit, uint256 sharedBuffer)
        external
        pure
        returns (bool)
    {
        return StreamCoreReadBuffer.hasSufficientParentGas(availableGas, gasLimit, sharedBuffer);
    }

    function royaltyInfo(address resolver, uint256 salePrice)
        external
        view
        returns (address receiver, uint256 amount)
    {
        uint256 sharedBuffer = _gasParameterValue(ROYALTY_RETURN_GAS_BUFFER);
        uint256 gasLimit = _gasParameterValue(ROYALTY_RESOLVER_GAS_LIMIT);
        (uint8 status, bytes memory returnData) = _boundedStaticRead(
            resolver,
            abi.encodeWithSelector(_ROYALTY_SELECTOR),
            gasLimit,
            sharedBuffer,
            ROYALTY_RETURNDATA
        );
        if (status != StreamCoreReadBuffer.READ_OK) return (address(0), 0);
        return completeRoyalty(returnData, salePrice);
    }

    function tokenURI(address router, uint256 tokenId) external view returns (string memory) {
        uint256 sharedBuffer = _gasParameterValue(ROYALTY_RETURN_GAS_BUFFER);
        uint256 gasLimit = _gasParameterValue(METADATA_ROUTER_GAS_LIMIT);
        (uint8 status, bytes memory returnData) = _boundedStaticRead(
            router,
            abi.encodeWithSelector(_TOKEN_URI_SELECTOR),
            gasLimit,
            sharedBuffer,
            MAX_METADATA_RETURNDATA
        );
        if (status == StreamCoreReadBuffer.READ_OK) {
            (status, returnData) = _decodeAsBytes(returnData);
            if (status == StreamCoreReadBuffer.READ_OK) return string(returnData);
        }
        return _fallbackTokenURI(tokenId, status);
    }

    function contractURI(address router) external view returns (string memory) {
        uint256 sharedBuffer = _gasParameterValue(ROYALTY_RETURN_GAS_BUFFER);
        uint256 gasLimit = _gasParameterValue(METADATA_ROUTER_GAS_LIMIT);
        (uint8 status, bytes memory returnData) = _boundedStaticRead(
            router,
            abi.encodeWithSelector(_CONTRACT_URI_SELECTOR),
            gasLimit,
            sharedBuffer,
            MAX_METADATA_RETURNDATA
        );
        if (status == StreamCoreReadBuffer.READ_OK) {
            (status, returnData) = _decodeAsBytes(returnData);
            if (status == StreamCoreReadBuffer.READ_OK) return string(returnData);
        }
        return _fallbackContractURI(status);
    }

    function completeRoyalty(bytes memory returnData, uint256 salePrice)
        public
        pure
        returns (address receiver, uint256 amount)
    {
        if (returnData.length != ROYALTY_RETURNDATA) return (address(0), 0);
        uint256 receiverWord;
        uint256 bpsWord;
        assembly ("memory-safe") {
            receiverWord := mload(add(returnData, 0x20))
            bpsWord := mload(add(returnData, 0x40))
        }
        if (
            receiverWord >> 160 != 0 || receiverWord == 0 || bpsWord == 0
                || bpsWord > MAX_ROYALTY_BPS
        ) {
            return (address(0), 0);
        }
        receiver = address(uint160(receiverWord));
        amount = Math.mulDiv(salePrice, bpsWord, MAX_ROYALTY_BPS);
    }

    function completeTokenURI(bytes memory returnData, uint256 tokenId)
        external
        pure
        returns (string memory)
    {
        (uint8 status, bytes memory value) = _decodeAsBytes(returnData);
        return
            status == StreamCoreReadBuffer.READ_OK
                ? string(value)
                : _fallbackTokenURI(tokenId, status);
    }

    function completeContractURI(bytes memory returnData) external pure returns (string memory) {
        (uint8 status, bytes memory value) = _decodeAsBytes(returnData);
        return status == StreamCoreReadBuffer.READ_OK ? string(value) : _fallbackContractURI(status);
    }

    function _boundedStaticRead(
        address target,
        bytes memory callData,
        uint256 gasLimit,
        uint256 completionBuffer,
        uint256 maxReturnBytes
    ) private view returns (uint8 status, bytes memory returnData) {
        if (!StreamCoreReadBuffer.hasSufficientParentGas(gasleft(), gasLimit, completionBuffer)) {
            return (StreamCoreReadBuffer.READ_CALL_FAILED, new bytes(0));
        }

        bool success;
        bool oversized;
        assembly ("memory-safe") {
            success := staticcall(
                gasLimit,
                target,
                add(callData, 0x20),
                mload(callData),
                0x00,
                0x00
            )
            let returnSize := returndatasize()
            oversized := gt(returnSize, maxReturnBytes)
            switch or(iszero(success), oversized)
            case 1 {
                returnData := mload(0x40)
                mstore(returnData, 0)
                mstore(0x40, add(returnData, 0x20))
            }
            default {
                returnData := mload(0x40)
                mstore(returnData, returnSize)
                returndatacopy(add(returnData, 0x20), 0x00, returnSize)
                mstore(0x40, and(add(add(returnData, 0x20), add(returnSize, 0x1f)), not(0x1f)))
            }
        }
        if (oversized) {
            return (StreamCoreReadBuffer.READ_RETURNDATA_OVERSIZED, returnData);
        }
        if (!success) return (StreamCoreReadBuffer.READ_CALL_FAILED, returnData);
        return (StreamCoreReadBuffer.READ_OK, returnData);
    }

    function _decodeAsBytes(bytes memory returnData)
        private
        pure
        returns (uint8 status, bytes memory value)
    {
        string memory decoded;
        (status, decoded) = StreamCoreReadBuffer.decodeRequiredString(returnData);
        return (status, bytes(decoded));
    }

    function _fallbackTokenURI(uint256 tokenId, uint8 status) private pure returns (string memory) {
        bytes memory json = abi.encodePacked(
            '{"name":"6529 Stream #',
            tokenId.toString(),
            '","description":"Stream metadata is temporarily unavailable.",',
            '"image":"","properties":{"stream":{"error":"',
            _routerError(status),
            '"}}}'
        );
        return string(abi.encodePacked("data:application/json;base64,", Base64.encode(json)));
    }

    function _fallbackContractURI(uint8 status) private pure returns (string memory) {
        bytes memory json = abi.encodePacked(
            '{"name":"6529 Stream","description":"Stream contract metadata is temporarily unavailable.",',
            '"image":"","properties":{"stream":{"error":"',
            _routerError(status),
            '"}}}'
        );
        return string(abi.encodePacked("data:application/json;base64,", Base64.encode(json)));
    }

    function _routerError(uint8 status) private pure returns (string memory) {
        if (status == StreamCoreReadBuffer.READ_RETURNDATA_OVERSIZED) {
            return "ROUTER_RETURNDATA_OVERSIZED";
        }
        if (status == StreamCoreReadBuffer.READ_RETURNDATA_MALFORMED) {
            return "ROUTER_MALFORMED";
        }
        return "ROUTER_REVERTED";
    }
}

contract StreamRoyaltyReturnGasTarget {
    function royaltyReceiverAndBps() external view returns (address receiver, uint256 bps) {
        uint256 entryGas = gasleft();
        while (gasleft() > 5_000) { }
        receiver = address(uint160(entryGas));
        bps = 1;
    }
}

contract StreamMaximumMetadataReturnTarget {
    uint256 private constant _RETURN_SIZE = 65_536;

    fallback() external {
        assembly ("memory-safe") {
            let entryGas := gas()
            let pointer := mload(0x40)
            mstore(pointer, 0x20)
            mstore(add(pointer, 0x20), 65472)
            mstore(add(pointer, sub(_RETURN_SIZE, 0x20)), entryGas)
            return(pointer, _RETURN_SIZE)
        }
    }
}

contract StreamOversizedMetadataReturnTarget {
    fallback() external {
        assembly ("memory-safe") {
            let pointer := mload(0x40)
            return(pointer, 65568)
        }
    }
}

contract StreamMalformedMetadataReturnTarget {
    fallback() external {
        assembly ("memory-safe") {
            let pointer := mload(0x40)
            mstore(pointer, 0x40)
            mstore(add(pointer, 0x20), 1)
            mstore(add(pointer, 0x40), 1)
            return(pointer, 96)
        }
    }
}

contract StreamRevertingReadTarget {
    fallback() external {
        revert();
    }
}
