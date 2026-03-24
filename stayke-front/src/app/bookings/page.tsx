"use client";

import { useAuth } from "@/src/Context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  CalendarCheck,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  Star as StarIcon,
} from "lucide-react";
import Link from "next/link";
import { useBooking } from "@/src/Hooks/solana/useBooking";
import { handleApiError } from "@/src/helpers/apiError";


// ── Types ─────────────────────────────────────────────────────────────────────
type BookingStatus = "active" | "completed" | "cancelled";

interface Booking {
  id: string;
  listingId: string;
  title: string;
  location: string;
  dates: string;
  nights: number;
  price: number;
  status: BookingStatus;
  image: string;
}

// ── Mock data — reemplaza con fetch real ──────────────────────────────────────
const MOCK_BOOKINGS: Booking[] = [
  {
    id: "1",
    listingId: "oceanfront-villa-bali",
    title: "Oceanfront Villa",
    location: "Bali, Indonesia",
    dates: "Apr 10 – Apr 17, 2026",
    nights: 7,
    price: 595,
    status: "active",
    image: "/listing-1.jpg",
  },
  {
    id: "2",
    listingId: "alpine-retreat-zermatt",
    title: "Alpine Retreat",
    location: "Zermatt, Switzerland",
    dates: "May 3 – May 6, 2026",
    nights: 3,
    price: 360,
    status: "active",
    image: "/listing-2.jpg",
  },
  {
    id: "3",
    listingId: "industrial-loft-brooklyn",
    title: "Industrial Loft",
    location: "Brooklyn, New York",
    dates: "Feb 1 – Feb 5, 2026",
    nights: 4,
    price: 260,
    status: "completed",
    image: "/listing-3.jpg",
  },
  {
    id: "4",
    listingId: "jungle-treehouse-tulum",
    title: "Jungle Treehouse",
    location: "Tulum, Mexico",
    dates: "Jan 15 – Jan 18, 2026",
    nights: 3,
    price: 165,
    status: "cancelled",
    image: "/listing-4.jpg",
  },
];

const STATUS_CONFIG: Record<
  BookingStatus,
  { label: string; color: string; icon: typeof CheckCircle2 }
> = {
  active: {
    label: "Active",
    color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    icon: Clock,
  },
  completed: {
    label: "Completed",
    color: "text-primary bg-primary/10 border-primary/20",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Cancelled",
    color: "text-red-400 bg-red-400/10 border-red-400/20",
    icon: XCircle,
  },
};

export default function BookingsPage() {
  const { isRegistered, isLoading } = useAuth();
  const router = useRouter();

  // ── Ruta protegida ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoading && !isRegistered) router.push("/");
  }, [isRegistered, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const active = MOCK_BOOKINGS.filter((b) => b.status === "active");
  const past = MOCK_BOOKINGS.filter((b) => b.status !== "active");

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 pt-24 pb-16 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              My <span className="text-gradient">Bookings</span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {active.length} active · {past.length} past
            </p>
          </div>
          <Link
            href="#"
            className="inline-flex items-center gap-2 gradient-solana rounded-xl px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90 transition-opacity"
          >
            Explore Stays
          </Link>
        </div>

        {/* Active */}
        {active.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Active
            </h2>
            <div className="flex flex-col gap-3">
              {active.map((b) => (
                <BookingCard key={b.id} booking={b} />
              ))}
            </div>
          </div>
        )}

        {/* Past */}
        {past.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Past
            </h2>
            <div className="flex flex-col gap-3">
              {past.map((b) => (
                <BookingCard key={b.id} booking={b} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── BookingCard ───────────────────────────────────────────────────────────────
const BookingCard = ({ booking }: { booking: Booking }) => {
  const { label, color, icon: Icon } = STATUS_CONFIG[booking.status];
  const { user } = useAuth();
  const { 
    activateBooking, 
    completeStay, 
    closeBooking, 
    loading: bookingLoading 
  } = useBooking();

  const handleActivate = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user?.pdaKey) return;
    try {
      // Mocked data for demo
      const propertyPda = "property_pda_mock";
      const usdcMint = "usdc_mint_mock";
      const clientTokenAccount = "client_ata_mock";
      
      await activateBooking(user.pdaKey, propertyPda, booking.id, usdcMint, clientTokenAccount);
      alert("Booking activated on-chain!");
    } catch (err) {
      handleApiError(err, "Activate Booking");
    }
  };

  const handleComplete = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user?.pdaKey) return;
    try {
      const hostProfilePda = "host_pda_mock";
      const propertyPda = "property_pda_mock";
      const hostTokenAccount = "host_ata_mock";
      const usdcMint = "usdc_mint_mock";

      await completeStay(user.pdaKey, hostProfilePda, propertyPda, booking.id, hostTokenAccount, usdcMint);
      alert("Stay completed and funds released!");
    } catch (err) {
      handleApiError(err, "Complete Stay");
    }
  };

  return (
    <div className="group relative">
      <Link
        href={`/listing/${booking.listingId}`}
        className="flex items-center gap-4 rounded-2xl border border-border bg-card px-4 py-4 hover:border-primary/30 transition-colors"
      >
        {/* Imagen */}
        <div
          className="h-14 w-14 shrink-0 rounded-xl bg-muted bg-cover bg-center transition-transform group-hover:scale-105"
          style={{ backgroundImage: `url(${booking.image})` }}
        />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              {booking.title}
            </p>
            <span
              className={`inline-flex items-center gap-1 shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${color}`}
            >
              <Icon className="h-3 w-3" />
              {label}
            </span>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
            <p className="text-xs text-muted-foreground truncate">
              {booking.location}
            </p>
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <div className="flex items-center gap-1">
              <CalendarCheck className="h-3 w-3 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">{booking.dates}</p>
            </div>
            <span className="font-display text-sm font-bold text-gradient">
              ${booking.price} USD
            </span>
          </div>

          {/* Action Buttons (Visible on hover or based on status) */}
          <div className="mt-4 flex gap-2 border-t border-border/50 pt-3">
            {booking.status === "active" && (
              <>
                <button 
                  onClick={handleActivate}
                  disabled={bookingLoading}
                  className="flex-1 rounded-lg bg-primary/10 border border-primary/20 py-2 text-[10px] font-bold uppercase tracking-wider text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
                >
                  Activate (Pay)
                </button>
                <button 
                  onClick={handleComplete}
                  disabled={bookingLoading}
                  className="flex-1 rounded-lg bg-emerald-400/10 border border-emerald-400/20 py-2 text-[10px] font-bold uppercase tracking-wider text-emerald-400 hover:bg-emerald-400/20 transition-colors disabled:opacity-50"
                >
                  Complete Stay
                </button>
              </>
            )}
            
            {booking.status === "completed" && (
              <button 
                disabled={bookingLoading}
                className="flex-1 rounded-lg bg-amber-400/10 border border-amber-400/20 py-2 text-[10px] font-bold uppercase tracking-wider text-amber-400 hover:bg-amber-400/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
              >
                <StarIcon className="h-3 w-3 fill-amber-400" />
                Rate Experience
              </button>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

