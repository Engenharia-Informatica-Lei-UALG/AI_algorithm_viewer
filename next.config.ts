import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // otimizar deploys (especialmente em Docker).
  output: "standalone",
  distDir: '.output',
  /* config options here */
};

export default nextConfig;
