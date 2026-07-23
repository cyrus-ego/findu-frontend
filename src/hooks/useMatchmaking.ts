'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getMatchmakingSocket } from '@/lib/socket';
import { matchmakingApi, type QueueStatus, type JoinMatchmakingPayload } from '@/lib/matchmaking-api';

const MAX_WAIT_SECONDS = 30 * 60; // 30 phút tối đa

export function useMatchmaking() {
  const [isInQueue, setIsInQueue] = useState(false);
  const [status, setStatus] = useState<QueueStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const onMatchRef = useRef<((roomId: string) => void) | null>(null);
  const payloadRef = useRef<JoinMatchmakingPayload | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  // Client-side stopwatch — tích tắc mỗi giây khi đang trong queue
  useEffect(() => {
    if (isInQueue) {
      startTimeRef.current = Date.now() - elapsedSeconds * 1000;
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        if (elapsed >= MAX_WAIT_SECONDS) {
          // Hết 30 phút thực sự → dừng hẳn
          setIsInQueue(false);
          setStatus(null);
          setElapsedSeconds(0);
          setError('Hết thời gian chờ (30 phút). Vui lòng thử lại.');
          const socket = getMatchmakingSocket();
          socket.emit('queue:leave');
          matchmakingApi.leave().catch(() => {});
        } else {
          setElapsedSeconds(elapsed);
        }
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isInQueue]);

  useEffect(() => {
    const socket = getMatchmakingSocket();

    const onJoined = (data: QueueStatus) => {
      setIsInQueue(true);
      setStatus(data);
      setError(null);
    };

    const onPosition = (data: QueueStatus) => {
      setStatus(data);
      setIsInQueue(data.inQueue);
    };

    const onLeft = () => {
      setIsInQueue(false);
      setStatus(null);
      setElapsedSeconds(0);
    };

    const onTimeout = () => {
      // Auto-rejoin nếu chưa quá 30 phút
      if (elapsedSeconds < MAX_WAIT_SECONDS && payloadRef.current) {
        // Re-join tự động, không reset elapsed
        matchmakingApi.join(payloadRef.current).then((newStatus) => {
          setStatus(newStatus);
          setIsInQueue(true);
          const sock = getMatchmakingSocket();
          sock.emit('queue:sync');
        }).catch(() => {
          setIsInQueue(false);
          setStatus(null);
          setElapsedSeconds(0);
          setError('Không thể tiếp tục tìm kiếm. Vui lòng thử lại.');
        });
      } else {
        setIsInQueue(false);
        setStatus(null);
        setElapsedSeconds(0);
        setError('Hết thời gian chờ (30 phút). Vui lòng thử lại.');
      }
    };

    const onMatchFound = ({ roomId }: { roomId: string }) => {
      setIsInQueue(false);
      setStatus(null);
      setElapsedSeconds(0);
      onMatchRef.current?.(roomId);
    };

    const onSocketError = (data: { message?: string }) => {
      setError(data?.message || 'Có lỗi xảy ra');
    };

    socket.on('queue:joined', onJoined);
    socket.on('queue:position', onPosition);
    socket.on('queue:left', onLeft);
    socket.on('queue:timeout', onTimeout);
    socket.on('match:found', onMatchFound);
    socket.on('error', onSocketError);

    return () => {
      socket.off('queue:joined', onJoined);
      socket.off('queue:position', onPosition);
      socket.off('queue:left', onLeft);
      socket.off('queue:timeout', onTimeout);
      socket.off('match:found', onMatchFound);
      socket.off('error', onSocketError);
    };
  }, [elapsedSeconds]);

  const joinQueue = useCallback(
    async (payload: JoinMatchmakingPayload, onMatchFound: (roomId: string) => void) => {
      setError(null);
      setElapsedSeconds(0);
      onMatchRef.current = onMatchFound;
      payloadRef.current = payload;

      try {
        // HTTP: validate + vào Redis queue
        const initialStatus = await matchmakingApi.join(payload);

        const socket = getMatchmakingSocket();
        socket.auth = { token: localStorage.getItem('accessToken') || '' };

        if (!socket.connected) {
          await new Promise<void>((resolve, reject) => {
            socket.once('connect', () => resolve());
            socket.once('connect_error', (err) => reject(err));
            socket.connect();
          });
        }

        // WebSocket: cập nhật socketId + nhận position/match real-time
        socket.emit('queue:sync');

        setIsInQueue(initialStatus.inQueue);
        setStatus(initialStatus);
      } catch (err: any) {
        setError(err.message || 'Không thể vào hàng đợi');
        throw err;
      }
    },
    [],
  );

  const leaveQueue = useCallback(async () => {
    try {
      const socket = getMatchmakingSocket();
      socket.emit('queue:leave');
      await matchmakingApi.leave();
    } catch {
      // vẫn reset UI
    } finally {
      setIsInQueue(false);
      setStatus(null);
      setElapsedSeconds(0);
    }
  }, []);

  // Cleanup khi unmount trang
  useEffect(() => {
    return () => {
      if (isInQueue) {
        const socket = getMatchmakingSocket();
        socket.emit('queue:leave');
        matchmakingApi.leave().catch(() => {});
      }
    };
  }, [isInQueue]);

  return {
    isInQueue,
    status,
    position: status?.position ?? 0,
    queueSize: status?.queueSize ?? 0,
    elapsedSeconds,
    error,
    joinQueue,
    leaveQueue,
  };
}
