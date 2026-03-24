import { getProgramDerivedAddress, getAddressEncoder, address } from "@solana/kit";

const ATOKEN_PROGRAM_ID = address("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");
const TOKEN_PROGRAM_ID = address("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");

async function main() {
  const [ata] = await getProgramDerivedAddress({
    programAddress: ATOKEN_PROGRAM_ID,
    seeds: [
      getAddressEncoder().encode(address("DYGcbwMtHbMK2gRaXhujjwYQLZo7KwS1FHzfhrx6iN6w")),
      getAddressEncoder().encode(TOKEN_PROGRAM_ID),
      getAddressEncoder().encode(address("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU")),
    ],
  });
  console.log("ATA is:", ata);
}
main();
