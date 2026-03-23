import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["ws"],
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
