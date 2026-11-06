import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { getServerBaseUrl } from '../services/api';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const toast = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    // Establish socket connection (dynamic for native Android APK vs Web)
    const socketTarget = getServerBaseUrl() || '/';
    const socket = io(socketTarget, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🟢 WebSocket connected to server:', socket.id);
      setIsConnected(true);

      // If user is already logged in, register user room
      if (user?.id) {
        socket.emit('join_user', user.id);
      }
    });

    socket.on('disconnect', () => {
      console.log('🔴 WebSocket disconnected');
      setIsConnected(false);
    });

    // Real-time notifications
    socket.on('PAYMENT_RECEIVED', (data) => {
      toast.success(`Payment Received: ₹${data.amount} via ${data.method}!`);
      window.dispatchEvent(new CustomEvent('campussplit:settlement', { detail: data }));
    });

    socket.on('USER_BALANCE_CHANGED', (data) => {
      window.dispatchEvent(new CustomEvent('campussplit:balance_change', { detail: data }));
    });

    socket.on('GLOBAL_ACTIVITY', (data) => {
      window.dispatchEvent(new CustomEvent('campussplit:activity', { detail: data }));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Sync user room when auth user changes
  useEffect(() => {
    if (socketRef.current && socketRef.current.connected && user?.id) {
      socketRef.current.emit('join_user', user.id);
    }
  }, [user]);

  const joinGroup = (groupId) => {
    if (socketRef.current && groupId) {
      socketRef.current.emit('join_group', groupId);
    }
  };

  const leaveGroup = (groupId) => {
    if (socketRef.current && groupId) {
      socketRef.current.emit('leave_group', groupId);
    }
  };

  const joinAdmin = () => {
    if (socketRef.current) {
      socketRef.current.emit('join_admin');
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        isConnected,
        joinGroup,
        leaveGroup,
        joinAdmin,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
