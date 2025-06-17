import api from './api';

interface Config {
    googleClientId: string;
    googleAnalyticsId: string;
}

class ConfigService {
  private static instance: ConfigService;
  private config: Config | null = null;

  private constructor() {}

  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  public async getConfig(): Promise<Config> {
    try {
      const response = await api.get('config');
      this.config = response.data as Config;
      return this.config;
    } catch (error) {
      console.error('Failed to fetch config:', error);
      if (!this.config) {
        throw error;
      }
      return this.config;
    }
  }

  public clearCache(): void {
    this.config = null;
  }
}

export default ConfigService.getInstance(); 