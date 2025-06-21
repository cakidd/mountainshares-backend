// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract KYC {
    bytes32 public merkleRoot;
    
    constructor(bytes32 _merkleRoot) {
        merkleRoot = _merkleRoot;
    }

    function kycStatus(address user, bytes32[] calldata proof) 
        public view returns (bool) 
    {
        bytes32 leaf = keccak256(abi.encodePacked(user));
        try this.verifyProof(merkleRoot, leaf, proof) returns (bool result) {
            return result;
        } catch {
            return false;
        }
    }

    function verifyProof(bytes32 root, bytes32 leaf, bytes32[] memory proof) 
        public pure returns (bool) 
    {
        return MerkleProof.verify(proof, root, leaf);
    }
}
