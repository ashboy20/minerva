/**
 * API Call Service for communicating with Python backend
 * Handles external API requests through the Python backend
 */

import { ipcChannels } from '@/config/ipc-channels';

interface ApiCallRequest {
  method: string;
  url: string;
  headers?: Record<string, string>;
  query_params?: Record<string, string>;
  body?: string | object;
  auth?: {
    auth_type: string;
    token?: string;
  };
}

interface ApiCallResponse {
  status_code: number;
  headers: Record<string, string>;
  body: any;
  response_time: number;
  size: number;
}

interface BackendResponse {
  data?: ApiCallResponse;
  error?: string;
  status: number;
}

export class ApiCallService {
  
  /**
   * Call an external API through the Python backend
   */
  static async callEndpoint(request: ApiCallRequest): Promise<ApiCallResponse> {
    try {
      const result: BackendResponse = await window.electron.ipcRenderer.invoke(
        ipcChannels.BACKEND_API_CALL_ENDPOINT,
        request
      );

      if (result.error) {
        // Return error response in the expected format
        return {
          status_code: result.status || 0,
          headers: {},
          body: {
            error: result.error,
            error_type: 'BackendError'
          },
          response_time: 0,
          size: 0
        };
      }

      if (!result.data) {
        // Return error response if no data
        return {
          status_code: 0,
          headers: {},
          body: {
            error: 'No response data from backend',
            error_type: 'NoDataError'
          },
          response_time: 0,
          size: 0
        };
      }

      return result.data;

    } catch (error) {
      console.error('API Call Service Error:', error);
      
      // Return error response in the expected format
      return {
        status_code: 0,
        headers: {},
        body: {
          error: error instanceof Error ? error.message : 'Unknown error',
          error_type: 'ServiceError'
        },
        response_time: 0,
        size: 0
      };
    }
  }
}

export default ApiCallService;
