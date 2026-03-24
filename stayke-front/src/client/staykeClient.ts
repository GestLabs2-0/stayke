import {
  address,
  type TransactionSigner,
  pipe,
  createTransactionMessage,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstruction,
  signTransactionMessageWithSigners,
  getBase64EncodedWireTransaction,
  type Instruction,
} from "@solana/kit";
import { rpc } from "./rpc";
import {
  getRegisterUserInstructionAsync,
  getSetHostStatusInstruction,
  getDepositFundsInstruction,
  getRegisterPropertyInstruction,
  getUpdatePropertyPriceInstruction,
  getCreateBookingInstructionAsync,
  getHostPendingAcceptInstruction,
  getHostPendingRejectInstructionAsync,
  getAcceptReserveInstruction,
  getClientRejectReserveInstructionAsync,
  getCompleteStayInstruction,
  getCloseBookingInstruction,
  getOpenDisputeInstruction,
  getResolveDisputeInstruction,
  getCloseDisputeInstruction,
  getWithdrawGuaranteeInstructionAsync,
  getPenalizeUserInstructionAsync,
} from "../generated/stayke/instructions";
import {
  getPdaProperty,
  getPdaConfig,
  getPdaTreasuryTokenAccount,
  getPdaEscrow,
  getPdaPlatformVaultToken,
  getPdaDispute,
  getPdaBookingDays,
} from "./pdas";
import { DisputeReason, PenaltySeverity } from "../generated/stayke/types";

/**
 * STAYKE CLIENT (Solana Kit v2 / Codama)
 *
 * Provides high-level functions to interact with the Stayke program.
 */

// Helper to send a transaction
async function sendTransaction(
  signer: TransactionSigner,
  instruction: Instruction
) {
  const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();

  const transactionMessage = pipe(
    createTransactionMessage({ version: 0 }),
    (m) => setTransactionMessageFeePayerSigner(signer, m),
    (m) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
    (m) => appendTransactionMessageInstruction(instruction, m)
  );

  const signedTransaction =
    await signTransactionMessageWithSigners(transactionMessage);

  const signature = await rpc
    .sendTransaction(getBase64EncodedWireTransaction(signedTransaction), {
      encoding: "base64",
    })
    .send();

  return signature;
}

export const staykeClient = {
  /**
   * Registers a new user profile on-chain.
   */
  async registerUser(signer: TransactionSigner, dniHash: Uint8Array) {
    const instruction = await getRegisterUserInstructionAsync({
      signer,
      dniHash,
    });
    return await sendTransaction(signer, instruction);
  },

  /**
   * Sets the host status (is_host) of the user.
   */
  async setHostStatus(
    signer: TransactionSigner,
    userProfilePda: string,
    status: boolean
  ) {
    const instruction = getSetHostStatusInstruction({
      signer,
      userProfile: address(userProfilePda),
      status,
    });
    return await sendTransaction(signer, instruction);
  },

  /**
   * Deposits guarantee funds (USDC) to the platform treasury.
   */
  async depositFunds(
    signer: TransactionSigner,
    userProfilePdaStr: string,
    amount: number | bigint,
    senderTokenAccount: string,
    usdcMint: string
  ) {
    const configPda = await getPdaConfig();
    const treasuryVaultPda = await getPdaTreasuryTokenAccount();

    const instruction = getDepositFundsInstruction({
      signer,
      userProfile: address(userProfilePdaStr),
      config: configPda[0],
      senderTokenAccount: address(senderTokenAccount),
      treasury: treasuryVaultPda[0],
      mint: address(usdcMint),
      amount,
    });
    return await sendTransaction(signer, instruction);
  },

  /**
   * Publishes a new property.
   */
  async publishProperty(
    signer: TransactionSigner,
    userProfilePda: string,
    listingId: number,
    pricePerNight: number | bigint
  ) {
    const propertyPda = await getPdaProperty(userProfilePda, listingId);

    const instruction = getRegisterPropertyInstruction({
      signer,
      userProfile: address(userProfilePda),
      property: propertyPda[0],
      pricePerNight,
    });
    return await sendTransaction(signer, instruction);
  },

  /**
   * Updates property price.
   */
  async updatePropertyPrice(
    signer: TransactionSigner,
    userProfilePda: string,
    propertyPda: string,
    newPricePerNight: number | bigint
  ) {
    const instruction = getUpdatePropertyPriceInstruction({
      signer,
      userProfile: address(userProfilePda),
      property: address(propertyPda),
      newPricePerNight,
    });
    return await sendTransaction(signer, instruction);
  },

  /**
   * Creates a booking.
   */
  async createBooking(
    signer: TransactionSigner,
    clientProfilePda: string,
    propertyPda: string,
    hostProfilePda: string,
    checkIn: number | bigint,
    checkOut: number | bigint
  ) {
    const instruction = await getCreateBookingInstructionAsync({
      client: signer,
      clientProfile: address(clientProfilePda),
      property: address(propertyPda),
      propertyHost: address(hostProfilePda),
      checkIn,
      checkOut,
    });
    return await sendTransaction(signer, instruction);
  },

  /**
   * Host accepts a pending booking.
   */
  async hostAcceptBooking(
    signer: TransactionSigner,
    hostProfilePda: string,
    bookingPda: string
  ) {
    const configPda = await getPdaConfig();
    const instruction = getHostPendingAcceptInstruction({
      host: signer,
      propertyHost: address(hostProfilePda),
      booking: address(bookingPda),
      config: configPda[0],
    });
    return await sendTransaction(signer, instruction);
  },

  /**
   * Host rejects a pending booking.
   */
  async hostRejectBooking(
    signer: TransactionSigner,
    hostProfilePda: string,
    guestPubkey: string,
    bookingPda: string,
    propertyPda: string,
    checkIn: number | bigint
  ) {
    const bookingDaysPda = await getPdaBookingDays(propertyPda, checkIn);

    const instruction = await getHostPendingRejectInstructionAsync({
      host: signer,
      propertyHost: address(hostProfilePda),
      guest: address(guestPubkey),
      booking: address(bookingPda),
      bookingDays: bookingDaysPda[0],
    });
    return await sendTransaction(signer, instruction);
  },

  /**
   * Client activates the reserve by depositing USDC into Escrow.
   */
  async acceptReserve(
    signer: TransactionSigner,
    clientProfilePda: string,
    propertyPda: string,
    bookingPda: string,
    usdcMint: string,
    clientTokenAccount: string
  ) {
    const configPda = await getPdaConfig();
    const escrowPda = await getPdaEscrow(bookingPda);

    const instruction = getAcceptReserveInstruction({
      client: signer,
      clientProfile: address(clientProfilePda),
      property: address(propertyPda),
      booking: address(bookingPda),
      config: configPda[0],
      mint: address(usdcMint),
      clientTokenAccount: address(clientTokenAccount),
      escrowTokenAccount: escrowPda[0],
    });
    return await sendTransaction(signer, instruction);
  },

  /**
   * Completes stay and releases funds.
   */
  async completeStay(
    signer: TransactionSigner,
    clientProfilePda: string,
    hostProfilePda: string,
    propertyPda: string,
    bookingPda: string,
    hostTokenAccount: string,
    usdcMint: string
  ) {
    const configPda = await getPdaConfig();
    const escrowPda = await getPdaEscrow(bookingPda);
    const platformVaultTokenPda = await getPdaPlatformVaultToken();

    const instruction = getCompleteStayInstruction({
      client: signer,
      clientProfile: address(clientProfilePda),
      hostProfile: address(hostProfilePda),
      property: address(propertyPda),
      booking: address(bookingPda),
      config: configPda[0],
      escrowTokenAccount: escrowPda[0],
      hostTokenAccount: address(hostTokenAccount),
      platformVaultTokenAccount: platformVaultTokenPda[0],
      mint: address(usdcMint),
    });
    return await sendTransaction(signer, instruction);
  },

  /**
   * Closes a booking with a score.
   */
  async closeBooking(
    signer: TransactionSigner,
    clientProfilePda: string,
    hostProfilePda: string,
    propertyPda: string,
    bookingPda: string,
    score: number
  ) {
    const instruction = getCloseBookingInstruction({
      client: signer,
      clientProfile: address(clientProfilePda),
      hostProfile: address(hostProfilePda),
      property: address(propertyPda),
      booking: address(bookingPda),
      score,
    });
    return await sendTransaction(signer, instruction);
  },

  /**
   * Opens a dispute.
   */
  async openDispute(
    signer: TransactionSigner,
    userProfilePda: string,
    bookingPda: string,
    reason: DisputeReason
  ) {
    const disputePda = await getPdaDispute(bookingPda);
    const instruction = getOpenDisputeInstruction({
      caller: signer,
      userProfile: address(userProfilePda),
      booking: address(bookingPda),
      dispute: disputePda[0],
      reason,
    });
    return await sendTransaction(signer, instruction);
  },

  /**
   * Client rejects the reserve before it's activated.
   */
  async clientRejectReserve(
    signer: TransactionSigner,
    clientProfilePda: string,
    propertyPda: string,
    bookingPda: string,
    checkIn: number | bigint
  ) {
    const bookingDaysPda = await getPdaBookingDays(propertyPda, checkIn);

    const instruction = await getClientRejectReserveInstructionAsync({
      client: signer,
      clientProfile: address(clientProfilePda),
      booking: address(bookingPda),
      bookingDays: bookingDaysPda[0],
    });
    return await sendTransaction(signer, instruction);
  },

  /**
   * Resolves a dispute (Admin only).
   */
  async resolveDispute(
    signer: TransactionSigner,
    bookingPda: string,
    hostShareBps: number,
    rejected: boolean,
    escrowTokenAccount: string,
    hostTokenAccount: string,
    guestTokenAccount: string,
    usdcMint: string
  ) {
    const configPda = await getPdaConfig();
    const disputePda = await getPdaDispute(bookingPda);
    const platformVaultTokenPda = await getPdaPlatformVaultToken();

    const instruction = getResolveDisputeInstruction({
      admin: signer,
      config: configPda[0],
      booking: address(bookingPda),
      dispute: disputePda[0],
      escrowTokenAccount: address(escrowTokenAccount),
      hostTokenAccount: address(hostTokenAccount),
      guestTokenAccount: address(guestTokenAccount),
      platformVaultTokenAccount: platformVaultTokenPda[0],
      mint: address(usdcMint),
      hostShareBps,
      rejected,
    });
    return await sendTransaction(signer, instruction);
  },

  /**
   * Closes a dispute (Admin only).
   */
  async closeDispute(
    signer: TransactionSigner,
    bookingPda: string,
    hostProfilePda: string,
    guestProfilePda: string,
    propertyPda: string
  ) {
    const configPda = await getPdaConfig();
    const disputePda = await getPdaDispute(bookingPda);

    const instruction = getCloseDisputeInstruction({
      admin: signer,
      config: configPda[0],
      booking: address(bookingPda),
      dispute: disputePda[0],
      hostProfile: address(hostProfilePda),
      guestProfile: address(guestProfilePda),
      property: address(propertyPda),
    });
    return await sendTransaction(signer, instruction);
  },

  /**
   * Withdraws guarantee funds (USDC).
   */
  async withdrawGuarantee(
    signer: TransactionSigner,
    userProfilePda: string,
    amount: number | bigint,
    userTokenAccount: string,
    usdcMint: string
  ) {
    const treasuryVaultPda = await getPdaTreasuryTokenAccount();
    const instruction = await getWithdrawGuaranteeInstructionAsync({
      signer,
      userProfile: address(userProfilePda),
      treasuryTokenAccount: treasuryVaultPda[0],
      userTokenAccount: address(userTokenAccount),
      mint: address(usdcMint),
      amount,
    });
    return await sendTransaction(signer, instruction);
  },

  /**
   * Penalizes a user (Admin only).
   */
  async penalizeUser(
    signer: TransactionSigner,
    penalizedProfilePda: string,
    affectedWallet: string,
    affectedTokenAccount: string,
    usdcMint: string,
    severity: PenaltySeverity
  ) {
    const treasuryVaultPda = await getPdaTreasuryTokenAccount();
    const instruction = await getPenalizeUserInstructionAsync({
      signer,
      penalizedProfile: address(penalizedProfilePda),
      affectedWallet: address(affectedWallet),
      affectedTokenAccount: address(affectedTokenAccount),
      treasuryTokenAccount: treasuryVaultPda[0],
      mint: address(usdcMint),
      severity,
    });
    return await sendTransaction(signer, instruction);
  },
};
