import { useState, useEffect } from 'react';
import { storage } from '@/lib/storage';
import { Session, UserHistory, Statistics } from '@/types';

// 通用本地存储Hook
export function useLocalStorage<T>(
  initialValue: T,
  getter: () => T,
  setter: (value: T) => void
) {
  const [value, setValue] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedValue = getter();
      setValue(storedValue);
    } catch (error) {
      console.error('Error loading from storage:', error);
    } finally {
      setIsLoading(false);
    }
  }, [getter]);

  const updateValue = (newValue: T | ((prev: T) => T)) => {
    setValue(current => {
      const updatedValue = typeof newValue === 'function' 
        ? (newValue as (prev: T) => T)(current)
        : newValue;
      
      try {
        setter(updatedValue);
      } catch (error) {
        console.error('Error saving to storage:', error);
      }
      
      return updatedValue;
    });
  };

  return [value, updateValue, isLoading] as const;
}

// 会话管理Hook
export function useSessions() {
  return useLocalStorage<Session[]>(
    [],
    () => storage.getSessions(),
    (sessions) => storage.saveSessions(sessions)
  );
}

// 用户历史Hook
export function useUserHistory() {
  return useLocalStorage<UserHistory>(
    {
      sessions: [],
      totalSessions: 0,
      averageScore: 0,
      lastUpdated: new Date()
    },
    () => storage.getUserHistory(),
    (history) => storage.saveUserHistory(history)
  );
}

// 统计数据Hook
export function useStatistics() {
  return useLocalStorage<Statistics>(
    {
      totalQuestions: 0,
      averageScore: 0,
      scoreHistory: [],
      categoryDistribution: [],
      achievements: [],
      streaks: { current: 0, longest: 0 }
    },
    () => storage.getStatistics(),
    (stats) => storage.saveStatistics(stats)
  );
}
