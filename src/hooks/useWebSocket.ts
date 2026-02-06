/**
 * React hook for WebSocket real-time updates.
 *
 * Manages WebSocket connection lifecycle and event subscriptions.
 */

import { useEffect, useRef } from 'react';
import { wsClient } from '../lib/websocket';

interface UseWebSocketOptions {
  /**
   * Project ID to connect to.
   */
  projectId: string | null;

  /**
   * Event type to listen for (e.g., "trace.created").
   */
  eventType: string;

  /**
   * Callback when event is received.
   */
  onEvent: (data: any) => void;

  /**
   * Whether to enable WebSocket connection (default: true).
   */
  enabled?: boolean;
}

/**
 * Hook for subscribing to WebSocket events.
 *
 * Automatically connects to WebSocket when projectId is available,
 * subscribes to the specified event type, and cleans up on unmount.
 *
 * @param options - WebSocket configuration options.
 *
 * @example
 * ```tsx
 * useWebSocket({
 *   projectId: currentProject?.id || null,
 *   eventType: 'trace.created',
 *   onEvent: (data) => {
 *     console.log('New trace:', data.trace_id);
 *     queryClient.invalidateQueries(['workflows']);
 *   },
 * });
 * ```
 */
export function useWebSocket({
  projectId,
  eventType,
  onEvent,
  enabled = true,
}: UseWebSocketOptions): void {
  // Use ref to avoid recreating connection on every render
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!enabled || !projectId) {
      return;
    }

    // Connect to WebSocket for this project
    wsClient.connect(projectId);

    // Create stable handler that uses latest onEvent callback
    const handler = (data: any) => {
      onEventRef.current(data);
    };

    // Subscribe to event
    wsClient.on(eventType, handler);

    // Cleanup on unmount
    return () => {
      wsClient.off(eventType, handler);
    };
  }, [projectId, eventType, enabled]);
}

/**
 * Hook for checking WebSocket connection status.
 *
 * @returns True if WebSocket is connected, false otherwise.
 *
 * @example
 * ```tsx
 * const isConnected = useWebSocketStatus();
 *
 * return (
 *   <div>
 *     Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
 *   </div>
 * );
 * ```
 */
export function useWebSocketStatus(): boolean {
  // This is a simple implementation - for real-time status updates,
  // you'd need to add state management and connection status events
  return wsClient.isConnected();
}
