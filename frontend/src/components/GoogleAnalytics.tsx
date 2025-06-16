import { useEffect, useState } from 'react';
import axios from 'axios';

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

const CACHE_KEY = 'google_analytics_id';
const CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

interface CacheData {
  id: string;
  timestamp: number;
}

const GoogleAnalytics = () => {
  const [analyticsId, setAnalyticsId] = useState<string | null>(null);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        // Check cache first
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (cachedData) {
          const { id, timestamp }: CacheData = JSON.parse(cachedData);
          const now = Date.now();
          
          // If cache is not expired, use cached data
          if (now - timestamp < CACHE_DURATION) {
            if (id) {
              setAnalyticsId(id);
              initializeGoogleAnalytics(id);
            }
            return;
          }
        }

        // If cache does not exist or is expired, get from server
        const response = await axios.get('/api/config/analytics');
        const id = response.data.googleAnalyticsId;
        
        // Update cache
        if (id) {
          const cacheData: CacheData = {
            id,
            timestamp: Date.now()
          };
          localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
          setAnalyticsId(id);
          initializeGoogleAnalytics(id);
        }
      } catch (error) {
        console.error('Failed to load Google Analytics:', error);
      }
    };

    loadAnalytics();
  }, []);

  const initializeGoogleAnalytics = (id: string) => {
    // Load Google Analytics script
    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
    script.async = true;
    document.head.appendChild(script);

    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    window.gtag = function() {
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', id);
  };

  return null; // This component does not render any content
};

export default GoogleAnalytics; 