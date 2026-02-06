/**
 * WebSocket client for real-time updates.
 *
 * Manages WebSocket connections to the API Gateway for project-specific events.
 */

type EventHandler = (data: any) => void;

interface WebSocketMessage {
  type: string;
  event?: string;
  [key: string]: any;
}

class WebSocketClient {
  private ws: WebSocket | null = null;
  private projectId: string | null = null;
  private handlers: Map<string, Set<EventHandler>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private isIntentionalClose = false;

  /**
   * Connect to WebSocket server for a specific project.
   *
   * @param projectId - Project identifier for event filtering.
   */
  connect(projectId: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      // Already connected to this project
      if (this.projectId === projectId) {
        return;
      }
      // Connected to different project, close and reconnect
      this.disconnect();
    }

    this.projectId = projectId;
    this.isIntentionalClose = false;

    // Connect to WebSocket endpoint
    const wsUrl = `${this.getWebSocketUrl()}/ws/${projectId}`;
    console.log(`[WebSocket] Connecting to ${wsUrl}`);

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log(`[WebSocket] Connected to project ${projectId}`);
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('[WebSocket] Failed to parse message:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('[WebSocket] Error:', error);
    };

    this.ws.onclose = () => {
      console.log(`[WebSocket] Disconnected from project ${projectId}`);

      // Attempt reconnection if not intentional
      if (!this.isIntentionalClose && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(
          `[WebSocket] Reconnecting in ${this.reconnectDelay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
        );

        setTimeout(() => {
          if (this.projectId) {
            this.connect(this.projectId);
          }
        }, this.reconnectDelay);

        // Exponential backoff
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
      }
    };
  }

  /**
   * Disconnect from WebSocket server.
   */
  disconnect(): void {
    if (this.ws) {
      this.isIntentionalClose = true;
      this.ws.close();
      this.ws = null;
      this.projectId = null;
      console.log('[WebSocket] Disconnected');
    }
  }

  /**
   * Subscribe to a specific event type.
   *
   * @param eventType - Event type to listen for (e.g., "trace.created").
   * @param handler - Callback function to handle the event.
   */
  on(eventType: string, handler: EventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);
  }

  /**
   * Unsubscribe from a specific event type.
   *
   * @param eventType - Event type to stop listening for.
   * @param handler - Callback function to remove.
   */
  off(eventType: string, handler: EventHandler): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.handlers.delete(eventType);
      }
    }
  }

  /**
   * Handle incoming WebSocket message.
   *
   * @param message - Parsed WebSocket message.
   */
  private handleMessage(message: WebSocketMessage): void {
    // Handle acknowledgment messages
    if (message.type === 'ack') {
      return;
    }

    // Handle event messages
    const eventType = message.event;
    if (eventType) {
      const handlers = this.handlers.get(eventType);
      if (handlers) {
        handlers.forEach((handler) => {
          try {
            handler(message);
          } catch (error) {
            console.error(`[WebSocket] Error in handler for ${eventType}:`, error);
          }
        });
      }
    }
  }

  /**
   * Get WebSocket URL based on current API URL.
   *
   * @returns WebSocket URL (ws:// or wss://)
   */
  private getWebSocketUrl(): string {
    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    // Replace http(s):// with ws(s)://
    return apiUrl.replace(/^http/, 'ws');
  }

  /**
   * Send a message to the server (for ping/pong, etc.).
   *
   * @param message - Message object to send.
   */
  send(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('[WebSocket] Cannot send message, not connected');
    }
  }

  /**
   * Get connection status.
   *
   * @returns True if connected, false otherwise.
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
export const wsClient = new WebSocketClient();
