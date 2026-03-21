"use client";

//Librarys
import { Menu, X, Shield } from "lucide-react";
//React
import { useState } from "react";
//Next
import Link from "next/link";

//Own Components
import { WalletButton } from "../WalletButton";
import { PhantomModal } from "./Modal/PhantomModal";
import { navLinks } from "@/src/constants";

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);

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

          {/* Desktop Actions */}
          <div className="hidden items-center gap-3 md:flex">
            <WalletButton onOpenModal={() => setShowModal(true)} />
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
            {/* Wallet en mobile */}
            <WalletButton
              onOpenModal={() => {
                setShowModal(true);
                setIsOpen(false);
              }}
            />
          </div>
        </div>
      </nav>

      {/* Modal */}
      {showModal && <PhantomModal onClose={() => setShowModal(false)} />}
    </>
  );
};
