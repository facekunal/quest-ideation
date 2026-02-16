import { snagConfig } from '../config/snag.config';
import { logger } from '../utils/logger';
import { AppError, ErrorCode } from '../types/app.types';

interface RequestOptions {
  timeout?: number;
  retries?: number;
}

export class SnagClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly defaultTimeout = 10000; // 10 seconds
  private readonly maxRetries = 2;

  constructor() {
    this.baseUrl = snagConfig.baseUrl;
    this.apiKey = snagConfig.apiKey;
  }

  async get<T>(
    endpoint: string,
    params?: Record<string, any>,
    options: RequestOptions = {}
  ): Promise<T> {
    const url = this.buildUrl(endpoint, params);
    return this.request<T>('GET', url, undefined, options);
  }

  async post<T>(
    endpoint: string,
    body: Record<string, any>,
    options: RequestOptions = {}
  ): Promise<T> {
    const url = this.buildUrl(endpoint);
    return this.request<T>('POST', url, body, options);
  }

  private async request<T>(
    method: string,
    url: string,
    body?: Record<string, any>,
    options: RequestOptions = {}
  ): Promise<T> {
    const timeout = options.timeout || this.defaultTimeout;
    const maxRetries = options.retries ?? this.maxRetries;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        logger.debug(`${method} ${url}`, { attempt, body });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        // For Node.js fetch, we need to handle TLS properly
        // In development, you can set NODE_TLS_REJECT_UNAUTHORIZED=0 in .env
        const fetchOptions: RequestInit = {
          method,
          headers: {
            'X-API-KEY': this.apiKey,
            'Content-Type': 'application/json',
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        };

        const response = await fetch(url, fetchOptions);

        clearTimeout(timeoutId);

        // Handle HTTP errors
        if (!response.ok) {
          const errorBody = await response.text();
          let errorMessage = `Snag API error: ${response.status} ${response.statusText}`;

          try {
            const errorJson = JSON.parse(errorBody);
            errorMessage = errorJson.message || errorMessage;
          } catch {
            // errorBody is not JSON, use default message
          }

          logger.error(errorMessage, {
            status: response.status,
            url,
            body: errorBody,
          });

          // Don't retry client errors (4xx)
          if (response.status >= 400 && response.status < 500) {
            if (response.status === 403) {
              throw new AppError(
                ErrorCode.API_KEY_INVALID,
                'Invalid Snag API key. Please check your configuration.',
                403
              );
            }
            throw new AppError(
              ErrorCode.VALIDATION_ERROR,
              errorMessage,
              response.status
            );
          }

          // Retry server errors (5xx)
          lastError = new AppError(
            ErrorCode.SNAG_API_ERROR,
            errorMessage,
            response.status
          );

          if (attempt < maxRetries) {
            const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
            logger.warn(`Retrying request after ${delay}ms`, { attempt, url });
            await this.sleep(delay);
            continue;
          }

          throw lastError;
        }

        // Parse successful response
        const data = await response.json();
        logger.debug(`Response received`, { url, status: response.status });
        return data as T;

      } catch (error: any) {
        if (error.name === 'AbortError') {
          lastError = new AppError(
            ErrorCode.SNAG_API_ERROR,
            `Request timeout after ${timeout}ms`,
            408
          );
        } else if (error instanceof AppError) {
          throw error; // Re-throw AppErrors immediately
        } else {
          lastError = new AppError(
            ErrorCode.SNAG_API_ERROR,
            `Network error: ${error.message}`,
            500,
            error
          );
        }

        // Retry on network errors or timeouts
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          logger.warn(`Retrying request after ${delay}ms`, {
            attempt,
            error: error.message,
          });
          await this.sleep(delay);
          continue;
        }

        throw lastError;
      }
    }

    throw lastError || new Error('Request failed after all retries');
  }

  private buildUrl(endpoint: string, params?: Record<string, any>): string {
    const url = new URL(endpoint, this.baseUrl);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          // Handle nested objects (like orderBy)
          if (typeof value === 'object' && !Array.isArray(value)) {
            Object.entries(value).forEach(([nestedKey, nestedValue]) => {
              url.searchParams.append(`${key}[${nestedKey}]`, String(nestedValue));
            });
          } else {
            url.searchParams.append(key, String(value));
          }
        }
      });
    }

    return url.toString();
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const snagClient = new SnagClient();
