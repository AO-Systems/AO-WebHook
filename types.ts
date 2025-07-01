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

// Expanded User interface for full user management
export interface User {
    id: string;
    role: UserRole;
    isSuspended: boolean;
    dailyLimit: number; // Max messages per day
    messageCount: number; // Messages sent today
    lastCountReset: string; // ISO date string yyyy-mm-dd
}