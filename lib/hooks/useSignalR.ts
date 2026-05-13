'use client';

import { useEffect, useState, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';

interface UseSignalROptions {
  hubUrl: string;
  autoConnect?: boolean;
}

export function useSignalR({ hubUrl, autoConnect = true }: UseSignalROptions) {
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        skipNegotiation: false,
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.ServerSentEvents,
      })
      .withAutomaticReconnect()
      .build();

    setConnection(newConnection);

    return () => {
      if (newConnection.state === signalR.HubConnectionState.Connected) {
        newConnection.stop();
      }
    };
  }, [hubUrl]);

  useEffect(() => {
    if (connection && autoConnect) {
      connection
        .start()
        .then(() => {
          setIsConnected(true);
          setError(null);
        })
        .catch((err) => {
          setError(err);
          setIsConnected(false);
        });

      connection.onclose(() => {
        setIsConnected(false);
      });

      connection.onreconnected(() => {
        setIsConnected(true);
      });
    }
  }, [connection, autoConnect]);

  const on = useCallback(
    (methodName: string, callback: (...args: any[]) => void) => {
      if (connection) {
        connection.on(methodName, callback);
      }
    },
    [connection]
  );

  const off = useCallback(
    (methodName: string, callback: (...args: any[]) => void) => {
      if (connection) {
        connection.off(methodName, callback);
      }
    },
    [connection]
  );

  const invoke = useCallback(
    async (methodName: string, ...args: any[]) => {
      if (connection && isConnected) {
        try {
          return await connection.invoke(methodName, ...args);
        } catch (err) {
          setError(err as Error);
          throw err;
        }
      }
    },
    [connection, isConnected]
  );

  return {
    connection,
    isConnected,
    error,
    on,
    off,
    invoke,
  };
}
