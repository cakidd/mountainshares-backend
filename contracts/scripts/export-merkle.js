const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');
const fs = require('fs');
const path = require('path');

const addresses = [
  "0xD8bb25076e61B5a382e17171b48d8E0952b5b4f3"
];

const leaves = addresses.map(addr => keccak256(addr));
const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });

// Use absolute path
const outputPath = path.join("/home/aubre", 'mountainshares-vercel-deploy/src/merkle-data.json');

// Ensure directory exists
const dir = path.dirname(outputPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

fs.writeFileSync(outputPath, JSON.stringify({
  root: tree.getHexRoot(),
  proofs: Object.fromEntries(addresses.map(addr => [
    addr, 
    tree.getHexProof(keccak256(addr))
  ]))
}, null, 2));

console.log('Merkle data generated at:', outputPath);
