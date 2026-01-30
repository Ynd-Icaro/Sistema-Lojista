'use client';

import { useEffect, useCallback, useRef } from 'react';

const CACHE_EXPIRY_MS = 2 * 60 * 1000; // 2 minutes

interface ModalCacheData {
  data: Record<string, any>;
  timestamp: number;
}

export function useModalCache(modalKey: string) {
  const cacheKey = `modal-cache-${modalKey}`;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load cached data from localStorage
  const loadCache = useCallback(() => {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (!cached) return null;
      
      const parsedCache: ModalCacheData = JSON.parse(cached);
      const now = Date.now();
      
      // Check if cache has expired
      if (now - parsedCache.timestamp > CACHE_EXPIRY_MS) {
        localStorage.removeItem(cacheKey);
        return null;
      }
      
      return parsedCache.data;
    } catch {
      return null;
    }
  }, [cacheKey]);

  // Save data to cache
  const saveCache = useCallback((data: Record<string, any>) => {
    try {
      // Only save if there's actual data
      const hasData = Object.values(data).some(value => 
        value !== '' && value !== null && value !== undefined
      );
      
      if (!hasData) {
        localStorage.removeItem(cacheKey);
        return;
      }
      
      const cacheData: ModalCacheData = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // Set new timeout to clear cache after expiry
      timeoutRef.current = setTimeout(() => {
        localStorage.removeItem(cacheKey);
      }, CACHE_EXPIRY_MS);
    } catch {
      // Silent fail - localStorage might be full or disabled
    }
  }, [cacheKey]);

  // Clear cache
  const clearCache = useCallback(() => {
    localStorage.removeItem(cacheKey);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [cacheKey]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    loadCache,
    saveCache,
    clearCache,
  };
}

// Hook for auto-saving form data to cache
export function useFormCache<T extends Record<string, any>>(
  modalKey: string,
  watch: () => T,
  reset: (data: Partial<T>) => void,
  isOpen: boolean,
  defaultValues?: Partial<T>
) {
  const { loadCache, saveCache, clearCache } = useModalCache(modalKey);
  const hasLoadedCache = useRef(false);

  // Load cache when modal opens
  useEffect(() => {
    if (isOpen && !hasLoadedCache.current) {
      const cached = loadCache();
      if (cached) {
        reset({ ...defaultValues, ...cached } as Partial<T>);
      }
      hasLoadedCache.current = true;
    }
    
    if (!isOpen) {
      hasLoadedCache.current = false;
    }
  }, [isOpen, loadCache, reset, defaultValues]);

  // Save form data on change
  useEffect(() => {
    if (!isOpen) return;
    
    const formData = watch();
    saveCache(formData);
  }, [watch, saveCache, isOpen]);

  // Return clearCache for when form is successfully submitted
  return { clearCache };
}
