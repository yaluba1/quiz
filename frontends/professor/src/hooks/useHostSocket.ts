'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  HostGameState,
  JoinedPlayer,
  QuestionActivePayload,
  QuestionResultHostPayload,
  LeaderboardEntry,
  PodiumEntry,
} from '../types/socket';
import { hostSounds } from '../lib/sound-synthesizer';

interface UseHostSocketOptions {
  wsUrl?: string;
}

export function useHostSocket(options: UseHostSocketOptions = {}) {
  const getWsUrl = useCallback(() => {
    if (options.wsUrl) return options.wsUrl;
    if (process.env.NEXT_PUBLIC_WS_URL) return process.env.NEXT_PUBLIC_WS_URL;
    if (typeof window !== 'undefined') {
      if (window.location.port === '3000') {
        return 'http://localhost:4000';
      }
      return window.location.origin;
    }
    return 'http://localhost:4000';
  }, [options.wsUrl]);

  const wsUrl = getWsUrl();

  const [gameState, setGameState] = useState<HostGameState>('DISCONNECTED');
  const [pin, setPin] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [players, setPlayers] = useState<JoinedPlayer[]>([]);
  const [countdownSeconds, setCountdownSeconds] = useState<number>(0);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionActivePayload | null>(null);
  const [answerStats, setAnswerStats] = useState<{ answeredCount: number; totalPlayers: number }>({
    answeredCount: 0,
    totalPlayers: 0,
  });
  const [resultData, setResultData] = useState<QuestionResultHostPayload | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [podium, setPodium] = useState<PodiumEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const countdownIntervalRef = useRef<any>(null);

  useEffect(() => {
    const socket = io(wsUrl, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      autoConnect: true,
      withCredentials: true,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      // connected to socket server
    });

    socket.on('room:created', (data: { pin: string; sessionId: string }) => {
      setPin(data.pin);
      setSessionId(data.sessionId);
      setGameState('LOBBY');
      setError(null);
    });

    socket.on('player:joined', (player: JoinedPlayer) => {
      setPlayers((prev) => {
        if (prev.some((p) => p.playerId === player.playerId)) return prev;
        return [...prev, player];
      });
      hostSounds.playPlayerJoined();
    });

    socket.on('player:left', (data: { playerId: string }) => {
      setPlayers((prev) => prev.filter((p) => p.playerId !== data.playerId));
    });

    socket.on('game:countdown', (data: { seconds: number }) => {
      setGameState('COUNTDOWN');
      setCountdownSeconds(data.seconds);

      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      let rem = data.seconds;
      hostSounds.playTick();

      countdownIntervalRef.current = setInterval(() => {
        rem -= 1;
        if (rem > 0) {
          setCountdownSeconds(rem);
          hostSounds.playTick();
        } else {
          clearInterval(countdownIntervalRef.current);
        }
      }, 1000);
    });

    socket.on('question:active', (data: QuestionActivePayload) => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      setCurrentQuestion(data);
      setResultData(null);
      setAnswerStats({ answeredCount: 0, totalPlayers: players.length });
      setGameState('QUESTION_ACTIVE');
    });

    socket.on('question:answer_received', (data: { answeredCount: number; totalPlayers: number }) => {
      setAnswerStats(data);
    });

    socket.on('question:result_host', (data: QuestionResultHostPayload) => {
      setResultData(data);
      setGameState('QUESTION_RESULT');
      hostSounds.playTimeUp();
    });

    socket.on('game:leaderboard', (data: { topPlayers: LeaderboardEntry[] }) => {
      setLeaderboard(data.topPlayers);
      setGameState('LEADERBOARD');
    });

    socket.on('game:podium', (data: { podium: PodiumEntry[] }) => {
      setPodium(data.podium);
      setGameState('PODIUM');
      hostSounds.playFanfare();
    });

    socket.on('game:ended', () => {
      setGameState('FINISHED');
    });

    socket.on('room:closed', () => {
      setGameState('FINISHED');
    });

    socket.on('room:error', (err: { message: string }) => {
      setError(err.message || 'Unknown room error');
    });

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      socket.disconnect();
    };
  }, [wsUrl]);

  const createRoom = useCallback(
    (payload: {
      quizId: string;
      title?: string;
      classGroup?: string;
      themeId?: string;
      durationMinutes?: number;
      executionMode?: 'MANUAL' | 'AUTOMATIC';
    }) => {
      if (!socketRef.current) return;
      socketRef.current.emit('room:create', payload);
    },
    []
  );

  const startGame = useCallback(() => {
    if (!socketRef.current || !pin) return;
    socketRef.current.emit('game:start', { pin });
  }, [pin]);

  const showResults = useCallback(() => {
    if (!socketRef.current || !pin) return;
    socketRef.current.emit('question:show_result', { pin });
  }, [pin]);

  const showLeaderboard = useCallback(() => {
    if (!socketRef.current || !pin) return;
    socketRef.current.emit('game:show_leaderboard', { pin });
  }, [pin]);

  const nextQuestion = useCallback(() => {
    if (!socketRef.current || !pin) return;
    socketRef.current.emit('game:next_question', { pin });
  }, [pin]);

  const endGame = useCallback(() => {
    if (!socketRef.current || !pin) return;
    socketRef.current.emit('game:end', { pin });
  }, [pin]);

  const closeRoom = useCallback(() => {
    if (!socketRef.current || !pin) return;
    socketRef.current.emit('room:close', { pin });
  }, [pin]);

  return {
    gameState,
    pin,
    sessionId,
    players,
    countdownSeconds,
    currentQuestion,
    answerStats,
    resultData,
    leaderboard,
    podium,
    error,
    createRoom,
    startGame,
    showResults,
    showLeaderboard,
    nextQuestion,
    endGame,
    closeRoom,
  };
}

