import fetch from "node-fetch";

interface ZoomTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

interface ZoomPhoneCallLog {
  id: string;
  call_id: string;
  caller_number: string;
  callee_number: string;
  caller_number_type: number;
  callee_number_type: number;
  direction: "inbound" | "outbound";
  duration: number;
  result: string;
  date_time: string;
  call_type: string;
  recording_type?: string;
  has_recording: boolean;
  user_id?: string;
  user_email?: string;
  department?: string;
}

interface ZoomCallLogsResponse {
  from: string;
  to: string;
  page_count: number;
  page_number: number;
  page_size: number;
  total_records: number;
  call_logs: ZoomPhoneCallLog[];
  next_page_token?: string;
}

interface ZoomRecording {
  id: string;
  call_id: string;
  call_log_id: string;
  caller_number: string;
  callee_number: string;
  direction: string;
  duration: number;
  date_time: string;
  download_url: string;
  file_url: string;
  status: string;
}

interface ZoomRecordingsResponse {
  from: string;
  to: string;
  page_size: number;
  total_records: number;
  recordings: ZoomRecording[];
  next_page_token?: string;
}

class ZoomService {
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.accessToken;
    }

    const accountId = process.env.ZOOM_ACCOUNT_ID;
    const clientId = process.env.ZOOM_CLIENT_ID;
    const clientSecret = process.env.ZOOM_CLIENT_SECRET;

    if (!accountId || !clientId || !clientSecret) {
      throw new Error("Missing Zoom credentials. Please set ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, and ZOOM_CLIENT_SECRET.");
    }

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

    const response = await fetch(
      `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${accountId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[ZoomService] Token error:", errorText);
      throw new Error(`Failed to get Zoom access token: ${response.status}`);
    }

    const data = (await response.json()) as ZoomTokenResponse;
    this.accessToken = data.access_token;
    this.tokenExpiry = new Date(Date.now() + (data.expires_in - 60) * 1000);

    console.log("[ZoomService] Successfully obtained access token");
    return this.accessToken;
  }

  async getPhoneCallLogs(
    fromDate?: string,
    toDate?: string,
    pageSize: number = 100
  ): Promise<ZoomPhoneCallLog[]> {
    const token = await this.getAccessToken();

    const from = fromDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const to = toDate || new Date().toISOString().split("T")[0];

    const allLogs: ZoomPhoneCallLog[] = [];
    let nextPageToken: string | undefined;

    do {
      const url = new URL("https://api.zoom.us/v2/phone/call_history");
      url.searchParams.set("from", from);
      url.searchParams.set("to", to);
      url.searchParams.set("page_size", pageSize.toString());
      if (nextPageToken) {
        url.searchParams.set("next_page_token", nextPageToken);
      }

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[ZoomService] Call logs error:", errorText);
        throw new Error(`Failed to fetch Zoom call logs: ${response.status}`);
      }

      const data = (await response.json()) as ZoomCallLogsResponse;
      allLogs.push(...(data.call_logs || []));
      nextPageToken = data.next_page_token;

      console.log(`[ZoomService] Fetched ${data.call_logs?.length || 0} call logs, total: ${allLogs.length}`);
    } while (nextPageToken);

    return allLogs;
  }

  async getUserCallLogs(
    userId: string,
    fromDate?: string,
    toDate?: string,
    pageSize: number = 100
  ): Promise<ZoomPhoneCallLog[]> {
    const token = await this.getAccessToken();

    const from = fromDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const to = toDate || new Date().toISOString().split("T")[0];

    const allLogs: ZoomPhoneCallLog[] = [];
    let nextPageToken: string | undefined;

    do {
      const url = new URL(`https://api.zoom.us/v2/phone/users/${userId}/call_logs`);
      url.searchParams.set("from", from);
      url.searchParams.set("to", to);
      url.searchParams.set("page_size", pageSize.toString());
      if (nextPageToken) {
        url.searchParams.set("next_page_token", nextPageToken);
      }

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[ZoomService] User call logs error:", errorText);
        throw new Error(`Failed to fetch user call logs: ${response.status}`);
      }

      const data = (await response.json()) as ZoomCallLogsResponse;
      allLogs.push(...(data.call_logs || []));
      nextPageToken = data.next_page_token;
    } while (nextPageToken);

    return allLogs;
  }

  async getCallRecordings(
    fromDate?: string,
    toDate?: string
  ): Promise<ZoomRecording[]> {
    const token = await this.getAccessToken();

    const from = fromDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const to = toDate || new Date().toISOString().split("T")[0];

    const allRecordings: ZoomRecording[] = [];
    let nextPageToken: string | undefined;

    do {
      const url = new URL("https://api.zoom.us/v2/phone/recordings");
      url.searchParams.set("from", from);
      url.searchParams.set("to", to);
      url.searchParams.set("page_size", "100");
      if (nextPageToken) {
        url.searchParams.set("next_page_token", nextPageToken);
      }

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[ZoomService] Recordings error:", errorText);
        throw new Error(`Failed to fetch recordings: ${response.status}`);
      }

      const data = (await response.json()) as ZoomRecordingsResponse;
      allRecordings.push(...(data.recordings || []));
      nextPageToken = data.next_page_token;
    } while (nextPageToken);

    return allRecordings;
  }

  async testConnection(): Promise<{ success: boolean; message: string; details?: unknown }> {
    try {
      const token = await this.getAccessToken();
      
      const response = await fetch("https://api.zoom.us/v2/users/me", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          message: `Connection failed: ${response.status}`,
          details: errorText,
        };
      }

      const user = await response.json();
      return {
        success: true,
        message: "Successfully connected to Zoom API",
        details: user,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

export const zoomService = new ZoomService();
export type { ZoomPhoneCallLog, ZoomRecording };
