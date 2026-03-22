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

const UserMenu = () => {
  const { user, logout } = useAuth();
  const { disconnect } = useWalletConnection();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleLogout = () => {
    disconnect();
    logout();
    setOpen(false);
    router.push("/");
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:border-primary transition-colors"
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-full gradient-solana shrink-0">
          <User className="h-3.5 w-3.5 text-primary-foreground" />
        </div>
        <span>{user?.firstName}</span>
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-52 rounded-xl border border-border bg-card p-1 shadow-card z-50">
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <User className="h-3.5 w-3.5" />
            My Profile
          </Link>

          {user?.isHost && (
            <Link
              href="/listPropertys"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <PlusSquare className="h-3.5 w-3.5" />
              List Property
            </Link>
          )}

          <div className="my-1 border-t border-border" />

          <button
            onClick={handleLogout}
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
