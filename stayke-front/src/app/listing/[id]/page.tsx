//Library
import { Star, Shield, MapPin, ArrowLeft, Calendar } from "lucide-react";
//Next
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
//Own Components
import { listings } from "../../../constants";

interface Props {
  params: Promise<{ id: string }>;
}

const ListingPage = async ({ params }: Props) => {
  const { id } = await params;
  const listing = listings.find((l) => l.id === id);

  if (!listing) notFound();

  return (
    <div className="min-h-screen bg-background">
      {/* Back */}
      <div className="container mx-auto px-6 pt-24 pb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to listings
        </Link>
      </div>

      <div className="container mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-start">
          {/* ── Imagen ── */}
          <div className="relative aspect-4/3 overflow-hidden rounded-2xl border border-border shadow-card">
            <Image
              src={listing.image}
              alt={listing.title}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
            <div className="absolute bottom-4 left-4 flex items-center gap-1.5 rounded-full bg-primary/90 px-3 py-1.5 text-xs font-semibold text-primary-foreground backdrop-blur-sm">
              <Shield className="h-3 w-3" />
              Staked Host
            </div>
          </div>

          {/* ── Info ── */}
          <div className="flex flex-col gap-6">
            {/* Title + location */}
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
                {listing.title}
              </h1>
              <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                {listing.location}
              </div>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-xl border border-border bg-card px-3 py-2">
                <Star className="h-4 w-4 fill-primary text-primary" />
                <span className="text-sm font-bold text-foreground">
                  {listing.rating}
                </span>
                <span className="text-sm text-muted-foreground">/ 5.0</span>
              </div>
              <span className="text-sm text-muted-foreground">
                Based on{" "}
                <span className="font-medium text-foreground">
                  {listing.reviews} reviews
                </span>
              </span>
            </div>

            {/* Description */}
            <div className="rounded-xl border border-border bg-card/50 p-4">
              <p className="text-sm leading-relaxed text-muted-foreground">
                {listing.description}
              </p>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-1">
              <span className="font-display text-3xl font-bold text-gradient">
                ${listing.price} USD
              </span>
              <span className="text-sm text-muted-foreground">/ night</span>
            </div>

            {/* CTA */}
            <button className="inline-flex items-center justify-center gap-2 gradient-solana rounded-xl px-6 py-3.5 text-base font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90 cursor-pointer">
              <Calendar className="h-5 w-5" />
              Reserve Now
            </button>

            {/* Trust note */}
            <p className="text-center text-xs text-muted-foreground">
              <span className="text-primary font-medium">
                Secured by staking
              </span>{" "}
              — your deposit earns rewards while guaranteeing your booking.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export function generateStaticParams() {
  return listings.map((l) => ({ id: l.id }));
}

export default ListingPage;
