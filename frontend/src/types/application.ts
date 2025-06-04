export enum ActivityType {
    LANGUAGE = "language",
    BACKGROUND_VERIFICATION = "backgroundVerification",
    RESIDENCY = "residency",
    PROHIBITIONS = "prohibitions",
    CITIZENSHIP_TEST = "citizenshipTest",
    CITIZENSHIP_OATH = "citizenshipOath"
}

export enum ActivityStatus {
    IN_PROGRESS = "inProgress",
    NOT_STARTED = "notStarted",
    COMPLETED = "completed"
}

export enum HistoryType {
    FILE_CREATED = "fileCreated",
    STATUS_CHANGED = "statusChanged",
    ACTIVITY_UPDATED = "activityUpdated"
}

export interface Activity {
    activity: string;
    status: 'notStarted' | 'inProgress' | 'completed';
}

export interface BilingualText {
    en: string;
    fr: string;
}

export interface HistoryRecord {
    description: string;
    timestamp: number;
}

export interface ApplicationRecord {
    application_number: string;
    uci: string;
    status: 'notStarted' | 'inProgress' | 'completed';
    last_updated_time: number;
    activities: Activity[];
    history: HistoryRecord[];
} 