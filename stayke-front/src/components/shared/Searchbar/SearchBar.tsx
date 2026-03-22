"use client";

//Library
import { Search, MapPin, CalendarDays, Users } from "lucide-react";
//React
import { useState } from "react";
//Next
import Link from "next/link";

export const SearchBar = () => {
  const [destination, setDestination] = useState("");

  return (
    <div className="w-full flex justify-center px-4 mt-12">
      <div className="w-full max-w-4xl rounded-2xl border border-border bg-card/80 p-2 shadow-card backdrop-blur-xl">
        <div className="flex flex-col gap-2 md:grid md:grid-cols-3">
          {/* Where */}
          <div className="flex items-center gap-3 rounded-xl bg-muted/50 px-4 py-3">
            <MapPin className="h-5 w-5 shrink-0 text-primary" />
            <div className="flex-1">
              <p className="text-xs font-medium text-muted-foreground">Where</p>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Search destinations"
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>
          </div>

          {/* Check in */}
          <div className="flex items-center gap-3 rounded-xl bg-muted/50 px-4 py-3">
            <CalendarDays className="h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Check in
              </p>
              <p className="text-sm text-muted-foreground">Add dates</p>
            </div>
          </div>

          {/* Guests */}
          <div className="flex items-center gap-3 rounded-xl bg-muted/50 px-4 py-3">
            <Users className="h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Guests
              </p>
              <p className="text-sm text-muted-foreground">Add guests</p>
            </div>
          </div>

          {/* Search button */}
          {/* <Link
            href={`/explore${destination ? `?q=${destination}` : ""}`}
            className="flex items-center justify-center gap-2 rounded-xl gradient-solana text-base font-semibold text-primary-foreground shadow-glow px-4 py-3 transition-opacity hover:opacity-90"
          >
            <Search className="h-5 w-5" />
            Search
          </Link> */}
        </div>
      </div>
    </div>
  );
};
