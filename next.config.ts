import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    proxyClientMaxBodySize: "1024mb",
    serverActions: {
      bodySizeLimit: "1024mb",
    },
  },
  async rewrites() {
    return [
      {
        source: "/oauth2/authorization/:provider",
        destination: "/api/oauth2/authorization/:provider",
      },
      {
        source: "/login/oauth2/code/:provider",
        destination: "/api/login/oauth2/code/:provider",
      },
      {
        source: "/auth/callback/:provider",
        destination: "/api/auth/callback/:provider",
      },
    ];
  },
};

export default nextConfig;
