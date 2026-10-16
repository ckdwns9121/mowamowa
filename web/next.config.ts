import type { NextConfig } from "next";

// GitHub Pages는 /mowamowa/ 아래에 서비스되므로 빌드 시 NEXT_PUBLIC_BASE_PATH=/mowamowa 를 넘긴다.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  images: { unoptimized: true },
};

export default nextConfig;
