"use client";
import { useEffect, useState } from "react";
import { propertyService } from "@/src/services/propertyService";
import { mapBackendPropertyToListing } from "@/src/helpers/mapProperty";
import { ListingCard } from "@/src/components/LocaleSection/ListingCard";
import type { ListingCardProps } from "@/src/types/ListingCards";
import { Loader2 } from "lucide-react";

const ListPropertys = () => {
  const [listings, setListings] = useState<ListingCardProps[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const backendProps = await propertyService.listAllProperties();
        setListings(backendProps.map(mapBackendPropertyToListing));
      } catch (error) {
        console.error("Error fetching properties:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 pt-24 pb-16">
        {/* Header */}
        <div className="mb-10">
          <h1 className="font-display text-4xl font-bold text-foreground sm:text-5xl">
            Explore <span className="text-gradient">Stays</span>
          </h1>
          <p className="mt-3 text-muted-foreground mb-2">
            Discover top-rated properties accepting{" "}
            <span className="text-foreground font-medium">USDC payments</span>{" "}
            on Solana
          </p>
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : (
          /* Grid */
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {listings.length > 0 ? (
              listings.map((listing, i) => (
                <ListingCard key={listing.id} {...listing} index={i} />
              ))
            ) : (
              <div className="col-span-full py-20 text-center">
                <p className="text-muted-foreground italic">No stays available right now. Check back later!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ListPropertys;
