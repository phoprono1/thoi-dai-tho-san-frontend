import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/game',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
