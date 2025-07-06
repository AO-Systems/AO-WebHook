export type LogStatus = 'sending' | 'success' | 'error';

export interface LogEntry {
  id: string;
  userId: string; // The ID of the user who sent the message
  message: string;
  status: LogStatus;
  timestamp: string;
  error?: string;
}

export type UserRole = 'admin' | 'user';

export interface Webhook {
    id: string;
    name: string;
    url: string;
}

// Expanded User interface for full user management
export interface User {
    id: string;
    role: UserRole;
    isSuspended: boolean;
    dailyLimit: number; // Max messages per day
    messageCount: number; // Messages sent today
    lastCountReset: string; // ISO date string yyyy-mm-dd
    aocBalance: number; // AO Credits
    webhooks: Webhook[];
    selectedWebhookId?: string | null;
}

export type RequestStatus = 'pending' | 'approved' | 'denied';

export interface UserRequest {
    id: string;
    fromUserId: string;
    message: string;
    timestamp: string;
    status: RequestStatus;
}

export interface AppNotification {
    id: string;
    message: string;
    timestamp: string;
    targetUserId?: string; // undefined for global
    isRead: boolean;
}