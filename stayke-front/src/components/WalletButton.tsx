"use client";

//Library
import { Wallet, Copy, LogOut, ChevronDown } from "lucide-react";
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

  if (!wallet?.account) {
    return (
      <button
        onClick={onOpenModal}
        className="inline-flex items-center gap-2 gradient-solana text-primary-foreground text-sm font-semibold px-4 py-[9.2px] rounded-md shadow-glow transition-opacity hover:opacity-90 cursor-pointer"
      >
        <Wallet className="h-5 w-7.25" />
        Connect Wallet
      </button>
    );
  }

  const address = wallet?.account.address.toString();

  return (
    <div className="relative">
      <button
        onClick={() => setDropdownOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary"
      >
        <div className="h-2 w-2 rounded-full gradient-solana" />
        <Wallet className="w-5 h-5" />
        {truncate(address)}
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl border border-border bg-card p-1 shadow-card z-50">
          <button
            onClick={() => {
              navigator.clipboard.writeText(address);
              setDropdownOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Copy className="h-3.5 w-3.5" />
            Copy address
          </button>
          <button
            onClick={() => {
              disconnect();
              setDropdownOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-muted transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
};
