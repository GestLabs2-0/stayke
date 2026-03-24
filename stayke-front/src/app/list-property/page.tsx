"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/Context/AuthContext";
import { propertyService } from "@/src/services/propertyService";
import { Shield, MapPin, DollarSign, Type, AlignLeft, Loader2, Check } from "lucide-react";
import Link from "next/link";
import { handleApiError } from "@/src/helpers/apiError";
import { useProperty } from "@/src/Hooks/solana/useProperty";
import { fetchUserProfileAccount } from "@/src/client/fetchers";
import { getPdaProperty } from "@/src/client/pdas";


export default function ListPropertyPage() {
  const { user, isRegistered } = useAuth();
  const router = useRouter();
  const { publishProperty } = useProperty();
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    pricePerNight: 0,
  });


  if (!isRegistered || !user?.isHost) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center">
          <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
          <p className="text-muted-foreground mt-2">You must be a registered Host to list properties.</p>
          <Link href="/" className="mt-6 inline-block text-primary hover:underline">Return to Home</Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.pdaKey) {
      alert("Please initialize your blockchain profile first.");
      return;
    }
    setSubmitting(true);

    try {
      // 1. Fetch current profile to get listingCount
      const profileInfo = await fetchUserProfileAccount(user.pdaKey);
      const listingId = profileInfo.data.listingCount;

      // 2. Publish on-chain
      await publishProperty(
        user.pdaKey,
        listingId,
        BigInt(form.pricePerNight)
      );

      // 3. Derive Property PDA for backend
      const [propertyPda] = await getPdaProperty(user.pdaKey, listingId);
      const propertyPdaKey = propertyPda.toString();

      // 4. Register off-chain
      await propertyService.createProperty({
        ...form,
        pdaKey: propertyPdaKey,
        ownerWallet: user.wallet,
      });

      router.push("/profile");
    } catch (error) {
      handleApiError(error, "List Property");
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="container mx-auto px-6 max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="font-display text-4xl font-bold text-foreground">
            List Your <span className="text-gradient">Property</span>
          </h1>
          <p className="mt-2 text-muted-foreground">
            Share your space with the Stayke community and earn USDC.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="mb-2 text-sm font-medium text-foreground flex items-center gap-2">
                <Type className="h-4 w-4 text-primary" />
                Property Title
              </label>
              <input
                required
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Modern Beachfront Villa"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-hidden transition-all"
              />
            </div>

            {/* Description */}
            <div>
              <label className="mb-2 text-sm font-medium text-foreground flex items-center gap-2">
                <AlignLeft className="h-4 w-4 text-primary" />
                Description
              </label>
              <textarea
                required
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe your property, amenities, and surroundings..."
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-hidden transition-all resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Location */}
              <div>
                <label className="mb-2 text-sm font-medium text-foreground flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Location
                </label>
                <input
                  required
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="City, Country"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-hidden transition-all"
                />
              </div>

              {/* Price */}
              <div>
                <label className="mb-2 text-sm font-medium text-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  Price per Night (USDC)
                </label>
                <input
                  required
                  type="number"
                  min="1"
                  value={form.pricePerNight || ""}
                  onChange={(e) => setForm({ ...form, pricePerNight: Number(e.target.value) })}
                  placeholder="100"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground focus:border-primary focus:outline-hidden transition-all"
                />
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground italic">
                A unique Property PDA will be derived from your host profile.
              </p>
            </div>

          </div>

          <div className="mt-8 flex gap-3">
            <Link
              href="/profile"
              className="flex-1 text-center rounded-xl border border-border py-3 text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </Link>
            <button
              disabled={submitting}
              type="submit"
              className="flex-3 inline-flex items-center justify-center gap-2 gradient-solana rounded-xl py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Listing...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  List Property
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
