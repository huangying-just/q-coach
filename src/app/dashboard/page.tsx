'use client';

import React from 'react';
import GrowthDashboard from '@/components/GrowthDashboard';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">成长看板</h1>
          <p className="text-gray-600 mt-2">
            追踪你的提问能力成长轨迹，发现进步的足迹
          </p>
        </div>
        
        <GrowthDashboard />
      </div>
    </div>
  );
} 