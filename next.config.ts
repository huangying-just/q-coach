import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 禁用遥测数据收集，避免连接Google服务器
  telemetry: false,
  
  // 优化构建配置
  experimental: {
    // 禁用某些可能触发外部连接的功能
    serverComponentsExternalPackages: ['prisma', '@prisma/client'],
  },
  
  // 配置图片域名（如果需要）
  images: {
    remotePatterns: [
      // 根据需要添加允许的图片域名
    ],
  },
  
  // 输出配置
  output: 'standalone',
  
  // 编译器配置
  compiler: {
    // 移除console.log（生产环境）
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // 环境变量配置
  env: {
    NEXT_TELEMETRY_DISABLED: '1',
  },
};

export default nextConfig;
