// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../smart-contracts/IRandomizer.sol";
import "../smart-contracts/IStreamCore.sol";
import "../smart-contracts/StreamCore.sol";
import "../smart-contracts/StreamDrops.sol";
import "./RehearseDeployment.s.sol";

interface MetadataScriptVm {
    function addr(uint256 privateKey) external returns (address);
    function sign(uint256 privateKey, bytes32 digest)
        external
        returns (uint8 v, bytes32 r, bytes32 s);
    function startBroadcast(address broadcaster) external;
    function stopBroadcast() external;
}

contract MetadataRehearsalRandomizer is IRandomizer {
    IStreamCore private immutable core;

    constructor(address core_) {
        core = IStreamCore(core_);
    }

    function calculateTokenHash(uint256 collectionId, uint256 mintIndex, uint256 saltfunO)
        external
    {
        core.setTokenHash(
            collectionId, mintIndex, keccak256(abi.encode(collectionId, mintIndex, saltfunO))
        );
    }

    function isRandomizerContract() external pure returns (bool) {
        return true;
    }
}

contract RehearseMetadataBrowser {
    MetadataScriptVm private constant vm =
        MetadataScriptVm(address(uint160(uint256(keccak256("hevm cheat code")))));

    uint256 private constant SIGNER_KEY = 0xA11CE;
    string private constant LOCAL_EVIDENCE_KIND = "local-anvil-deployment-rehearsal";
    string private constant FORK_TESTNET_EVIDENCE_KIND = "fork-testnet-deployment-rehearsal";
    string private constant TOKEN_DATA = "1,2,3";
    bytes32 private constant LOCAL_DEPENDENCY_KEY =
        keccak256("6529Stream.local.rehearsal.dependency.v1");
    uint256 private constant FULL_COLLECTION_UPDATE_INDEX = 10 ** 6;

    struct MetadataBrowserResult {
        string evidenceKind;
        uint256 chainId;
        bytes32 deploymentManifestHash;
        uint256 collectionId;
        uint256 tokenId;
        bytes32 tokenHash;
        string tokenDataRaw;
        string externalScriptUrl;
        string tokenUri;
    }

    function run() external returns (MetadataBrowserResult memory result) {
        RehearseDeployment deployment = new RehearseDeployment();
        RehearseDeployment.DeploymentConfig memory config = deployment.defaultLocalConfig();
        config.tdhSigner = vm.addr(SIGNER_KEY);

        RehearseDeployment.DeploymentResult memory deployed = deployment.deployLocal(config);
        StreamCore core = StreamCore(deployed.core);
        StreamDrops drops = StreamDrops(deployed.drops);

        vm.startBroadcast(config.adminSafe);
        MetadataRehearsalRandomizer randomizer = new MetadataRehearsalRandomizer(address(core));
        core.addRandomizer(deployed.sampleCollectionId, address(randomizer));
        core.changeMetadataView(deployed.sampleCollectionId, true);
        _setCollectionBrowserMetadata(core, deployed.sampleCollectionId);

        StreamDrops.DropAuthorization memory authorization =
            _buildAuthorization(drops, deployed.sampleCollectionId);
        bytes memory signature = _signAuthorization(drops, authorization);
        drops.mintDrop(authorization, TOKEN_DATA, signature);

        uint256 tokenId = drops.retrieveTokenID(authorization.dropId);
        _setTokenMetadataInputs(core, tokenId);
        string memory tokenUri = core.tokenURI(tokenId);
        bytes32 tokenHash = core.retrieveTokenHash(tokenId);
        vm.stopBroadcast();

        result = MetadataBrowserResult({
            evidenceKind: _evidenceKind(),
            chainId: deployed.chainId,
            deploymentManifestHash: deployed.manifestHash,
            collectionId: deployed.sampleCollectionId,
            tokenId: tokenId,
            tokenHash: tokenHash,
            tokenDataRaw: TOKEN_DATA,
            externalScriptUrl: "https://cdn.6529.io/stream/rehearsal.js",
            tokenUri: tokenUri
        });
    }

    function _evidenceKind() private view returns (string memory) {
        return block.chainid == 31337 ? LOCAL_EVIDENCE_KIND : FORK_TESTNET_EVIDENCE_KIND;
    }

    function _collectionDescription() private view returns (string memory) {
        return block.chainid == 31337
            ? "Local deployment rehearsal collection"
            : "Fork/testnet deployment rehearsal collection";
    }

    function _rehearsalTraitValue() private view returns (string memory) {
        return block.chainid == 31337 ? "Local Anvil" : "Fork/Testnet";
    }

    function _drawScriptLabel() private view returns (string memory) {
        return
            block.chainid == 31337
                ? "6529Stream local rehearsal"
                : "6529Stream fork/testnet rehearsal";
    }

    function _buildAuthorization(StreamDrops drops, uint256 collectionId)
        private
        view
        returns (StreamDrops.DropAuthorization memory authorization)
    {
        uint256 nonce = 1;
        uint256 salt = 2;
        uint256 signerEpoch = drops.signerEpoch();
        authorization = StreamDrops.DropAuthorization({
            dropId: drops.deriveDropId(drops.tdhSigner(), signerEpoch, nonce, salt),
            poster: address(0x000000000000000000000000000000000000652A),
            recipient: address(0x000000000000000000000000000000000000652B),
            payer: address(0),
            collectionId: collectionId,
            saleMode: drops.SALE_MODE_FIXED_PRICE(),
            tokenDataHash: keccak256(bytes(TOKEN_DATA)),
            price: 0,
            quantity: 1,
            auctionReservePrice: 0,
            auctionEndTime: 0,
            salt: salt,
            nonce: nonce,
            deadline: block.timestamp + 1 days,
            signerEpoch: signerEpoch
        });
    }

    function _signAuthorization(
        StreamDrops drops,
        StreamDrops.DropAuthorization memory authorization
    ) private returns (bytes memory) {
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(
            SIGNER_KEY, drops.hashDropAuthorization(authorization)
        );
        return abi.encodePacked(r, s, v);
    }

    function _setTokenMetadataInputs(StreamCore core, uint256 tokenId) private {
        uint256[] memory tokenIds = new uint256[](1);
        string[] memory images = new string[](1);
        string[] memory attributes = new string[](1);

        tokenIds[0] = tokenId;
        images[0] = "ipfs://6529stream-rehearsal/final.png";
        attributes[0] = string.concat(
            "{\"trait_type\":\"Rehearsal\",\"value\":\"", _rehearsalTraitValue(), "\"}"
        );

        core.updateImagesAndAttributes(tokenIds, images, attributes);
    }

    function _setCollectionBrowserMetadata(StreamCore core, uint256 collectionId) private {
        string[] memory scripts = new string[](1);
        scripts[0] = string.concat("function draw(){return '", _drawScriptLabel(), "';}");
        core.updateCollectionInfo(
            collectionId,
            "6529 Stream Rehearsal",
            "6529",
            _collectionDescription(),
            "https://6529.io",
            "CC0",
            "ipfs://6529stream-rehearsal/",
            "https://cdn.6529.io/stream/rehearsal.js",
            LOCAL_DEPENDENCY_KEY,
            FULL_COLLECTION_UPDATE_INDEX,
            scripts
        );
    }
}
