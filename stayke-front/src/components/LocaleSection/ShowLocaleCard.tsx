"use client";
import { useEffect, useState } from "react";
import { propertyService } from "@/src/services/propertyService";
import { mapBackendPropertyToListing } from "@/src/helpers/mapProperty";
import { ListingCard } from "./ListingCard";
import type { ListingCardProps } from "@/src/types/ListingCards";
import { Loader2 } from "lucide-react";

export const ShowLocaleCards = () => {
  const [listings, setListings] = useState<ListingCardProps[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProps = async () => {
      try {
        const backendProps = await propertyService.listAllProperties();
        // Limitamos a unas pocas para la home
        setListings(backendProps.slice(0, 6).map(mapBackendPropertyToListing));
      } catch (error) {
        console.error("Error fetching homepage properties:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProps();
  }, []);

  if (loading) {
    return (
      <div className="col-span-full flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="col-span-full py-12 text-center text-muted-foreground italic">
        No properties found.
      </div>
    );
  }

  return (
    <>
      {listings.map((listing, i) => (
        <ListingCard key={listing.id} {...listing} index={i} />
      ))}
    </>
  );
};
