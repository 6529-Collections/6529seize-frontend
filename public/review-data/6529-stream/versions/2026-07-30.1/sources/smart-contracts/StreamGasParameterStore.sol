// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./StreamGasParameterHost.sol";

/// @notice Standalone deployable launch-v1 Governed Gas Parameter store.
/// @dev The parameter set is fixed in the constructor. Values are storage-backed
///      and may only increase through delayed, bounded Governance-V2 actions.
contract StreamGasParameterStore is StreamGasParameterHost {
    /// @param authority Canonical Governance-V2 executor, or zero for an
    ///        immutable-after-deployment store.
    /// @param configs The full parameter inventory hosted by this store.
    constructor(address authority, GasParameterConfig[] memory configs)
        StreamGasParameterHost(authority)
    {
        uint256 count = configs.length;
        for (uint256 i = 0; i < count;) {
            _registerGasParameter(configs[i]);
            unchecked {
                ++i;
            }
        }
    }
}
