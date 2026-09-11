// SPDX-License-Identifier: MIT

/**
 *
 *  @title Modified version of NextGen 6529 - Admin Contract to support 6529 Stream
 *  @custom:date 27-June-2024
 *  @custom:version 1.1
 *  @author 6529 team
 */

pragma solidity ^0.8.19;

import "./Ownable.sol";
import "./StreamPauseDomains.sol";

contract StreamAdmins is Ownable {
    bytes32 public constant PAUSE_DOMAIN_DROP_EXECUTION = StreamPauseDomains.DROP_EXECUTION;
    bytes32 public constant PAUSE_DOMAIN_MINT = StreamPauseDomains.MINT;
    bytes32 public constant PAUSE_DOMAIN_AUCTION_BID = StreamPauseDomains.AUCTION_BID;
    bytes32 public constant PAUSE_DOMAIN_AUCTION_SETTLEMENT = StreamPauseDomains.AUCTION_SETTLEMENT;
    bytes32 public constant PAUSE_DOMAIN_METADATA_MUTATION = StreamPauseDomains.METADATA_MUTATION;
    bytes32 public constant PAUSE_DOMAIN_RANDOMNESS_REQUEST = StreamPauseDomains.RANDOMNESS_REQUEST;
    bytes4 public constant DROP_SIGNER_UPDATE_SELECTOR =
        bytes4(keccak256("updateTDHsigner(address)"));
    bytes4 public constant DROP_SIGNER_EPOCH_SELECTOR = bytes4(keccak256("incrementSignerEpoch()"));
    bytes4 public constant DROP_CANCEL_SELECTOR = bytes4(keccak256("cancelDrop(bytes32)"));

    // sets global admins
    mapping(address => bool) public adminPermissions;

    // sets permission on a specific target contract function
    mapping(address => mapping(address => mapping(bytes4 => bool))) private functionAdmin;

    // sets emergency pause authorities
    mapping(address => bool) public pauseGuardians;
    mapping(address => bool) public unpauseAdmins;
    mapping(address => bool) public signerManagers;
    mapping(address => bool) public signerLifecycleTargets;
    mapping(bytes32 => bool) private pausedDomains;

    // other variables
    address public tdhSigner;
    address public emergencyRecipient;

    event GlobalAdminUpdated(address indexed account, bool enabled, address indexed admin);
    event FunctionAdminUpdated(
        address indexed account,
        address indexed target,
        bytes4 indexed selector,
        bool enabled,
        address admin
    );
    event PauseGuardianUpdated(address indexed account, bool enabled, address indexed admin);
    event UnpauseAdminUpdated(address indexed account, bool enabled, address indexed admin);
    event SignerManagerUpdated(address indexed account, bool enabled, address indexed admin);
    event SignerLifecycleTargetUpdated(address indexed target, bool enabled, address indexed admin);
    event PauseUpdated(
        bytes32 indexed domain, bool paused, address indexed admin, bytes32 indexed reason
    );
    event EmergencyRecipientUpdated(
        address indexed oldRecipient, address indexed newRecipient, address indexed admin
    );

    modifier signerManagerOrOwner() {
        require(msg.sender == owner() || signerManagers[msg.sender], "Not Allowed");
        _;
    }

    // constructor
    constructor(address _tdhSigner) {
        require(_tdhSigner != address(0), "Zero tdh signer");
        tdhSigner = _tdhSigner;
        emergencyRecipient = owner();
    }

    // function to register a global admin
    function registerAdmin(address _admin, bool _status) public onlyOwner {
        require(_admin != address(0), "Zero admin");
        adminPermissions[_admin] = _status;
        emit GlobalAdminUpdated(_admin, _status, msg.sender);
    }

    // function to register function admin
    function registerFunctionAdmin(
        address _address,
        address _target,
        bytes4 _selector,
        bool _status
    ) public onlyOwner {
        _setFunctionAdmin(_address, _target, _selector, _status);
    }

    // function to batch register functions admin
    function registerBatchFunctionAdmin(
        address _address,
        address _target,
        bytes4[] memory _selector,
        bool _status
    ) public onlyOwner {
        for (uint256 i = 0; i < _selector.length; i++) {
            _setFunctionAdmin(_address, _target, _selector[i], _status);
        }
    }

    function registerSignerManager(address _account, bool _status) public onlyOwner {
        require(_account != address(0), "Zero admin");
        signerManagers[_account] = _status;
        emit SignerManagerUpdated(_account, _status, msg.sender);
    }

    function registerSignerLifecycleTarget(address _target, bool _status) public onlyOwner {
        require(_target != address(0), "Zero target");
        signerLifecycleTargets[_target] = _status;
        emit SignerLifecycleTargetUpdated(_target, _status, msg.sender);
    }

    function registerSignerFunctionAdmin(
        address _address,
        address _target,
        bytes4 _selector,
        bool _status
    ) public signerManagerOrOwner {
        _setSignerFunctionAdmin(_address, _target, _selector, _status);
    }

    function registerBatchSignerFunctionAdmin(
        address _address,
        address _target,
        bytes4[] memory _selector,
        bool _status
    ) public signerManagerOrOwner {
        for (uint256 i = 0; i < _selector.length; i++) {
            _setSignerFunctionAdmin(_address, _target, _selector[i], _status);
        }
    }

    function registerPauseGuardian(address _account, bool _status) public onlyOwner {
        require(_account != address(0), "Zero admin");
        pauseGuardians[_account] = _status;
        emit PauseGuardianUpdated(_account, _status, msg.sender);
    }

    function registerUnpauseAdmin(address _account, bool _status) public onlyOwner {
        require(_account != address(0), "Zero admin");
        unpauseAdmins[_account] = _status;
        emit UnpauseAdminUpdated(_account, _status, msg.sender);
    }

    function setPaused(bytes32 _domain, bool _paused, bytes32 _reason) public {
        require(_domain != bytes32(0), "Zero domain");
        if (_paused) {
            require(_canPause(msg.sender), "Not allowed");
        } else {
            require(_canUnpause(msg.sender), "Not allowed");
        }
        pausedDomains[_domain] = _paused;
        emit PauseUpdated(_domain, _paused, msg.sender, _reason);
    }

    function updateEmergencyRecipient(address _recipient) public onlyOwner {
        require(_recipient != address(0), "Zero recipient");
        address oldRecipient = emergencyRecipient;
        emergencyRecipient = _recipient;
        emit EmergencyRecipientUpdated(oldRecipient, _recipient, msg.sender);
    }

    // function to retrieve global admin
    function retrieveGlobalAdmin(address _address) public view returns (bool) {
        return adminPermissions[_address];
    }

    // function to retrieve function admin
    function retrieveFunctionAdmin(address _address, address _target, bytes4 _selector)
        public
        view
        returns (bool)
    {
        return functionAdmin[_address][_target][_selector];
    }

    // collection-admin support is intentionally deferred for P0-ADMIN-001
    function retrieveCollectionAdmin(address, uint256) public pure returns (bool) {
        return false;
    }

    function isPaused(bytes32 _domain) public view returns (bool) {
        return pausedDomains[_domain];
    }

    // get admin contract status
    function isAdminContract() external pure returns (bool) {
        return true;
    }

    function _setFunctionAdmin(address _address, address _target, bytes4 _selector, bool _status)
        private
    {
        require(_address != address(0), "Zero admin");
        require(_target != address(0), "Zero target");
        require(_selector != bytes4(0), "Zero selector");
        functionAdmin[_address][_target][_selector] = _status;
        emit FunctionAdminUpdated(_address, _target, _selector, _status, msg.sender);
    }

    function _setSignerFunctionAdmin(
        address _address,
        address _target,
        bytes4 _selector,
        bool _status
    ) private {
        require(_isSignerLifecycleSelector(_selector), "Not signer selector");
        if (msg.sender != owner()) {
            require(signerLifecycleTargets[_target], "Not signer target");
        }
        _setFunctionAdmin(_address, _target, _selector, _status);
    }

    function _isSignerLifecycleSelector(bytes4 _selector) private pure returns (bool) {
        return _selector == DROP_SIGNER_UPDATE_SELECTOR || _selector == DROP_SIGNER_EPOCH_SELECTOR
            || _selector == DROP_CANCEL_SELECTOR;
    }

    function _canPause(address _account) private view returns (bool) {
        return _account == owner() || pauseGuardians[_account];
    }

    function _canUnpause(address _account) private view returns (bool) {
        return _account == owner() || unpauseAdmins[_account];
    }
}
