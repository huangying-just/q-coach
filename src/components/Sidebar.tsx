import React from 'react';
import { MessageSquare, Clock, BarChart3, Settings, HelpCircle } from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

export default function Sidebar({ currentPage, onPageChange }: SidebarProps) {
  const menuItems = [
    {
      id: 'chat',
      name: '智能对话',
      icon: MessageSquare,
      description: '开始新的对话'
    },
    {
      id: 'history',
      name: '历史记录',
      icon: Clock,
      description: '查看所有对话历史'
    },
    {
      id: 'dashboard',
      name: '成长看板',
      icon: BarChart3,
      description: '查看成长数据'
    },
    {
      id: 'settings',
      name: '设置',
      icon: Settings,
      description: '应用设置'
    },
    {
      id: 'help',
      name: '帮助',
      icon: HelpCircle,
      description: '如何更好地提问'
    }
  ];

  return (
    <div className="bg-white w-64 min-h-screen shadow-lg border-r border-gray-200">
      {/* Logo和标题 */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Q-Coach</h1>
            <p className="text-sm text-gray-600">AI提问教练</p>
          </div>
        </div>
      </div>

      {/* 导航菜单 */}
      <nav className="p-4">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                <div className="text-left">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs text-gray-500">{item.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      </nav>

      {/* 底部信息 */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gray-50 border-t border-gray-200">
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Version 2.0 Beta
          </p>
          <p className="text-xs text-gray-400 mt-1">
            © 2024 Q-Coach
          </p>
        </div>
      </div>
    </div>
  );
} 