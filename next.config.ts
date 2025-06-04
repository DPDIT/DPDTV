import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: [
      "dpdtv.vercel.app",
      "https://dpdtv.vercel.app",
      "a1o8wy9afbhqmhad.public.blob.vercel-storage.com",
    ],
  },

  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
};

export default nextConfig;
