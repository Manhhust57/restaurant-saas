import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { API_BASE_URL } from '../api/client';
import type { OrderChangedEvent } from './orderEvents';

type Options = {
    enabled: boolean;
    onOrderChanged: (event: OrderChangedEvent) => void;
};

type SharedSocket = {
    socket: Socket;
    refCount: number;
    disconnectTimer: ReturnType<typeof setTimeout> | null;
};

let shared: SharedSocket | null = null;

function getSharedSocket(): Socket {
    if (shared?.socket) return shared.socket;

    const socket = io(API_BASE_URL || undefined, {
        path: '/socket.io',
        withCredentials: true,
        // Prefer websocket; fall back to polling only if needed.
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 800,
        reconnectionDelayMax: 5_000,
    });

    shared = { socket, refCount: 0, disconnectTimer: null };
    return socket;
}

function retainSocket() {
    const current = getSharedSocket();
    if (!shared) return current;
    if (shared.disconnectTimer) {
        clearTimeout(shared.disconnectTimer);
        shared.disconnectTimer = null;
    }
    shared.refCount += 1;
    if (!current.connected) current.connect();
    return current;
}

function releaseSocket() {
    if (!shared) return;
    shared.refCount = Math.max(0, shared.refCount - 1);
    if (shared.refCount > 0) return;

    // Delay teardown so React StrictMode remount / brief HMR does not thrash sockets.
    shared.disconnectTimer = setTimeout(() => {
        if (!shared || shared.refCount > 0) return;
        shared.socket.removeAllListeners();
        shared.socket.disconnect();
        shared = null;
    }, 750);
}

export function useOrderRealtime({ enabled, onOrderChanged }: Options) {
    const [connected, setConnected] = useState(false);
    const handlerRef = useRef(onOrderChanged);
    handlerRef.current = onOrderChanged;

    useEffect(() => {
        if (!enabled) {
            setConnected(false);
            return;
        }

        const socket = retainSocket();

        const onConnect = () => setConnected(true);
        const onDisconnect = () => setConnected(false);
        const onChanged = (event: OrderChangedEvent) => {
            handlerRef.current(event);
        };

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('order.changed', onChanged);
        if (socket.connected) setConnected(true);

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off('order.changed', onChanged);
            setConnected(false);
            releaseSocket();
        };
    }, [enabled]);

    return { connected };
}
