import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useQuizSocket } from '../../src/hooks/useQuizSocket';
import * as socketIo from 'socket.io-client';

vi.mock('socket.io-client');

describe('useQuizSocket hook', () => {
  let mockSocket: any;
  let listeners: Record<string, Function>;

  beforeEach(() => {
    listeners = {};
    mockSocket = {
      connected: true,
      on: vi.fn((event, cb) => {
        listeners[event] = cb;
      }),
      emit: vi.fn(),
      disconnect: vi.fn(),
      connect: vi.fn(),
    };
    (socketIo.io as any).mockReturnValue(mockSocket);
  });

  it('initializes in JOIN state', () => {
    const { result } = renderHook(() => useQuizSocket());
    expect(result.current.gameState).toBe('JOIN');
    expect(result.current.pin).toBe('');
    expect(result.current.nickname).toBe('');
  });

  it('joins room and sets state to LOBBY on room:joined event', async () => {
    const { result } = renderHook(() => useQuizSocket());

    let joinPromise: Promise<boolean>;
    act(() => {
      joinPromise = result.current.joinRoom('123456', 'Tester');
    });

    // Simulate socket connect
    act(() => {
      listeners['connect']?.();
    });

    // Simulate room:joined event
    act(() => {
      listeners['room:joined']?.({
        success: true,
        playerId: 'p-1',
        pin: '123456',
        nickname: 'Tester',
        quizTitle: 'Math Quiz',
        theme: {
          primaryColor: '#93C572',
          secondaryColor: '#FF7518',
          backgroundColor: '#0F172A',
          fontFamily: 'sans-serif',
        },
      });
    });

    expect(result.current.gameState).toBe('LOBBY');
    expect(result.current.playerId).toBe('p-1');
    expect(result.current.quizTitle).toBe('Math Quiz');
    expect(result.current.theme?.primaryColor).toBe('#93C572');
  });

  it('handles room:error event', () => {
    const { result } = renderHook(() => useQuizSocket());

    act(() => {
      result.current.joinRoom('123456', 'Tester');
    });

    act(() => {
      listeners['room:error']?.({ code: 'ROOM_NOT_FOUND', message: 'Room not found' });
    });

    expect(result.current.errorMessage).toBe('Room not found');
  });

  it('handles room:player_kicked event', () => {
    const { result } = renderHook(() => useQuizSocket());

    act(() => {
      result.current.joinRoom('123456', 'Tester');
      listeners['room:player_kicked']?.({ reason: 'Removed by host' });
    });

    expect(result.current.gameState).toBe('ERROR');
    expect(result.current.errorMessage).toBe('Removed by host');
  });

  it('handles game flow from countdown through active question to feedback and podium', () => {
    const { result } = renderHook(() => useQuizSocket());

    act(() => {
      result.current.joinRoom('123456', 'Tester');
    });

    // 1. Countdown
    act(() => {
      listeners['game:countdown']?.({ seconds: 5 });
    });
    expect(result.current.gameState).toBe('COUNTDOWN');
    expect(result.current.countdownSeconds).toBe(5);

    // 2. Active Question
    act(() => {
      listeners['question:active']?.({
        questionId: 'q-1',
        questionIndex: 0,
        totalQuestions: 5,
        questionText: 'What is 2 + 2?',
        questionType: 'SINGLE_CHOICE',
        timeLimitSeconds: 20,
        showAnswersOnDevice: true,
        options: [
          { id: 'opt-1', orderIndex: 0, optionText: '3', colorShapeIndex: 0 },
          { id: 'opt-2', orderIndex: 1, optionText: '4', colorShapeIndex: 1 },
        ],
      });
    });

    expect(result.current.gameState).toBe('QUESTION_ACTIVE');
    expect(result.current.currentQuestion?.questionId).toBe('q-1');

    // 3. Submit Answer
    act(() => {
      result.current.submitAnswer('opt-2');
    });
    expect(result.current.isAnswerSubmitted).toBe(true);
    expect(result.current.selectedOptionId).toBe('opt-2');
    expect(mockSocket.emit).toHaveBeenCalledWith(
      'question:submit_answer',
      expect.objectContaining({
        questionId: 'q-1',
        optionId: 'opt-2',
      })
    );

    // 4. Result Pupil
    act(() => {
      listeners['question:result_pupil']?.({
        isCorrect: true,
        pointsEarned: 950,
        streak: 3,
        responseTimeMs: 1200,
      });
    });
    expect(result.current.gameState).toBe('QUESTION_RESULT');
    expect(result.current.feedback?.pointsEarned).toBe(950);
    expect(result.current.feedback?.isCorrect).toBe(true);

    // 5. Podium
    act(() => {
      listeners['game:podium']?.({
        podium: [
          { rank: 1, playerId: 'p-1', nickname: 'Tester', finalScore: 2500 },
        ],
      });
    });
    expect(result.current.gameState).toBe('PODIUM');
    expect(result.current.podium).toHaveLength(1);

    // 6. Reset
    act(() => {
      result.current.resetGame();
    });
    expect(result.current.gameState).toBe('JOIN');
    expect(result.current.feedback).toBeNull();
  });
});

