"use client";

//Library
import { Wallet, Copy, LogOut, ChevronDown, RefreshCw } from "lucide-react";
import { useWalletConnection } from "@solana/react-hooks";
//React
import { useState } from "react";
//Helpers
import { truncate } from "../helpers/Truncate";
//Types
import { WalletButtonProps } from "../types/WalletButton";

export const WalletButton = ({ onOpenModal }: WalletButtonProps) => {
  const { disconnect, wallet } = useWalletConnection();
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [copied, setCopied] = useState(false);

  if (!wallet?.account) {
    return (
      <button
        onClick={onOpenModal}
        className="inline-flex items-center gap-2 gradient-solana text-primary-foreground text-sm font-semibold px-4 py-[9.2px] rounded-md shadow-glow transition-opacity hover:opacity-90 cursor-pointer"
      >
        <Wallet className="h-4 w-4" />
        Connect Wallet
      </button>
    );
  }

  const address = wallet.account.address.toString();

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setDropdownOpen(false);
    setTimeout(() => setCopied(false), 2000);
  };

  // Switch wallet: desconecta la actual y abre el modal para conectar otra
  const handleSwitch = async () => {
    setDropdownOpen(false);
    const phantom = (window as any)?.phantom?.solana;
    if (!phantom) return;

    // Desconecta la sesión actual y vuelve a conectar
    // Phantom abre su popup con todas las cuentas disponibles
    await phantom.disconnect();
    await phantom.connect();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setDropdownOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-all hover:border-primary"
      >
        <div className="relative flex h-5 w-5 items-center justify-center">
          <div className="h-2 w-2 rounded-full bg-emerald-400" />
        </div>
        <Wallet className="w-4 h-4 text-muted-foreground" />
        <span className="font-mono text-xs">{truncate(address)}</span>
        <ChevronDown
          className={`h-3 w-3 text-muted-foreground transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
        />
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-border bg-card p-1.5 shadow-card z-50 overflow-hidden">
          {/* Address pill */}
          <div className="px-3 py-2 mb-1">
            <p className="text-xs text-muted-foreground mb-1">Connected</p>
            <p className="text-xs font-mono text-foreground">
              {address.slice(0, 8)}…{address.slice(-6)}
            </p>
          </div>

          <div className="border-t border-border mb-1" />

          {/* Copy */}
          <button
            onClick={handleCopy}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-muted">
              <Copy className="h-3.5 w-3.5" />
            </div>
            {copied ? "Copied!" : "Copy address"}
          </button>

          {/* Switch wallet */}
          <button
            onClick={handleSwitch}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-muted">
              <RefreshCw className="h-3.5 w-3.5" />
            </div>
            <div className="flex flex-col items-start">
              <span>Switch Wallet</span>
            </div>
          </button>

          <span className="text-xs text-green-500 pl-4">
            Change account in Phantom
          </span>
          <div className="border-t border-border my-1" />

          {/* Disconnect */}
          <button
            onClick={() => {
              disconnect();
              setDropdownOpen(false);
            }}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-red-500/10">
              <LogOut className="h-3.5 w-3.5" />
            </div>
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
};
