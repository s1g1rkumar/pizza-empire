export interface ApiResponse<T> {
  success: boolean;
  data: T;
  requestId?: string | null;
}

export interface HealthData {
  status: 'ok' | 'degraded';
  uptimeSeconds: number;
  timestamp: string;
  database: {
    connected: boolean;
    serverTimeUtc: string | null;
  };
}
