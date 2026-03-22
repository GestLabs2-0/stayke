"use client";

//Librarys
import { useWalletConnection } from "@solana/react-hooks";
import { Wallet, X, AlertCircle, Loader2 } from "lucide-react";
//React
import { useState, useEffect, useRef } from "react";
//Next
import Image from "next/image";
import Link from "next/link";
//Router
import { useRouter } from "next/navigation";
//Context
import { useAuth } from "@/src/Context/AuthContext";
//Types
import {
  PhantomModalProps,
  StatusWalletPhantom,
} from "@/src/types/PhantomModal";

export const PhantomModal = ({ onClose }: PhantomModalProps) => {
  const { connectors, connect } = useWalletConnection();
  const [status, setStatus] = useState<StatusWalletPhantom>("idle");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { login } = useAuth();
  const router = useRouter();

  const phantomWallet = connectors.find(
    (c) => c.name.toLowerCase() === "phantom"
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleConnect = async () => {
    if (!phantomWallet || status === "connecting") return;

    setStatus("connecting");

    const didTimeout = { value: false };
    timeoutRef.current = setTimeout(() => {
      didTimeout.value = true;
      setStatus("error");
    }, 10000);

    try {
      await connect(phantomWallet.id);

      if (didTimeout.value) return;
      clearTimeout(timeoutRef.current!);

      // ── Verifica si está registrado ───────────────────────────────────
      const address = (window as any)?.phantom?.solana?.publicKey?.toString();
      const { registered } = await login(address ?? "", "", "");
      console.log("registered:", registered);

      onClose();

      if (!registered) {
        router.push("/register");
      }
    } catch {
      if (!didTimeout.value) {
        clearTimeout(timeoutRef.current!);
        setStatus("error");
      }
    }
  };

  const handleRetry = () => setStatus("idle");

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-card mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-5 w-5 cursor-pointer hover:text-primary" />
        </button>

        <div className="mb-6 text-center">
          <h2 className="font-display text-lg font-bold text-foreground">
            Connect Wallet
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Connect your Phantom wallet to continue
          </p>
        </div>

        {status === "error" && (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
            <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-400">
                Connection failed
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Couldn't connect to Phantom. Make sure your wallet is unlocked
                and try again.
              </p>
            </div>
          </div>
        )}

        {phantomWallet ? (
          <button
            onClick={status === "error" ? handleRetry : handleConnect}
            disabled={status === "connecting"}
            className="flex w-full items-center gap-4 rounded-xl border border-border bg-background px-4 py-3 transition-all hover:border-primary hover:shadow-glow disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <div className="relative h-9 w-9 shrink-0">
              <Image
                width={36}
                height={36}
                src="/Phantom.svg"
                alt="Phantom"
                className="h-9 w-9 rounded-lg"
              />
              {status === "connecting" && (
                <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/70">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              )}
            </div>

            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-foreground">Phantom</p>
              <p className="text-xs text-muted-foreground">
                {status === "connecting"
                  ? "Waiting for approval…"
                  : status === "error"
                    ? "Tap to try again"
                    : "Solana wallet"}
              </p>
            </div>

            {status === "idle" && (
              <div className="h-2 w-2 rounded-full bg-emerald-400" />
            )}
            {status === "connecting" && (
              <span className="text-xs text-muted-foreground tabular-nums">
                <CountDown seconds={10} onComplete={() => {}} />
              </span>
            )}
            {status === "error" && (
              <span className="text-xs font-medium text-red-400">Retry</span>
            )}
          </button>
        ) : (
          <a
            href="https://phantom.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Wallet className="h-4 w-4" />
            Install Phantom
          </a>
        )}

        <p className="mt-4 text-center text-xs text-muted-foreground">
          By connecting you agree to our{" "}
          <Link href="/terms" className="underline hover:text-primary">
            Terms of Service
          </Link>
        </p>
      </div>
    </div>
  );
};

const CountDown = ({
  seconds,
  onComplete,
}: {
  seconds: number;
  onComplete: () => void;
}) => {
  const [count, setCount] = useState(seconds);
  useEffect(() => {
    if (count <= 0) {
      onComplete();
      return;
    }
    const t = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [count, onComplete]);
  return <>{count}s</>;
};
