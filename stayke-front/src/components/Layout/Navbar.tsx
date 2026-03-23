"use client";

//Library
import {
  Menu,
  X,
  Shield,
  User,
  PlusSquare,
  LogOut,
  ChevronDown,
  CalendarCheck,
  Star,
  Copy,
  Check,
} from "lucide-react";
import { useWalletConnection } from "@solana/react-hooks";

//Next
import Link from "next/link";
import { useRouter } from "next/navigation";

//React
import { useState } from "react";
//Own Components
import { WalletButton } from "../WalletButton";
import { PhantomModal } from "./Modal/PhantomModal";
import { navLinks } from "@/src/constants";
import { useAuth } from "@/src/Context/AuthContext";
import { useSolBalance } from "@/src/Hooks/useSolanaBalance";
import { useTokenBalance } from "@/src/Hooks/useTokenBalance";

const UserMenu = () => {
  const { user, logout } = useAuth();
  const { disconnect, wallet } = useWalletConnection();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const address = wallet?.account?.address?.toString() ?? "";
  const { balance, isLoading: loadingBalance } = useSolBalance(address);
  const { balance: usdcBalance, isLoading: loadingUsdc } =
    useTokenBalance(address);

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => {
    disconnect();
    logout();
    setOpen(false);
    router.push("/");
  };

  return (
    <div className="relative">
      {/* ── Trigger ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:border-primary hover:shadow-glow transition-all duration-200"
      >
        <div className="relative flex h-7 w-7 items-center justify-center rounded-full gradient-solana shrink-0">
          <User className="h-3.5 w-3.5 text-primary-foreground" />
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-card" />
        </div>
        <span className="max-w-20 truncate">{user?.firstName}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 mt-2.5 w-72 rounded-2xl border border-border bg-card shadow-card z-50 overflow-hidden">
          {/* ── Wallet banner ── */}
          <div className="relative overflow-hidden px-4 pt-4 pb-5">
            {/* Fondo decorativo */}
            <div className="absolute inset-0 gradient-solana opacity-10" />
            <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
            <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-secondary/10 blur-xl" />

            {/* Contenido */}
            <div className="relative">
              {/* Top: Phantom pill + copy */}
              <div className="flex items-center justify-between mb-4">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-background/60 backdrop-blur-sm px-2.5 py-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span className="text-xs font-medium text-foreground">
                    Phantom
                  </span>
                </div>

                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-background/60 backdrop-blur-sm px-2.5 py-1 text-xs text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      {address.slice(0, 4)}…{address.slice(-4)}
                    </>
                  )}
                </button>
              </div>

              {/* Balance */}
              {/* //TODO:Fetch getBalance() */}
              <div>
                <p className="text-xs text-muted-foreground mb-1 tracking-wider uppercase">
                  Balance
                </p>
                <div className="flex items-baseline gap-2">
                  {loadingBalance || loadingUsdc ? (
                    <div className="h-8 w-24 rounded-lg bg-muted/40 animate-pulse" />
                  ) : (
                    <div className="flex flex-col">
                      <div className="flex items-baseline gap-2">
                        <span className="font-display text-2xl font-bold text-foreground">
                          {balance !== null ? balance.toFixed(4) : "—"}
                        </span>
                        <span className="text-xs font-medium text-muted-foreground uppercase">
                          SOL
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="font-display text-xl font-bold text-primary">
                          {usdcBalance !== null ? usdcBalance.toFixed(2) : "—"}
                        </span>
                        <span className="text-xs font-medium text-muted-foreground uppercase">
                          USDC
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Stats row ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 divide-x divide-border border-b border-border">
            <div className="px-4 py-3">
              <p className="text-xs text-muted-foreground mb-1">Reputation</p>
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                <span className="text-sm font-bold text-foreground">
                  {user?.reputation ?? "—"}
                </span>
                <span className="text-xs text-muted-foreground">/ 5.0</span>
              </div>
            </div>
            <div className="px-4 py-3">
              <p className="text-xs text-muted-foreground mb-1">Role</p>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold  
                  
                  ${
                    user?.isHost
                      ? "bg-primary/10 text-primary"
                      : "bg-primary/20 text-white"
                  }`}
              >
                <div className="h-2 w-2 rounded-full bg-emerald-400 mr-2" />
                {user?.isHost ? "Host" : "Client"}
              </span>
            </div>
          </div>

          <div className="p-1.5">
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <User className="h-4 w-4 shrink-0" />
              My Profile
            </Link>

            <Link
              href="/bookings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <CalendarCheck className="h-4 w-4 shrink-0" />
              My Bookings
            </Link>

            {user?.isHost && (
              <Link
                href="/list-property"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <PlusSquare className="h-4 w-4 shrink-0" />
                Add Property
              </Link>
            )}

            <div className="my-1 border-t border-border" />

            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const { isRegistered } = useAuth();

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl transition-all duration-300">
        <div className="container mx-auto flex items-center justify-between xl:px-[10%] px-6 py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg gradient-solana flex items-center justify-center">
              <Shield className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">
              Stay<span className="text-gradient">ke</span>
            </span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Desktop Actions — wallet o perfil */}
          <div className="hidden items-center gap-3 md:flex">
            {isRegistered ? (
              <UserMenu />
            ) : (
              <WalletButton onOpenModal={() => setShowModal(true)} />
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            className="text-foreground md:hidden"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out md:hidden ${
            isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="border-t border-border bg-background px-6 py-4 flex flex-col gap-4">
            {navLinks.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-border">
              {isRegistered ? (
                <Link
                  href="/profile"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <User className="h-4 w-4" />
                  My Profile
                </Link>
              ) : (
                <WalletButton
                  onOpenModal={() => {
                    setShowModal(true);
                    setIsOpen(false);
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </nav>

      {showModal && <PhantomModal onClose={() => setShowModal(false)} />}
    </>
  );
};
