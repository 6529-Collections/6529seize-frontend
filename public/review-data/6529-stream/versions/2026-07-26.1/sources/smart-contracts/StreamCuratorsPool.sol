// SPDX-License-Identifier: MIT

/**
 *
 *  @title Stream 6529 Curators Pool
 *  @custom:date 27-June-2024
 *  @custom:version 0.3
 *  @author 6529 team
 */

pragma solidity ^0.8.19;

import "./IStreamAdmins.sol";
import "./MerkleProof.sol";
import "./IDelegationManagementContract.sol";
import "./ReentrancyGuard.sol";
import "./StreamPauseDomains.sol";

contract StreamCuratorsPool is ReentrancyGuard {
    address private constant DELEGATION_COLLECTION = 0x8888888888888888888888888888888888888888;
    uint256 private constant CURATOR_REWARD_USE_CASE = 1;
    bytes32 public constant CURATOR_REWARD_LEAF_DOMAIN =
        keccak256("6529Stream.StreamCuratorsPool.curatorRewardLeaf.v2");

    // variables declaration

    mapping(uint256 => bytes32) public collectionMerkleRoot;
    mapping(uint256 => uint256) public collectionMerkleRootEpoch;
    mapping(uint256 => mapping(address => uint256)) public rewardsPerAddress;
    mapping(uint256 => mapping(address => bool)) public rewardsClaimPerAddress;
    mapping(address => uint256) public curatorCredits;
    uint256 public totalCuratorOwed;

    IStreamAdmins adminsContract;
    IDelegationManagementContract dmc;

    modifier FunctionAdminRequired(bytes4 _selector) {
        require(
            adminsContract.retrieveFunctionAdmin(msg.sender, address(this), _selector)
                || adminsContract.retrieveGlobalAdmin(msg.sender),
            "Not allowed"
        );
        _;
    }

    // events
    event Reward(address indexed _add, uint256 indexed collectionID, uint256 indexed amount);
    event MerkleRootUpdated(
        uint256 indexed collectionID, uint256 indexed rootEpoch, bytes32 indexed merkleRoot
    );
    event CuratorCreditCreated(
        address indexed _add, uint256 indexed collectionID, uint256 indexed funds
    );
    event CuratorCreditWithdrawn(
        address indexed _add, address indexed _recipient, uint256 indexed funds
    );
    event Withdraw(address indexed _add, bool status, uint256 indexed funds);
    event EmergencyWithdrawal(
        address indexed _admin,
        address indexed _recipient,
        bytes32 indexed _domain,
        uint256 funds,
        uint256 resultingSurplus
    );

    constructor(address _adminsContract, address _del) {
        require(_adminsContract != address(0), "Zero admin");
        require(_del != address(0), "Zero delegation");
        adminsContract = IStreamAdmins(_adminsContract);
        dmc = IDelegationManagementContract(_del);
    }

    // function to set merkle root for each collection
    function setMerkleRoot(uint256 _collectionID, bytes32 _merkleRoot)
        public
        FunctionAdminRequired(this.setMerkleRoot.selector)
    {
        collectionMerkleRootEpoch[_collectionID] += 1;
        collectionMerkleRoot[_collectionID] = _merkleRoot;
        emit MerkleRootUpdated(_collectionID, collectionMerkleRootEpoch[_collectionID], _merkleRoot);
    }

    // function to set merkle root for each drop
    function setMultipleMerkleRoots(uint256[] memory _collectionIDs, bytes32[] memory _merkleRoot)
        public
        FunctionAdminRequired(this.setMultipleMerkleRoots.selector)
    {
        require(_collectionIDs.length == _merkleRoot.length, "Bad root input");
        for (uint256 i = 0; i < _collectionIDs.length; i++) {
            collectionMerkleRootEpoch[_collectionIDs[i]] += 1;
            collectionMerkleRoot[_collectionIDs[i]] = _merkleRoot[i];
            emit MerkleRootUpdated(
                _collectionIDs[i], collectionMerkleRootEpoch[_collectionIDs[i]], _merkleRoot[i]
            );
        }
    }

    // function to claim rewards
    function claimRewards(
        uint256 _collectionID,
        uint256 _amount,
        bytes32[] calldata merkleProof,
        address _delegator
    ) public nonReentrant {
        address rewardAddress = msg.sender;
        if (_delegator != 0x0000000000000000000000000000000000000000) {
            bool isAllowedToClaim;
            isAllowedToClaim = dmc.retrieveGlobalStatusOfDelegation(
                _delegator, DELEGATION_COLLECTION, msg.sender, CURATOR_REWARD_USE_CASE
            );
            require(isAllowedToClaim, "No delegation");
            rewardAddress = _delegator;
        }

        bytes32 node = hashRewardLeaf(
            rewardAddress, _collectionID, _amount, collectionMerkleRootEpoch[_collectionID]
        );
        require(rewardsClaimPerAddress[_collectionID][rewardAddress] == false, "Rewards Claimed");
        require(
            MerkleProof.verifyCalldata(merkleProof, collectionMerkleRoot[_collectionID], node),
            "invalid proof"
        );
        require(emergencyWithdrawable() >= _amount, "Insufficient balance");
        rewardsPerAddress[_collectionID][rewardAddress] = _amount;
        rewardsClaimPerAddress[_collectionID][rewardAddress] = true;
        if (_amount != 0) {
            curatorCredits[rewardAddress] += _amount;
            totalCuratorOwed += _amount;
            emit CuratorCreditCreated(rewardAddress, _collectionID, _amount);
        }
        emit Reward(rewardAddress, _collectionID, _amount);
    }

    function withdrawCuratorCredit() external {
        withdrawCuratorCreditTo(payable(msg.sender));
    }

    function withdrawCuratorCreditTo(address payable _recipient) public nonReentrant {
        require(_recipient != address(0), "Zero recipient");
        uint256 credit = curatorCredits[msg.sender];
        require(credit != 0, "No credit");

        curatorCredits[msg.sender] = 0;
        totalCuratorOwed -= credit;

        (bool success,) = _recipient.call{ value: credit }("");
        require(success, "ETH failed");
        emit CuratorCreditWithdrawn(msg.sender, _recipient, credit);
    }

    function hashRewardLeaf(address _rewardAddress, uint256 _collectionID, uint256 _amount)
        public
        view
        returns (bytes32)
    {
        return hashRewardLeaf(
            _rewardAddress, _collectionID, _amount, collectionMerkleRootEpoch[_collectionID]
        );
    }

    function hashRewardLeaf(
        address _rewardAddress,
        uint256 _collectionID,
        uint256 _amount,
        uint256 _rootEpoch
    ) public view returns (bytes32) {
        return keccak256(
            bytes.concat(
                keccak256(
                    abi.encode(
                        CURATOR_REWARD_LEAF_DOMAIN,
                        block.chainid,
                        address(this),
                        _collectionID,
                        _rewardAddress,
                        _amount,
                        _rootEpoch
                    )
                )
            )
        );
    }

    function totalOwed() public view returns (uint256) {
        return totalCuratorOwed;
    }

    function totalReserved() public pure returns (uint256) {
        return 0;
    }

    function emergencyWithdrawable() public view returns (uint256) {
        return surplus();
    }

    function surplus() public view returns (uint256) {
        uint256 balance = address(this).balance;
        uint256 owed = totalOwed();
        if (balance <= owed) {
            return 0;
        }
        return balance - owed;
    }

    // function to update admin contract
    function updateAdminContracts(address _newContract)
        public
        FunctionAdminRequired(this.updateAdminContracts.selector)
    {
        require(IStreamAdmins(_newContract).isAdminContract(), "Contract is not Admin");
        adminsContract = IStreamAdmins(_newContract);
    }

    // function to withdraw any balance from the smart contract
    function emergencyWithdraw() public FunctionAdminRequired(this.emergencyWithdraw.selector) {
        uint256 balance = emergencyWithdrawable();
        address recipient = adminsContract.emergencyRecipient();
        emit Withdraw(msg.sender, true, balance);
        emit EmergencyWithdrawal(msg.sender, recipient, StreamPauseDomains.EMERGENCY, balance, 0);
        if (balance > 0) {
            (bool success,) = payable(recipient).call{ value: balance }("");
            require(success, "ETH failed");
        }
    }

    receive() external payable { }
}
