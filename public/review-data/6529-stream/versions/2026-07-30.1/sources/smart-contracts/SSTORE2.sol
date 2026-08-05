// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @notice Minimal SSTORE2-style bytecode storage: writes bytes as the runtime
///         code of a data contract and reads them back with `extcodecopy`.
/// @dev Stored payloads are prefixed with a `STOP` byte so the data contract
///     can never be executed. Used for the onchain scheduled-calldata preimage
///     publication required by ADR 0004 [GOV-BATCH] rule 5 (ADR 0013
///     decision U5) and the onchain-bytes payload class of
///     `docs/stream-long-term-architecture.md` [LTA-CATALOGS] rule 6.
library SSTORE2 {
    /// @notice Offset that skips the `STOP` guard byte at the head of the data contract.
    uint256 internal constant DATA_OFFSET = 1;
    /// @notice Maximum payload whose STOP-prefixed runtime fits EIP-170.
    uint256 internal constant MAX_DATA_LENGTH = 24_575;

    /// @notice Reverts when the data-contract deployment fails.
    error SSTORE2WriteFailed();
    /// @notice Reverts when a pointer does not hold a readable payload.
    error SSTORE2InvalidPointer(address pointer);
    /// @notice Reverts when STOP plus payload would exceed EIP-170.
    error SSTORE2DataTooLarge(uint256 length);

    /// @notice Deploys `data` as the runtime code of a new data contract.
    /// @param data Payload bytes to persist.
    /// @return pointer Address of the deployed data contract.
    function write(bytes memory data) internal returns (address pointer) {
        if (data.length > MAX_DATA_LENGTH) {
            revert SSTORE2DataTooLarge(data.length);
        }
        // Creation preamble: copies everything after the 11-byte preamble to
        // memory and returns it as runtime code.
        //   0x600B  PUSH1 0x0B   (preamble length)
        //   0x59    MSIZE        (0)
        //   0x81    DUP2
        //   0x38    CODESIZE
        //   0x03    SUB          (runtime length)
        //   0x80    DUP1
        //   0x92    SWAP3
        //   0x59    MSIZE        (0)
        //   0x39    CODECOPY
        //   0xF3    RETURN
        bytes memory creationCode = abi.encodePacked(hex"600B5981380380925939F3", hex"00", data);
        assembly ("memory-safe") {
            pointer := create(0, add(creationCode, 0x20), mload(creationCode))
        }
        if (pointer == address(0)) {
            revert SSTORE2WriteFailed();
        }
    }

    /// @notice Reads the full payload stored at `pointer`.
    /// @param pointer Address of a data contract created by {write}.
    /// @return data The stored payload bytes.
    function read(address pointer) internal view returns (bytes memory data) {
        uint256 codeSize = pointer.code.length;
        if (codeSize < DATA_OFFSET) {
            revert SSTORE2InvalidPointer(pointer);
        }
        bytes1 prefix;
        assembly ("memory-safe") {
            extcodecopy(pointer, 0x00, 0x00, 0x01)
            prefix := mload(0x00)
        }
        if (prefix != bytes1(0)) {
            revert SSTORE2InvalidPointer(pointer);
        }
        uint256 size;
        unchecked {
            size = codeSize - DATA_OFFSET;
        }
        data = new bytes(size);
        assembly ("memory-safe") {
            extcodecopy(pointer, add(data, 0x20), DATA_OFFSET, size)
        }
    }
}
