'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  GameState,
  QuestionData,
  PupilFeedback,
  PodiumEntry,
  ThemeMeta,
  JoinSuccessData,
} from '../types/game';
import { injectThemeVariables } from '../lib/theme-injector';
import { soundSynthesizer } from '../lib/sound-synthesizer';

export interface UseQuizSocketReturn {
  gameState: GameState;
  pin: string;
  nickname: string;
  playerId: string;
  quizTitle: string;
  theme: ThemeMeta | null;
  countdownSeconds: number;
  currentQuestion: QuestionData | null;
  selectedOptionId: string | null;
  isAnswerSubmitted: boolean;
  feedback: PupilFeedback | null;
  podium: PodiumEntry[];
  errorMessage: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  joinRoom: (pin: string, nickname: string) => Promise<boolean>;
  submitAnswer: (optionId: string | null) => void;
  resetGame: () => void;
}

export function useQuizSocket(): UseQuizSocketReturn {
  const [gameState, setGameState] = useState<GameState>('JOIN');
  const [pin, setPin] = useState<string>('');
  const [nickname, setNickname] = useState<string>('');
  const [playerId, setPlayerId] = useState<string>('');
  const [quizTitle, setQuizTitle] = useState<string>('');
  const [theme, setTheme] = useState<ThemeMeta | null>(null);

  const [countdownSeconds, setCountdownSeconds] = useState<number>(5);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionData | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<PupilFeedback | null>(null);
  const [podium, setPodium] = useState<PodiumEntry[]>([]);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  const socketRef = useRef<Socket | null>(null);
  const pinRef = useRef<string>('');
  const currentQuestionRef = useRef<QuestionData | null>(null);

  pinRef.current = pin;
  currentQuestionRef.current = currentQuestion;

  const getSocketUrl = useCallback(() => {
    if (typeof window === 'undefined') return '';
    return process.env.NEXT_PUBLIC_WS_URL || window.location.origin;
  }, []);

  const initSocket = useCallback(() => {
    if (socketRef.current?.connected) {
      return socketRef.current;
    }

    const url = getSocketUrl();
    const socket = io(url, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      setErrorMessage(null);
    });

    socket.on('disconnect', (reason) => {
      setIsConnected(false);
      if (reason === 'io server disconnect') {
        socket.connect();
      }
    });

    socket.on('connect_error', () => {
      setIsConnected(false);
      setIsConnecting(false);
    });

    // Room Events
    socket.on('room:joined', (data: JoinSuccessData) => {
      setIsConnecting(false);
      setPlayerId(data.playerId);
      setPin(data.pin);
      setNickname(data.nickname);
      if (data.quizTitle) setQuizTitle(data.quizTitle);
      if (data.theme) {
        setTheme(data.theme);
        injectThemeVariables(data.theme);
      }
      setGameState('LOBBY');
      setErrorMessage(null);
    });

    socket.on('room:error', (err: { code: string; message: string }) => {
      setIsConnecting(false);
      setErrorMessage(err.message || 'Room error occurred');
    });

    socket.on('room:player_kicked', (data: { reason: string }) => {
      setGameState('ERROR');
      setErrorMessage(data.reason || 'You have been kicked from the room');
    });

    // Game Flow Events
    socket.on('game:countdown', (data: { seconds?: number }) => {
      setGameState('COUNTDOWN');
      const secs = typeof data?.seconds === 'number' ? data.seconds : 5;
      setCountdownSeconds(secs);
      soundSynthesizer.playTick();
    });

    socket.on('question:active', (data: QuestionData) => {
      setGameState('QUESTION_ACTIVE');
      setCurrentQuestion(data);
      setSelectedOptionId(null);
      setIsAnswerSubmitted(false);
      setFeedback(null);
    });

    socket.on('question:result_pupil', (res: PupilFeedback) => {
      setGameState('QUESTION_RESULT');
      setFeedback(res);
      if (res.isCorrect) {
        soundSynthesizer.playCorrect();
      } else {
        soundSynthesizer.playIncorrect();
      }
    });

    socket.on('question:result_host', () => {
      setGameState((prev) => (prev === 'QUESTION_ACTIVE' ? 'QUESTION_RESULT' : prev));
    });

    socket.on('game:leaderboard', () => {
      setGameState('LEADERBOARD');
    });

    socket.on('game:podium', (data: { podium: PodiumEntry[] }) => {
      setGameState('PODIUM');
      setPodium(data.podium || []);
      soundSynthesizer.playFanfare();
    });

    socket.on('game:ended', () => {
      setGameState('FINISHED');
    });

    return socket;
  }, [getSocketUrl]);

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  const joinRoom = useCallback(
    async (targetPin: string, targetNickname: string): Promise<boolean> => {
      setErrorMessage(null);
      setIsConnecting(true);

      const socket = initSocket();

      return new Promise<boolean>((resolve) => {
        socket.emit(
          'room:join',
          { pin: targetPin.trim(), nickname: targetNickname.trim() },
          (response?: { data?: JoinSuccessData; error?: { message: string } }) => {
            setIsConnecting(false);
            if (response?.error) {
              setErrorMessage(response.error.message);
              resolve(false);
            } else if (response?.data?.success) {
              setPlayerId(response.data.playerId);
              setPin(response.data.pin);
              setNickname(response.data.nickname);
              if (response.data.quizTitle) setQuizTitle(response.data.quizTitle);
              if (response.data.theme) {
                setTheme(response.data.theme);
                injectThemeVariables(response.data.theme);
              }
              setGameState('LOBBY');
              resolve(true);
            } else {
              resolve(true);
            }
          }
        );
      });
    },
    [initSocket]
  );

  const submitAnswer = useCallback(
    (optionId: string | null) => {
      if (!socketRef.current || isAnswerSubmitted || !currentQuestionRef.current) {
        return;
      }

      setSelectedOptionId(optionId);
      setIsAnswerSubmitted(true);
      if (optionId) {
        soundSynthesizer.playTap();
      }

      socketRef.current.emit('question:submit_answer', {
        pin: pinRef.current,
        questionId: currentQuestionRef.current.questionId,
        optionId: optionId || null,
        clientSendTime: Date.now(),
      });
    },
    [isAnswerSubmitted]
  );

  const resetGame = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setGameState('JOIN');
    setPin('');
    setNickname('');
    setPlayerId('');
    setQuizTitle('');
    setTheme(null);
    setCurrentQuestion(null);
    setSelectedOptionId(null);
    setIsAnswerSubmitted(false);
    setFeedback(null);
    setPodium([]);
    setErrorMessage(null);
    setIsConnected(false);
    setIsConnecting(false);
    injectThemeVariables(null);
  }, []);

  return {
    gameState,
    pin,
    nickname,
    playerId,
    quizTitle,
    theme,
    countdownSeconds,
    currentQuestion,
    selectedOptionId,
    isAnswerSubmitted,
    feedback,
    podium,
    errorMessage,
    isConnected,
    isConnecting,
    joinRoom,
    submitAnswer,
    resetGame,
  };
}

