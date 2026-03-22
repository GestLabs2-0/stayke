"use client";
//Library

import { Star, Heart, Shield } from "lucide-react";
//Next
import Image from "next/image";
//Types
import { ListingCardProps } from "@/src/types/ListingCards";

//Next
import Link from "next/link";

export const ListingCard = ({
  image,
  title,
  location,
  price,
  rating,
  reviews,
  id,
}: ListingCardProps) => {
  return (
    <Link
      href={`/listing/${id}`}
      className="group cursor-pointer flex flex-col"
    >
      <div className="flex flex-col flex-1 overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all duration-300 hover:border-primary/30 hover:shadow-glow">
        {/* Image */}
        <div className="relative aspect-4/3 overflow-hidden">
          <Image
            fill
            src={image}
            alt={title}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <button
            onClick={(e) => e.preventDefault()} // evita navegar al dar like
            className="absolute right-3 top-3 rounded-full bg-background/60 p-2 backdrop-blur-sm transition-colors hover:bg-background/80"
          >
            <Heart className="h-4 w-4 text-foreground" />
          </button>
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-primary/90 px-3 py-1 text-xs font-semibold text-primary-foreground backdrop-blur-sm">
            <Shield className="h-3 w-3" />
            Staked Host
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-4">
          <div className="flex items-start justify-between flex-1">
            <div>
              <h3 className="font-display font-semibold text-foreground">
                {title}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">{location}</p>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-primary text-primary" />
              <span className="text-sm font-medium text-foreground">
                {rating}
              </span>
              <span className="text-sm text-muted-foreground">({reviews})</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1 border-t border-border pt-3">
            <span className="font-display text-lg font-bold text-gradient">
              ${price} USD
            </span>
            <span className="text-sm text-muted-foreground">/ night</span>
          </div>
        </div>
      </div>
    </Link>
  );
};
