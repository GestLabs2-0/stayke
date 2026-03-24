/* eslint-disable */
// @ts-nocheck
import { PublicKey } from "@solana/web3.js";

/**
 * AMBIENT DECLARATIONS FOR SOLANA PLAYGROUND
 * Estas líneas evitan errores de linter en VS Code para variables globales inyectadas por solpg.io.
 */
declare const pg: any;
declare const anchor: any;
declare const web3: any;

/**
 * STAYKE PROGRAM CLIENT (Solana Playground / Anchor Style)
 *
 * Este cliente está diseñado para ser usado directamente en el playground de Solana (https://beta.solpg.io/)
 * o scripts que utilicen el framework Anchor (pg.program).
 */

//////////////////// Constantes ////////////////////
export const PROGRAM_ID = new PublicKey(
  "GwRWqCBjW87B74SeHx3sH8w4WVGdbwc6tCKoSsUsLGqW"
);

//////////////////// HELPERS DE PDA ////////////////////

export function pdaConfig() {
  return PublicKey.findProgramAddressSync([Buffer.from("config")], PROGRAM_ID);
}

export function pdaTreasury() {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("treasury")],
    PROGRAM_ID
  );
}

export function pdaPlatformVault() {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("platform_vault")],
    PROGRAM_ID
  );
}

export function pdaPlatformVaultToken() {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("platform_vault_token")],
    PROGRAM_ID
  );
}

export function pdaTreasuryTokenAccount() {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("treasury_vault")],
    PROGRAM_ID
  );
}

export function pdaUserProfile(
  dniHash: Buffer | number[],
  ownerKey: PublicKey
) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("user"), Buffer.from(dniHash), ownerKey.toBuffer()],
    PROGRAM_ID
  );
}

export function pdaProperty(hostProfilePda: PublicKey, listingId: number) {
  const listingIdBuffer = Buffer.alloc(1);
  listingIdBuffer.writeUint8(listingId);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("property"), hostProfilePda.toBuffer(), listingIdBuffer],
    PROGRAM_ID
  );
}

export function pdaBooking(
  propertyPda: PublicKey,
  guestKey: PublicKey,
  checkIn: number
) {
  const checkInBuffer = Buffer.alloc(8);
  checkInBuffer.writeBigInt64LE(BigInt(checkIn));
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("booking"),
      propertyPda.toBuffer(),
      guestKey.toBuffer(),
      checkInBuffer,
    ],
    PROGRAM_ID
  );
}

export function pdaBookingDays(propertyPda: PublicKey, yearMonth: number) {
  const yearMonthBuffer = Buffer.alloc(4);
  yearMonthBuffer.writeUint32LE(yearMonth);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("booking_days"), propertyPda.toBuffer(), yearMonthBuffer],
    PROGRAM_ID
  );
}

export function pdaDispute(bookingPda: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("dispute"), bookingPda.toBuffer()],
    PROGRAM_ID
  );
}

export function pdaEscrow(bookingPda: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("escrow"), bookingPda.toBuffer()],
    PROGRAM_ID
  );
}

//////////////////// HELPERS DE UTILIDAD ////////////////////

export function getYearMonth(unixTimestamp: number): number {
  const date = new Date(unixTimestamp * 1000);
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1; // 1-12
  return year * 100 + month;
}

//////////////////// FUNCIONES DEL PROGRAMA ////////////////////

/**
 * Inicializa el contrato Stayke. Solo puede ser llamado por el deployer (o admin inicial).
 */
export async function initializeContract(
  initialData: {
    admins: PublicKey[];
    retributionBpsLow: number;
    retributionBpsMedium: number;
    retributionBpsHigh: number;
    minimumDeposit: number;
    feeBps: number;
  },
  usdcMint: PublicKey
) {
  const [pda_config] = pdaConfig();
  const [pda_treasury] = pdaTreasury();
  const [pda_treasury_vault] = pdaTreasuryTokenAccount();
  const [pda_platform_vault] = pdaPlatformVault();
  const [pda_platform_vault_token] = pdaPlatformVaultToken();

  const txHash = await pg.program.methods
    .initializeContract(initialData)
    .accounts({
      signer: pg.wallet.publicKey,
      config: pda_config,
      treasuryPda: pda_treasury,
      treasuryTokenAccount: pda_treasury_vault,
      platformVaultPda: pda_platform_vault,
      platformVaultTokenAccount: pda_platform_vault_token,
      usdcMint: usdcMint,
      tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
      systemProgram: web3.SystemProgram.programId,
    })
    .rpc();

  console.log("initializeContract txHash:", txHash);
  return txHash;
}

/**
 * Registra un nuevo perfil de usuario.
 */
export async function registerUser(dniHash: number[]) {
  const [pda_user] = pdaUserProfile(dniHash, pg.wallet.publicKey);

  const txHash = await pg.program.methods
    .registerUser(dniHash)
    .accounts({
      signer: pg.wallet.publicKey,
      userProfile: pda_user,
      systemProgram: web3.SystemProgram.programId,
    })
    .rpc();

  console.log("registerUser txHash:", txHash);
  return txHash;
}

/**
 * Registra una nueva propiedad vinculada al perfil del host.
 */
export async function registerProperty(
  dniHash: number[],
  pricePerNight: number
) {
  const [pda_user] = pdaUserProfile(dniHash, pg.wallet.publicKey);

  // Obtenemos el perfil para saber el listing_count actual
  const userAccount = await pg.program.account.userProfile.fetch(pda_user);
  const [pda_prop] = pdaProperty(pda_user, userAccount.listingCount);

  const txHash = await pg.program.methods
    .registerProperty(new anchor.BN(pricePerNight))
    .accounts({
      signer: pg.wallet.publicKey,
      userProfile: pda_user,
      property: pda_prop,
      systemProgram: web3.SystemProgram.programId,
    })
    .rpc();

  console.log("registerProperty txHash:", txHash);
  return txHash;
}

/**
 * Deposita fondos de garantía requeridos para operar.
 */
export async function depositFunds(
  dniHash: number[],
  amount: number,
  senderTokenAccount: PublicKey,
  usdcMint: PublicKey
) {
  const [pda_user] = pdaUserProfile(dniHash, pg.wallet.publicKey);
  const [pda_config] = pdaConfig();
  const [pda_treasury_vault] = pdaTreasuryTokenAccount();

  const txHash = await pg.program.methods
    .depositFunds(new anchor.BN(amount))
    .accounts({
      signer: pg.wallet.publicKey,
      userProfile: pda_user,
      config: pda_config,
      senderTokenAccount: senderTokenAccount,
      treasury: pda_treasury_vault,
      mint: usdcMint,
      tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
    })
    .rpc();

  console.log("depositFunds txHash:", txHash);
  return txHash;
}

/**
 * Crea una reserva para una propiedad.
 */
export async function createBooking(
  clientDniHash: number[],
  hostDniHash: number[],
  hostPubkey: PublicKey,
  listingId: number,
  checkIn: number,
  checkOut: number
) {
  const [pda_client] = pdaUserProfile(clientDniHash, pg.wallet.publicKey);
  const [pda_host] = pdaUserProfile(hostDniHash, hostPubkey);
  const [pda_prop] = pdaProperty(pda_host, listingId);
  const [pda_book] = pdaBooking(pda_prop, pg.wallet.publicKey, checkIn);
  const [pda_config] = pdaConfig();
  const [pda_days] = pdaBookingDays(pda_prop, getYearMonth(checkIn));

  const txHash = await pg.program.methods
    .createBooking(new anchor.BN(checkIn), new anchor.BN(checkOut))
    .accounts({
      client: pg.wallet.publicKey,
      clientProfile: pda_client,
      property: pda_prop,
      propertyHost: pda_host,
      booking: pda_book,
      config: pda_config,
      systemProgram: web3.SystemProgram.programId,
      bookingDays: pda_days,
    })
    .rpc();

  console.log("createBooking txHash:", txHash);
  return txHash;
}

/**
 * El host acepta la reserva pendiente.
 */
export async function hostAcceptBooking(
  hostDniHash: number[],
  bookingPda: PublicKey
) {
  const [pda_host] = pdaUserProfile(hostDniHash, pg.wallet.publicKey);
  const [pda_config] = pdaConfig();

  const txHash = await pg.program.methods
    .hostPendingAccept()
    .accounts({
      host: pg.wallet.publicKey,
      propertyHost: pda_host,
      booking: bookingPda,
      config: pda_config,
    })
    .rpc();

  console.log("hostAcceptBooking txHash:", txHash);
  return txHash;
}

/**
 * El cliente activa la reserva enviando los fondos al escrow.
 */
export async function clientActivateBooking(
  clientDniHash: number[],
  bookingPda: PublicKey,
  propertyPda: PublicKey,
  usdcMint: PublicKey,
  clientTokenAccount: PublicKey
) {
  const [pda_client] = pdaUserProfile(clientDniHash, pg.wallet.publicKey);
  const [pda_escrow] = pdaEscrow(bookingPda);
  const [pda_config] = pdaConfig();

  const txHash = await pg.program.methods
    .acceptReserve()
    .accounts({
      client: pg.wallet.publicKey,
      clientProfile: pda_client,
      property: propertyPda,
      booking: bookingPda,
      config: pda_config,
      mint: usdcMint,
      clientTokenAccount: clientTokenAccount,
      escrowTokenAccount: pda_escrow,
      tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
      associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
      systemProgram: web3.SystemProgram.programId,
    })
    .rpc();

  console.log("clientActivateBooking txHash:", txHash);
  return txHash;
}

/**
 * Completa la estancia y libera los pagos (Host y Plataforma).
 */
export async function completeStay(
  clientDniHash: number[],
  hostDniHash: number[],
  hostPubkey: PublicKey,
  propertyPda: PublicKey,
  bookingPda: PublicKey,
  hostTokenAccount: PublicKey,
  usdcMint: PublicKey
) {
  const [pda_client] = pdaUserProfile(clientDniHash, pg.wallet.publicKey);
  const [pda_host] = pdaUserProfile(hostDniHash, hostPubkey);
  const [pda_escrow] = pdaEscrow(bookingPda);
  const [pda_config] = pdaConfig();
  const [pda_platform_vault_token] = pdaPlatformVaultToken();

  const txHash = await pg.program.methods
    .completeStay()
    .accounts({
      client: pg.wallet.publicKey,
      clientProfile: pda_client,
      hostProfile: pda_host,
      property: propertyPda,
      booking: bookingPda,
      config: pda_config,
      escrowTokenAccount: pda_escrow,
      hostTokenAccount: hostTokenAccount,
      platformVaultTokenAccount: pda_platform_vault_token,
      mint: usdcMint,
      tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
    })
    .rpc();

  console.log("completeStay txHash:", txHash);
  return txHash;
}

/**
 * Actualiza el precio por noche de una propiedad.
 */
export async function updatePropertyPrice(
  dniHash: number[],
  listingId: number,
  newPrice: number
) {
  const [pda_user] = pdaUserProfile(dniHash, pg.wallet.publicKey);
  const [pda_prop] = pdaProperty(pda_user, listingId);

  const txHash = await pg.program.methods
    .updatePropertyPrice(new anchor.BN(newPrice))
    .accounts({
      signer: pg.wallet.publicKey,
      userProfile: pda_user,
      property: pda_prop,
    })
    .rpc();

  console.log("updatePropertyPrice txHash:", txHash);
  return txHash;
}

/**
 * El host rechaza una reserva pendiente.
 */
export async function hostRejectBooking(
  hostDniHash: number[],
  guestPubkey: PublicKey,
  bookingPda: PublicKey,
  checkIn: number
) {
  const [pda_host] = pdaUserProfile(hostDniHash, pg.wallet.publicKey);
  const [pda_config] = pdaConfig();
  const [pda_days] = pdaBookingDays(bookingPda, getYearMonth(checkIn)); // Simplificación: asumiendo que el PDA de la reserva tiene la propiedad

  const txHash = await pg.program.methods
    .hostPendingReject()
    .accounts({
      host: pg.wallet.publicKey,
      propertyHost: pda_host,
      guest: guestPubkey,
      booking: bookingPda,
      config: pda_config,
      bookingDays: pda_days,
    })
    .rpc();

  console.log("hostRejectBooking txHash:", txHash);
  return txHash;
}

/**
 * El cliente cierra la reserva después de completar la estancia (con calificación).
 */
export async function closeBooking(
  clientDniHash: number[],
  hostDniHash: number[],
  hostPubkey: PublicKey,
  listingId: number,
  bookingPda: PublicKey,
  score: number // 1-5
) {
  const [pda_client] = pdaUserProfile(clientDniHash, pg.wallet.publicKey);
  const [pda_host] = pdaUserProfile(hostDniHash, hostPubkey);
  const [pda_prop] = pdaProperty(pda_host, listingId);

  const txHash = await pg.program.methods
    .closeBooking(score)
    .accounts({
      client: pg.wallet.publicKey,
      clientProfile: pda_client,
      hostProfile: pda_host,
      property: pda_prop,
      booking: bookingPda,
    })
    .rpc();

  console.log("closeBooking txHash:", txHash);
  return txHash;
}

/**
 * Abre una disputa sobre una reserva activa.
 */
export async function openDispute(
  dniHash: number[],
  bookingPda: PublicKey,
  reason: any
) {
  const [pda_user] = pdaUserProfile(dniHash, pg.wallet.publicKey);
  const [pda_disp] = pdaDispute(bookingPda);

  const txHash = await pg.program.methods
    .openDispute(reason)
    .accounts({
      caller: pg.wallet.publicKey,
      userProfile: pda_user,
      booking: bookingPda,
      dispute: pda_disp,
      systemProgram: web3.SystemProgram.programId,
    })
    .rpc();

  console.log("openDispute txHash:", txHash);
  return txHash;
}

/**
 * Resuelve una disputa (Solo Admins).
 */
export async function resolveDispute(
  bookingPda: PublicKey,
  hostShareBps: number,
  rejected: boolean,
  escrowTokenAccount: PublicKey,
  hostTokenAccount: PublicKey,
  guestTokenAccount: PublicKey,
  usdcMint: PublicKey
) {
  const [pda_config] = pdaConfig();
  const [pda_disp] = pdaDispute(bookingPda);
  const [pda_platform_vault_token] = pdaPlatformVaultToken();

  const txHash = await pg.program.methods
    .resolveDispute(hostShareBps, rejected)
    .accounts({
      admin: pg.wallet.publicKey,
      config: pda_config,
      booking: bookingPda,
      dispute: pda_disp,
      escrowTokenAccount: escrowTokenAccount,
      hostTokenAccount: hostTokenAccount,
      guestTokenAccount: guestTokenAccount,
      platformVaultTokenAccount: pda_platform_vault_token,
      mint: usdcMint,
      tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
    })
    .rpc();

  console.log("resolveDispute txHash:", txHash);
  return txHash;
}

/**
 * Añade un nuevo administrador (Solo Admins).
 */
export async function addAdmin(newAdmin: PublicKey) {
  const [pda_config] = pdaConfig();

  const txHash = await pg.program.methods
    .addAdmin(newAdmin)
    .accounts({
      signer: pg.wallet.publicKey,
      config: pda_config,
    })
    .rpc();

  console.log("addAdmin txHash:", txHash);
  return txHash;
}

/**
 * El cliente rechaza la reserva (antes de activarla).
 */
export async function clientRejectReserve(
  clientDniHash: number[],
  bookingPda: PublicKey,
  checkIn: number
) {
  const [pda_client] = pdaUserProfile(clientDniHash, pg.wallet.publicKey);
  const [pda_config] = pdaConfig();
  const [pda_days] = pdaBookingDays(bookingPda, getYearMonth(checkIn));

  const txHash = await pg.program.methods
    .clientRejectReserve()
    .accounts({
      client: pg.wallet.publicKey,
      clientProfile: pda_client,
      booking: bookingPda,
      config: pda_config,
      bookingDays: pda_days,
    })
    .rpc();

  console.log("clientRejectReserve txHash:", txHash);
  return txHash;
}

/**
 * Verifica la identidad de un usuario (Solo Admins).
 * En el futuro integrará Civic.
 */
export async function verifyIdentity(
  adminDniHash: number[],
  userProfilePda: PublicKey
) {
  const [pda_config] = pdaConfig();

  const txHash = await pg.program.methods
    .verifyIdentity()
    .accounts({
      signer: pg.wallet.publicKey,
      config: pda_config,
      userProfile: userProfilePda,
      gatewayToken: pg.wallet.publicKey, // Placeholder
    })
    .rpc();

  console.log("verifyIdentity txHash:", txHash);
  return txHash;
}

/**
 * Penaliza a un usuario y transfiere parte de su garantía a un afectado (Solo Admins).
 */
export async function penalizeUser(
  penalizedProfilePda: PublicKey,
  affectedWallet: PublicKey,
  affectedTokenAccount: PublicKey,
  usdcMint: PublicKey,
  severity: any // PenaltySeverity enum
) {
  const [pda_config] = pdaConfig();
  const [pda_treasury_vault] = pdaTreasuryTokenAccount();
  const [pda_treasury] = pdaTreasury();

  const txHash = await pg.program.methods
    .penalizeUser(severity)
    .accounts({
      signer: pg.wallet.publicKey,
      config: pda_config,
      penalizedProfile: penalizedProfilePda,
      affectedTokenAccount: affectedTokenAccount,
      affectedWallet: affectedWallet,
      treasuryTokenAccount: pda_treasury_vault,
      treasuryPda: pda_treasury,
      mint: usdcMint,
      tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
      associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
    })
    .rpc();

  console.log("penalizeUser txHash:", txHash);
  return txHash;
}

//////////////////// HELPERS DE FETCH ////////////////////

export async function fetchUserProfile(pda: PublicKey) {
  return await pg.program.account.userProfile.fetch(pda);
}

export async function fetchProperty(pda: PublicKey) {
  return await pg.program.account.property.fetch(pda);
}

export async function fetchBooking(pda: PublicKey) {
  return await pg.program.account.booking.fetch(pda);
}

export async function fetchPlatformConfig() {
  const [pda] = pdaConfig();
  return await pg.program.account.platformConfig.fetch(pda);
}

//////////////////////////////////////////////////////////////////////////////
// EJEMPLOS DE USO (Descomentar para probar en el Playground)
//////////////////////////////////////////////////////////////////////////////

/*
(async () => {
    // 1. DNI Hash (ejemplo sha256 simplificado)
    const myDniHash = Array(32).fill(0); // Sustituir por hash real
    
    // 2. Registrarse
    // await registerUser(myDniHash);

    // 3. Activar modo Host
    // await pg.program.methods.setHostStatus(true).accounts({
    //     signer: pg.wallet.publicKey,
    //     userProfile: pdaUserProfile(myDniHash, pg.wallet.publicKey)[0]
    // }).rpc();

    // 4. Publicar propiedad
    // await registerProperty(myDniHash, 50000000); // 0.05 USDC? Depende de decimales

    // 5. Ver datos
    const [myProfilePda] = pdaUserProfile(myDniHash, pg.wallet.publicKey);
    const profile = await fetchUserProfile(myProfilePda);
    console.log("Mi Perfil:", profile);

})();
*/
