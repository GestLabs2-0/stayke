//Own Components
import { listings } from "@/src/constants";
import { ListingCard } from "./ListingCard";

export const ShowLocaleCards = () => {
  return (
    <>
      {listings.map((listing, i) => (
        <ListingCard key={listing.title} {...listing} index={i} />
      ))}
    </>
  );
};
