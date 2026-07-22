import { withRetry, withTimeout } from "@/lib/resilience/retry";
import { logger } from "@/lib/logger/structured";

interface ApiClientConfig {
  baseUrl?: string;
  timeoutMs?: number;
  retryConfig?: Parameters<typeof withRetry>[2];
}

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export class ApiClient {
  private config: Required<ApiClientConfig>;

  constructor(config: ApiClientConfig = {}) {
    this.config = {
      baseUrl: config.baseUrl || "",
      timeoutMs: config.timeoutMs || 10000,
      retryConfig: config.retryConfig || {},
    };
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<ApiResponse<T>> {
    const url = `${this.config.baseUrl}${path}`;

    const execute = async (): Promise<Response> => {
      return fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: body ? JSON.stringify(body) : undefined,
      });
    };

    try {
      const response = await withTimeout(
        () =>
          withRetry(
            () =>
              execute().then(async (res) => {
                if (!res.ok && res.status >= 500) {
                  const text = await res.text();
                  throw new Error(`Server error ${res.status}: ${text.slice(0, 200)}`);
                }
                return res;
              }),
            `${method} ${path}`,
            this.config.retryConfig
          ),
        this.config.timeoutMs,
        `${method} ${path}`
      );

      const data: ApiResponse<T> = await response.json();

      if (!response.ok && !data.error) {
        data.error = `HTTP ${response.status}`;
      }

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      logger.error(`API ${method} ${path} failed`, {
        action: "api_error",
        error: message,
      });
      return { success: false, error: message };
    }
  }

  async get<T>(path: string): Promise<ApiResponse<T>> {
    return this.request<T>("GET", path);
  }

  async post<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>("POST", path, body);
  }

  async put<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>("PUT", path, body);
  }

  async patch<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>("PATCH", path, body);
  }

  async delete<T>(path: string): Promise<ApiResponse<T>> {
    return this.request<T>("DELETE", path);
  }
}

export const api = new ApiClient();
