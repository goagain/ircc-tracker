import { useEffect, useState } from 'react';
import configService from '../services/configService';

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

const GoogleAnalytics = () => {
  const [analyticsId, setAnalyticsId] = useState<string | null>(null);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const config = await configService.getConfig();
        const id = config.googleAnalyticsId;
        if (id) {
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