export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  message?: string;
}

export function okResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    ...(message ? { message } : {}),
  };
}

export function errResponse(error: string, code: string = "BAD_REQUEST"): ApiResponse {
  return {
    success: false,
    error,
    code,
  };
}
