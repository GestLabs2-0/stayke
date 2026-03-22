import { isValidSolanaPubkey } from "#utils/solana.js";
import { describe, expect, it } from "vitest";

describe("isValidSolanaPubkey", () => {
  it("should return true for a valid Solana pubkey", () => {
    expect(isValidSolanaPubkey("4Nd1mbtBn5EgqKaMFiAS9KRFtRwfHvb8Y1bKBUxbhQV")).toBe(true);
  });

  it("should return false for an empty string", () => {
    expect(isValidSolanaPubkey("")).toBe(false);
  });

  it("should return false for an invalid pubkey with special chars", () => {
    expect(isValidSolanaPubkey("not-a-valid-pubkey!")).toBe(false);
  });

  it("should return false for a string that is too short", () => {
    expect(isValidSolanaPubkey("abc")).toBe(false);
  });
});
