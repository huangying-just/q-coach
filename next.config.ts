import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 基本配置
  reactStrictMode: true,
  swcMinify: true,
  
  // 禁用遥测
  telemetry: false,
  
  // 服务器外部包配置（从experimental移出）
  serverExternalPackages: ['@prisma/client'],
  
  // 实验性功能
  experimental: {
    // 移除已废弃的 serverComponentsExternalPackages
    // serverComponentsExternalPackages: ['@prisma/client'], // 已移除
  },
  
  // 输出配置
  output: 'standalone',
  
  // 环境变量
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // 图片配置
  images: {
    domains: [],
  },
  
  // 头部配置
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};

export default nextConfig;
