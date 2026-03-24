"use client";

import { useAuth } from "@/src/Context/AuthContext";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  User,
  Star,
  Wallet,
  CalendarCheck,
  LogOut,
  Mail,
  Shield,
  Phone,
  MessageSquare,
} from "lucide-react";
import { useWalletConnection } from "@solana/react-hooks";
import Link from "next/link";
import { truncate } from "@/src/helpers/Truncate";
import { useSolBalance } from "@/src/Hooks/useSolanaBalance";
import { useTokenBalance } from "@/src/Hooks/useTokenBalance";
import { useUserOnChain } from "@/src/Hooks/useUserOnChain";
import { solanaService } from "@/src/services/solanaService";
import type { Review } from "@/src/types/AuthContex";
import { propertyService } from "@/src/services/propertyService";
import { mapBackendPropertyToListing } from "@/src/helpers/mapProperty";
import type { ListingCardProps } from "@/src/types/ListingCards";
import { Loader2 } from "lucide-react";
import { useDeposit } from "@/src/Hooks/solana/useDeposit";
import { hashString } from "@/src/helpers/crypto";
import { address as solanaAddress, type Address } from "@solana/kit";


export default function ProfilePage() {
  const { user, isRegistered, isLoading, logout } = useAuth();
  const { disconnect, wallet } = useWalletConnection();
  const router = useRouter();

  const address = wallet?.account?.address?.toString() ?? user?.wallet ?? "";
  const { balance, isLoading: loadingBalance } = useSolBalance(address);
  const { balance: usdcBalance, isLoading: loadingUsdc } = useTokenBalance(address);
  const { isRegistered: isOnChain, isLoading: loadingOnChain } = useUserOnChain(user?.pdaKey);
  const { deposit: depositOnChain, loading: depositLoading } = useDeposit();


  const [myProperties, setMyProperties] = useState<ListingCardProps[]>([]);
  const [loadingProps, setLoadingProps] = useState(false);

  useEffect(() => {
    if (!isLoading && !isRegistered) {
      router.push("/");
    }

    if (user?.isHost) {
      const fetchMyProps = async () => {
        setLoadingProps(true);
        try {
          const props = await propertyService.listPropertiesByUser(user.wallet);
          setMyProperties(props.map(mapBackendPropertyToListing));
        } catch (error) {
          console.error("Error fetching my properties:", error);
        } finally {
          setLoadingProps(false);
        }
      };
      fetchMyProps();
    }
  }, [isRegistered, isLoading, user?.wallet, user?.isHost, router]);
  const handleInitOnChain = async () => {
    if (!user) return;
    try {
      // 1. Initialize ATA and get some mock USDC (Backend helper)
      const res = await solanaService.initATA(user.wallet);
      const usdcMint = (res as any).mint;
      
      // 2. Hash DNI
      const dniHash = await hashString(user.dni);

      // 3. Deposit guarantee (On-chain)
      // For this example, we assume 100 USDC is the guarantee
      // The user needs an ATA. Usually backend mints to it in initATA.
      // We'll use a mocked amount based on typical platform config
      const depositAmount = 100_000_000n; // 100 USDC (6 decimals) assuming 100 USDC is configured
      
      await depositOnChain(
        dniHash,
        depositAmount,
        solanaAddress(address), // senderAddress
        usdcMint
      );


      window.location.reload(); 
    } catch (error) {
      console.error("Error initializing on-chain:", error);
      alert("Error al inicializar la cuenta en cadena. Verifica tu conexión.");
    }
  };


  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const handleLogout = () => {
    disconnect();
    logout();
    router.push("/");
  };

  const reviews = user.reviews ?? [];
  const avgRating = reviews.length
    ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length
    : user.reputation;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 pt-24 pb-16 max-w-2xl">
        {/* ── Header card ── */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden mb-6">
          <div className="relative h-24 gradient-solana opacity-60" />
          <div className="px-6 pb-6">
            <div className="flex items-end justify-between -mt-10 mb-4">
              {/* Avatar */}
              <div className="h-20 w-20 z-2 rounded-full border-4 border-card gradient-solana flex items-center justify-center shadow-glow">
                {user.image ? (
                  <img
                    src={user.image}
                    alt={user.firstName}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <User className="h-9 w-9 text-primary-foreground" />
                )}
              </div>

              <div className="flex items-center gap-2 mb-1">
                {user.isHost && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    <Shield className="h-3 w-3" />
                    Host
                  </span>
                )}
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-red-400 hover:border-red-400/50 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Disconnect
                </button>
              </div>
            </div>

            <h1 className="font-display text-2xl font-bold text-foreground">
              {user.firstName} {user.lastName}
            </h1>
            <p className="text-sm text-muted-foreground font-mono mt-0.5">
              {truncate(address)}
            </p>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="rounded-2xl border border-border bg-card px-4 py-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Star className="h-3.5 w-3.5 text-primary fill-primary" />
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Reputation
              </p>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-display text-xl font-bold text-gradient">
                {avgRating.toFixed(1)}
              </span>
              <span className="text-xs text-muted-foreground">/ 5.0</span>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card px-4 py-4">
            <div className="flex items-center gap-1.5 mb-2">
              <CalendarCheck className="h-3.5 w-3.5 text-foreground" />
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Bookings
              </p>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-display text-xl font-bold text-gradient">
                2
              </span>
              <span className="text-xs text-muted-foreground">active</span>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card px-4 py-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Wallet className="h-3.5 w-3.5 text-foreground" />
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Balance
              </p>
            </div>
            <div className="flex flex-col gap-1">
              {loadingBalance || loadingUsdc ? (
                <div className="h-6 w-16 rounded bg-muted/40 animate-pulse" />
              ) : (
                <>
                  <div className="flex items-baseline gap-1">
                    <span className="font-display text-xl font-bold text-gradient">
                      {balance !== null ? balance.toFixed(3) : "—"}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-semibold">SOL</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-display text-lg font-bold text-primary">
                      {usdcBalance !== null ? usdcBalance.toFixed(2) : "—"}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-semibold">USDC</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Info personal ── */}
        <div className="rounded-2xl border border-border bg-card p-5 mb-6">
          <h2 className="font-display text-sm font-bold text-foreground uppercase tracking-wider mb-4">
            Personal Info
          </h2>
          <div className="flex flex-col gap-3">
            {[
              { icon: Mail, label: "Email", value: user.email },
              { icon: Phone, label: "Phone", value: user.phone ?? "—" },
              { icon: Wallet, label: "Wallet", value: truncate(address) },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm text-foreground font-medium">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── On-Chain Status ── */}
        <div className="rounded-2xl border border-border bg-card p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-sm font-bold text-foreground uppercase tracking-wider">
              On-Chain Security
            </h2>
            {loadingOnChain ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : isOnChain ? (
              <div className="flex items-center gap-1 text-emerald-400">
                <Shield className="h-4 w-4" />
                <span className="text-[10px] font-bold uppercase">Verified</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-amber-400">
                <Shield className="h-4 w-4 opacity-50" />
                <span className="text-[10px] font-bold uppercase">Not Initialized</span>
              </div>
            )}
          </div>

          <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
            <p className="text-xs text-muted-foreground leading-relaxed mb-4">
              Your identity and property registrations are secured on the Solana blockchain. 
              {isOnChain 
                ? " Your account is already linked and verified on-chain." 
                : " You need to initialize your blockchain identity to enable secure transactions and property listings."}
            </p>
            
            {!isOnChain && (
              <button
                onClick={handleInitOnChain}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity shadow-glow"
              >
                Initialize Blockchain Profile
              </button>
            )}
            
            {isOnChain && (
              <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground bg-background/50 p-2 rounded-lg border border-border/30">
                <Wallet className="h-3 w-3" />
                <span className="truncate">{user.pdaKey}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── My Listings (Host only) ── */}
        {user.isHost && (
          <div className="rounded-2xl border border-border bg-card p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-sm font-bold text-foreground uppercase tracking-wider">
                My Properties
              </h2>
              <Link
                href="/listPropertys"
                className="text-xs text-primary hover:underline"
              >
                Create new →
              </Link>
            </div>
            
            {loadingProps ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : myProperties.length === 0 ? (
              <p className="text-sm text-muted-foreground italic text-center py-4">
                You haven&apos;t listed any properties yet.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {myProperties.map((prop) => (
                  <div
                    key={prop.id}
                    className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3 hover:border-primary/30 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {prop.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {prop.location}
                      </p>
                    </div>
                    <span className="font-display text-sm font-bold text-gradient shrink-0">
                      ${prop.price}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Bookings preview ── */}
        <div className="rounded-2xl border border-border bg-card p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-sm font-bold text-foreground uppercase tracking-wider">
              Active Bookings
            </h2>
            <Link
              href="/bookings"
              className="text-xs text-primary hover:underline"
            >
              View all →
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            {[
              {
                title: "Oceanfront Villa",
                location: "Bali, Indonesia",
                dates: "Apr 10–17",
                price: 595,
              },
              {
                title: "Alpine Retreat",
                location: "Zermatt, Switzerland",
                dates: "May 3–6",
                price: 360,
              },
            ].map((b) => (
              <div
                key={b.title}
                className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3 hover:border-primary/30 transition-colors"
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {b.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {b.location} · {b.dates}
                  </p>
                </div>
                <span className="font-display text-sm font-bold text-gradient shrink-0">
                  ${b.price}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Reviews ── */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-5">
            <MessageSquare className="h-4 w-4 text-primary" />
            <h2 className="font-display text-sm font-bold text-foreground uppercase tracking-wider">
              Reviews
            </h2>
            <span className="ml-auto text-xs text-muted-foreground">
              {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
            </span>
          </div>

          {reviews.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <MessageSquare className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No reviews yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── ReviewCard ────────────────────────────────────────────────────────────────
const ReviewCard = ({ review }: { review: Review }) => (
  <div className="rounded-xl border border-border bg-background p-4">
    <div className="flex items-start justify-between gap-3 mb-3">
      <div className="flex items-center gap-2.5">
        {/* Avatar placeholder */}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full gradient-solana">
          <User className="h-4 w-4 text-primary-foreground" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            {review.author}
          </p>
          <p className="text-xs text-muted-foreground">{review.date}</p>
        </div>
      </div>

      {/* Stars */}
      <div className="flex items-center gap-0.5 shrink-0">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-3.5 w-3.5 ${
              i < review.rating ? "fill-primary text-primary" : "text-border"
            }`}
          />
        ))}
      </div>
    </div>

    <p className="text-sm text-muted-foreground leading-relaxed">
      {review.comment}
    </p>
  </div>
);
