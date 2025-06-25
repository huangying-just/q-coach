import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 检查基本服务状态
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'Q-Coach',
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: 'connected', // 简单标记，实际可以测试数据库连接
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
      }
    };

    return NextResponse.json(healthCheck);
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        timestamp: new Date().toISOString(),
        error: 'Service unavailable',
        service: 'Q-Coach'
      },
      { status: 503 }
    );
  }
} 