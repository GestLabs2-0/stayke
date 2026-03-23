//Library
import { MapPin, Shield, User } from "lucide-react";

/*Stats Value*/

export const stats = [
  { value: "12K+", label: "Properties" },
  { value: "$2.4M", label: "Staked Value" },
  { value: "89", label: "Countries" },
  { value: "8.2%", label: "Avg APY" },
];

/* Listing Cards */

export const listings = [
  {
    id: "oceanfront-villa-bali",
    image: "/listing-1.jpg",
    title: "Oceanfront Villa",
    location: "Bali, Indonesia",
    price: 85,
    rating: 4.9,
    reviews: 127,
    description:
      "Wake up to the sound of waves in this stunning oceanfront villa. Featuring an infinity pool, open-air living spaces, and direct beach access — a true tropical escape.",
  },
  {
    id: "alpine-retreat-zermatt",
    image: "/listing-2.jpg",
    title: "Alpine Retreat",
    location: "Zermatt, Switzerland",
    price: 120,
    rating: 4.8,
    reviews: 89,
    description:
      "Nestled in the Swiss Alps with breathtaking views of the Matterhorn. A cozy mountain lodge with a fireplace, hot tub, and ski-in/ski-out access.",
  },
  {
    id: "industrial-loft-brooklyn",
    image: "/listing-3.jpg",
    title: "Industrial Loft",
    location: "Brooklyn, New York",
    price: 65,
    rating: 4.7,
    reviews: 203,
    description:
      "A converted warehouse loft in the heart of Brooklyn. Exposed brick, high ceilings, and floor-to-ceiling windows with skyline views.",
  },
  {
    id: "jungle-treehouse-tulum",
    image: "/listing-4.jpg",
    title: "Jungle Treehouse",
    location: "Tulum, Mexico",
    price: 55,
    rating: 4.9,
    reviews: 156,
    description:
      "An elevated treehouse surrounded by the lush jungle of Tulum. Eco-friendly design, open-air showers, and just minutes from ancient Mayan ruins.",
  },
  {
    id: "aegean-escape-santorini",
    image: "/listing-5.jpg",
    title: "Aegean Escape",
    location: "Santorini, Greece",
    price: 95,
    rating: 5.0,
    reviews: 74,
    description:
      "A whitewashed cave house perched on the Santorini caldera. Iconic blue domes, private terrace, and panoramic sunset views over the Aegean Sea.",
  },
  {
    id: "desert-glass-house-joshua-tree",
    image: "/listing-6.jpg",
    title: "Desert Glass House",
    location: "Joshua Tree, USA",
    price: 110,
    rating: 4.8,
    reviews: 98,
    description:
      "A minimalist glass house in the heart of Joshua Tree National Park. Stargazing from bed, a heated outdoor pool, and total desert solitude.",
  },
];

/* navLinks */

export const navLinks = [
  { label: "Explore", href: "/CoomingSoon" },
  { label: "How it Works", href: "/CoomingSoon" },
  { label: "List Property", href: "/listPropertys" },
  { label: "Staking", href: "/CoomingSoon" },
];

/* Properties  Maps */

export const properties = [
  {
    lat: -8.4095,
    lng: 115.1889,
    title: "Oceanfront Villa",
    price: 85,
    location: "Bali",
  },
  {
    lat: 46.0207,
    lng: 7.7491,
    title: "Alpine Retreat",
    price: 120,
    location: "Zermatt",
  },
  {
    lat: 40.6782,
    lng: -73.9442,
    title: "Industrial Loft",
    price: 65,
    location: "Brooklyn",
  },
  {
    lat: 20.2114,
    lng: -87.4654,
    title: "Jungle Treehouse",
    price: 55,
    location: "Tulum",
  },
  {
    lat: 36.3932,
    lng: 25.4615,
    title: "Aegean Escape",
    price: 95,
    location: "Santorini",
  },
  {
    lat: 34.1347,
    lng: -116.3131,
    title: "Desert Glass House",
    price: 110,
    location: "Joshua Tree",
  },
  {
    lat: 48.8566,
    lng: 2.3522,
    title: "Parisian Penthouse",
    price: 150,
    location: "Paris",
  },
  {
    lat: 35.6762,
    lng: 139.6503,
    title: "Tokyo Capsule Suite",
    price: 45,
    location: "Tokyo",
  },
  {
    lat: -33.8688,
    lng: 151.2093,
    title: "Harbour View Loft",
    price: 130,
    location: "Sydney",
  },
  {
    lat: 25.2048,
    lng: 55.2708,
    title: "Dubai Sky Villa",
    price: 200,
    location: "Dubai",
  },
];

//Steps Register

export const STEPS = [
  { id: 1, label: "Personal", icon: User },
  { id: 2, label: "Contact", icon: MapPin },
  { id: 3, label: "Role", icon: Shield },
] as const;

export const footerLinks = [
  {
    title: "Product",
    links: navLinks,
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Support", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
      { label: "Licenses", href: "#" },
    ],
  },
];
