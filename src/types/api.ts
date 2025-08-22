export interface UsernameClaimResponse {
  username: string;
}

export interface UsernameClaimError {
  error: string;
  retryAfter?: number;
  details?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

export interface RateLimitHeaders {
  "X-RateLimit-Limit": string;
  "X-RateLimit-Remaining": string;
  "X-RateLimit-Reset": string;
}

export interface UsernameValidationState {
  isValid: boolean;
  error: string | null;
  isChecking: boolean;
  isAvailable: boolean | null;
}

export interface UsernameRateLimit {
  remaining: number;
  total: number;
  resetTime: Date;
  isNewUser: boolean;
}
