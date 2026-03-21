//Library
import { Shield } from "lucide-react";
//Next
import Image from "next/image";
//Own components
import { stats } from "../constants";

export const HeroSection = () => {
  return (
    <section className="relative min-h-screen overflow-hidden gradient-hero">
      {/* Background */}
      <div className="absolute inset-0">
        <Image
          src="/hero-listing.jpg"
          alt="Luxury futuristic apartment"
          fill
          priority
          className="object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-linear-to-b from-background/60 via-background/80 to-background" />
      </div>

      <div className="container relative z-10 mx-auto flex min-h-screen flex-col items-center justify-center px-6 pt-20">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-2 text-sm text-muted-foreground backdrop-blur-sm">
          <Shield className="h-4 w-4 text-primary" />
          Secured by Staking · Powered by Solana
        </div>

        {/* Heading */}
        <div className="text-center">
          <h1 className="font-display text-5xl font-bold leading-tight tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            Stay Anywhere.
            <br />
            <span className="text-gradient">Stake Your Trust.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Book unique stays worldwide. Your deposit earns staking rewards
            while guaranteeing trust. Pay in USD — we handle the crypto
            seamlessly.
          </p>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 gap-8 text-center sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="font-display text-2xl font-bold text-gradient sm:text-3xl">
                {stat.value}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
