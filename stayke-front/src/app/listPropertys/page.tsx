//Own Components
import { listings } from "@/src/constants";
import { ListingCard } from "@/src/components/LocaleSection/ListingCard";

const ListPropertys = () => {
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

        {/* Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing, i) => (
            <ListingCard key={listing.id} {...listing} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ListPropertys;
