import { Keypair } from "@solana/web3.js";

import bs58 from "bs58";

const privateKeyBase58 = "";

// Create a Keypair from the private key

const keypair = Keypair.fromSecretKey(bs58.decode(privateKeyBase58));

console.log("Private Key Array:", Array.from(keypair.secretKey));

console.log("Base58 Encoded:", bs58.encode(keypair.secretKey)); // Should match original
