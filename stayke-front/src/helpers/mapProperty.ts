import type { BackendProperty } from "@/src/types/api";
import type { ListingCardProps } from "@/src/types/ListingCards";

/**
 * Adapta el modelo de propiedad del backend al modelo usado en las tarjetas del frontend.
 */
export const mapBackendPropertyToListing = (
  prop: BackendProperty
): ListingCardProps => ({
  id: prop.id.toString(),
  image: "/listing-1.jpg", // Placeholder hasta que el backend maneje imágenes
  title: prop.title,
  location: prop.location,
  price: prop.pricePerNight,
  rating: 5.0, // Mock hasta tener sistema de reputación
  reviews: 0,  // Mock hasta tener sistema de reviews
  description: prop.description ?? "",
});
