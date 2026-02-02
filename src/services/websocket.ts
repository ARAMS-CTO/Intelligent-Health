/**
 * WebSocket Service for Real-time Features
 * 
 * Handles:
 * - Notification subscriptions
 * - Case collaboration
 * - Connection management
 */

type MessageHandler = (data: any) => void;

interface WebSocketConfig {
    reconnectInterval?: number;
    maxReconnectAttempts?: number;
}

class WebSocketService {
    private notificationSocket: WebSocket | null = null;
    private caseSocket: WebSocket | null = null;
    private handlers: Map<string, Set<MessageHandler>> = new Map();
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectInterval = 3000;
    private currentCaseId: string | null = null;

    private getBaseUrl(): string {
        // Convert http(s) to ws(s)
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        return `${protocol}//${window.location.host}/api`;
    }

    private getToken(): string | null {
        return localStorage.getItem('token');
    }

    // --- Notification Socket ---

    connectNotifications(): boolean {
        const token = this.getToken();
        if (!token) {
            console.warn('WebSocket: No token available');
            return false;
        }

        if (this.notificationSocket?.readyState === WebSocket.OPEN) {
            return true;
        }

        try {
            const url = `${this.getBaseUrl()}/ws/notifications?token=${encodeURIComponent(token)}`;
            this.notificationSocket = new WebSocket(url);

            this.notificationSocket.onopen = () => {
                console.log('WebSocket: Notifications connected');
                this.reconnectAttempts = 0;
                this.emit('connected', { type: 'notifications' });
            };

            this.notificationSocket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleMessage('notification', data);
                } catch (e) {
                    console.error('WebSocket: Failed to parse message', e);
                }
            };

            this.notificationSocket.onclose = (event) => {
                console.log('WebSocket: Notifications disconnected', event.code);
                this.emit('disconnected', { type: 'notifications', code: event.code });

                // Attempt reconnect if not intentional close
                if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.reconnectAttempts++;
                    setTimeout(() => this.connectNotifications(), this.reconnectInterval);
                }
            };

            this.notificationSocket.onerror = (error) => {
                console.error('WebSocket: Notification error', error);
                this.emit('error', { type: 'notifications', error });
            };

            return true;
        } catch (e) {
            console.error('WebSocket: Failed to connect', e);
            return false;
        }
    }

    disconnectNotifications(): void {
        if (this.notificationSocket) {
            this.notificationSocket.close(1000, 'User disconnect');
            this.notificationSocket = null;
        }
    }

    // --- Case Socket ---

    connectCase(caseId: string): boolean {
        const token = this.getToken();
        if (!token) return false;

        // Disconnect from previous case if any
        if (this.currentCaseId && this.currentCaseId !== caseId) {
            this.disconnectCase();
        }

        if (this.caseSocket?.readyState === WebSocket.OPEN && this.currentCaseId === caseId) {
            return true;
        }

        try {
            const url = `${this.getBaseUrl()}/ws/case/${caseId}?token=${encodeURIComponent(token)}`;
            this.caseSocket = new WebSocket(url);
            this.currentCaseId = caseId;

            this.caseSocket.onopen = () => {
                console.log(`WebSocket: Case ${caseId} connected`);
                this.emit('case_connected', { caseId });
            };

            this.caseSocket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleMessage('case', data);
                } catch (e) {
                    console.error('WebSocket: Failed to parse case message', e);
                }
            };

            this.caseSocket.onclose = (event) => {
                console.log(`WebSocket: Case ${caseId} disconnected`);
                this.emit('case_disconnected', { caseId, code: event.code });
                this.currentCaseId = null;
            };

            this.caseSocket.onerror = (error) => {
                console.error('WebSocket: Case error', error);
            };

            return true;
        } catch (e) {
            console.error('WebSocket: Failed to connect to case', e);
            return false;
        }
    }

    disconnectCase(): void {
        if (this.caseSocket) {
            this.caseSocket.close(1000, 'Left case');
            this.caseSocket = null;
            this.currentCaseId = null;
        }
    }

    // --- Send Methods ---

    sendCaseComment(content: string): void {
        if (this.caseSocket?.readyState === WebSocket.OPEN) {
            this.caseSocket.send(JSON.stringify({
                type: 'comment',
                content
            }));
        }
    }

    sendTypingIndicator(): void {
        if (this.caseSocket?.readyState === WebSocket.OPEN) {
            this.caseSocket.send(JSON.stringify({ type: 'typing' }));
        }
    }

    markNotificationRead(id: string): void {
        if (this.notificationSocket?.readyState === WebSocket.OPEN) {
            this.notificationSocket.send(JSON.stringify({
                type: 'mark_read',
                id
            }));
        }
    }

    // --- Event Handling ---

    private handleMessage(source: 'notification' | 'case', data: any): void {
        const eventType = data.type || 'message';
        this.emit(eventType, data);
        this.emit(`${source}:${eventType}`, data);
    }

    on(event: string, handler: MessageHandler): () => void {
        if (!this.handlers.has(event)) {
            this.handlers.set(event, new Set());
        }
        this.handlers.get(event)!.add(handler);

        // Return unsubscribe function
        return () => {
            this.handlers.get(event)?.delete(handler);
        };
    }

    off(event: string, handler: MessageHandler): void {
        this.handlers.get(event)?.delete(handler);
    }

    private emit(event: string, data: any): void {
        this.handlers.get(event)?.forEach(handler => {
            try {
                handler(data);
            } catch (e) {
                console.error('WebSocket: Handler error', e);
            }
        });
    }

    // --- Utility ---

    isNotificationConnected(): boolean {
        return this.notificationSocket?.readyState === WebSocket.OPEN;
    }

    isCaseConnected(): boolean {
        return this.caseSocket?.readyState === WebSocket.OPEN;
    }

    getCurrentCaseId(): string | null {
        return this.currentCaseId;
    }

    disconnectAll(): void {
        this.disconnectNotifications();
        this.disconnectCase();
    }
}

// Export singleton instance
export const websocketService = new WebSocketService();

// React hook for WebSocket
export function useWebSocket() {
    return websocketService;
}
