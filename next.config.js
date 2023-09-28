/** @type {import('next').NextConfig} */

const VERSION = require("child_process")
  .execSync("git rev-parse HEAD")
  .toString()
  .trim();

const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.NODE_ENV === "development" ? false : true,
  openAnalyzer: false,
});

const walletConnectImages1 = `https://explorer-api.walletconnect.com/v3/logo/lg/f216b371-96cf-409a-9d88-296392b85800 https://explorer-api.walletconnect.com/v3/logo/lg/a7f416de-aa03-4c5e-3280-ab49269aef00 https://explorer-api.walletconnect.com/v3/logo/lg/5e481041-dc3c-4a81-373a-76bbde91b800 https://explorer-api.walletconnect.com/v3/logo/lg/9f259366-0bcd-4817-0af9-f78773e41900 https://explorer-api.walletconnect.com/v3/logo/lg/7c5ff577-a68d-49c5-02cd-3d83637b0b00 https://explorer-api.walletconnect.com/v3/logo/lg/d740b48c-2b55-4a27-b5f5-d2188200ca00 https://explorer-api.walletconnect.com/v3/logo/lg/c39b3a16-1a38-4588-f089-cb7aeb584700 https://explorer-api.walletconnect.com/v3/logo/lg/70080bd7-9858-4720-cf74-8f74cd74cb00 https://explorer-api.walletconnect.com/v3/logo/lg/7e1514ba-932d-415d-1bdb-bccb6c2cbc00 https://explorer-api.walletconnect.com/v3/logo/lg/aff8973b-e093-45b5-4858-c01dd043bc00 https://explorer-api.walletconnect.com/v3/logo/lg/34ab7558-9e64-4436-f4e6-9069f2533d00 https://explorer-api.walletconnect.com/v3/logo/lg/37d7a10f-d94d-4a56-c30e-267e8afbd500 https://explorer-api.walletconnect.com/v3/logo/lg/f3f0da1-40ec-4940-aebe-df075513d100 https://explorer-api.walletconnect.com/v3/logo/lg/8ad627ec-cbcd-4878-ec5c-3df588055200 https://explorer-api.walletconnect.com/v3/logo/lg/109d7c90-86ed-4ee0-e17d-3c87624ddf00 https://explorer-api.walletconnect.com/v3/logo/lg/4c16cad4-cac9-4643-6726-c696efaf5200 https://explorer-api.walletconnect.com/v3/logo/lg/6487869b-1165-4f30-aa3a-115665be8300 https://explorer-api.walletconnect.com/v3/logo/lg/eb6de921-6824-4f35-6331-8a8b031e7100 https://explorer-api.walletconnect.com/v3/logo/lg/80ab63a2-1b32-4140-3577-9fbc8ea82e00 https://explorer-api.walletconnect.com/v3/logo/lg/b2d5c39c-a485-4efa-5736-a782204e4a00 https://explorer-api.walletconnect.com/v3/logo/lg/12bebb3f-8030-4892-8452-c60a6bac1500 https://explorer-api.walletconnect.com/v3/logo/lg/77865965-4322-4ac4-5049-b2af11bf8300 https://explorer-api.walletconnect.com/v3/logo/lg/cf3f0da1-40ec-4940-aebe-df075513d100 https://explorer-api.walletconnect.com/v3/logo/lg/7a33d7f1-3d12-4b5c-f3ee-5cd83cb1b500`;
const walletConnectImages2 = `https://explorer-api.walletconnect.com/v3/logo/lg/619537c0-2ff3-4c78-9ed8-a05e7567f300 https://explorer-api.walletconnect.com/v3/logo/lg/0528ee7e-16d1-4089-21e3-bbfb41933100 https://explorer-api.walletconnect.com/v3/logo/lg/1bf33a89-b049-4a1c-d1f6-4dd7419ee400 https://explorer-api.walletconnect.com/v3/logo/lg/62471a22-33cb-4e65-5b54-c3d9ea24b900 https://explorer-api.walletconnect.com/v3/logo/lg/35f9c46e-cc57-4aa7-315d-e6ccb2a1d600 https://explorer-api.walletconnect.com/v3/logo/lg/3f7075d0-4ab7-4db5-404d-3e4c05e6fe00 https://explorer-api.walletconnect.com/v3/logo/lg/f3119826-4ef5-4d31-4789-d4ae5c18e400 https://explorer-api.walletconnect.com/v3/logo/lg/26a8f588-3231-4411-60ce-5bb6b805a700 https://explorer-api.walletconnect.com/v3/logo/lg/1e47340b-8fd7-4ad6-17e7-b2bd651fae00 https://explorer-api.walletconnect.com/v3/logo/lg/125e828e-9936-4451-a8f2-949c119b7400 https://explorer-api.walletconnect.com/v3/logo/lg/cd492418-ea85-4ef1-aeed-1c9e20b58900 https://explorer-api.walletconnect.com/v3/logo/lg/98d2620c-9fc8-4a1c-31bc-78d59d00a300 https://explorer-api.walletconnect.com/v3/logo/lg/f8068a7f-83d7-4190-1f94-78154a12c600 https://explorer-api.walletconnect.com/v3/logo/lg/877fa1a4-304d-4d45-ca8e-f76d1a556f001 https://explorer-api.walletconnect.com/v3/logo/lg/877fa1a4-304d-4d45-ca8e-f76d1a556f001 https://explorer-api.walletconnect.com/v3/logo/lg/5195e9db-94d8-4579-6f11-ef553be95100 https://explorer-api.walletconnect.com/v3/logo/lg/bff9cf1f-df19-42ce-f62a-87f04df13c00 https://explorer-api.walletconnect.com/v3/logo/lg/1991f85d-43d4-4165-3502-cd6ef8312b00 https://explorer-api.walletconnect.com/v3/logo/lg/a1cb2777-f8f9-49b0-53fd-443d20ee0b00 https://explorer-api.walletconnect.com/v3/logo/lg/5195e9db-94d8-4579-6f11-ef553be95100 https://explorer-api.walletconnect.com/v3/logo/lg/877fa1a4-304d-4d45-ca8e-f76d1a556f00 https://explorer-api.walletconnect.com/v3/logo/lg/4725dda0-4471-4d0f-7adf-6bbe8b929c00 https://explorer-api.walletconnect.com/v3/logo/lg/2cd67b4c-282b-4809-e7c0-a88cd5116f00 https://explorer-api.walletconnect.com/v3/logo/lg/f581365d-e844-4d21-8e35-44a755a32d00`;

const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: `default-src 'none'; script-src 'self' 'unsafe-inline' https://www.google-analytics.com https://www.googletagmanager.com/ 'unsafe-eval'; connect-src * 'self' ${process.env.REACT_APP_API_ENDPOINT} https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY} https://registry.walletconnect.com/api/v2/wallets wss://*.bridge.walletconnect.org wss://*.walletconnect.com wss://www.walletlink.org/rpc https://explorer-api.walletconnect.com/v3/wallets https://www.googletagmanager.com https://*.google-analytics.com https://cloudflare-eth.com/ https://arweave.net/* https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY} https://rpc.walletconnect.com/v1/; font-src 'self'; img-src 'self' data: blob: *; media-src 'self' https://*.cloudfront.net https://arweave.net https://*.arweave.net https://ipfs.io/ipfs/* https://cf-ipfs.com/ipfs/*; frame-src 'self' https://arweave.net https://*.arweave.net https://ipfs.io/ipfs/* https://cf-ipfs.com/ipfs/*; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; object-src data:;`,
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "same-origin",
  },
  {
    key: "Permissions-Policy",
    value: "geolocation=()",
  },
];

const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  compress: true,
  productionBrowserSourceMaps: false,
  images: {
    domains: ["6529.io", "arweave.net"],
    unoptimized: true,
    minimumCacheTTL: 86400,
  },
  env: {
    ALCHEMY_API_KEY: process.env.ALCHEMY_API_KEY,
    API_ENDPOINT: process.env.REACT_APP_API_ENDPOINT,
    BASE_ENDPOINT: process.env.REACT_APP_BASE_ENDPOINT,
    ALLOWLIST_API_ENDPOINT: process.env.REACT_APP_ALLOWLIST_API_ENDPOINT,
    VERSION: VERSION,
  },
  async generateBuildId() {
    // return VERSION;
    return "6529Seize";
  },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = withBundleAnalyzer(nextConfig);
