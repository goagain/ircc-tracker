export interface Activity {
  activity: string;
  order: number;
  status: string;
}

export interface HistoryRecord {
  activity: string;
  isNew: boolean | null;
  isWaiting: boolean | null;
  loadTime: number;
  text: {
    en: string;
    fr: string;
  };
  time: number;
  title: {
    en: string;
    fr: string;
  };
  type: string;
}

export interface ApplicationDetails {
  actions: any[];
  activities: Activity[];
  applicationNumber: string;
  createdAt: string;
  history: HistoryRecord[];
  lastUpdatedTime: number;
  status: string;
  uci: string;
  updatedAt: string;
}

export interface Credential {
  id: string;
  user_id: string;
  ircc_username: string;
  email: string;
  is_active: boolean;
  last_status: string;
  last_checked: string;
  last_timestamp: string;
  application_number: string;
  details?: ApplicationDetails;
} 