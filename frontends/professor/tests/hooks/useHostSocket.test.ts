import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHostSocket } from '../../src/hooks/useHostSocket';

// Create socket mock
const mockSocketHandlers: Record<string, Function> = {};
const mockSocket = {
  on: vi.fn((event: string, handler: Function) => {
    mockSocketHandlers[event] = handler;
  }),
  emit: vi.fn(),
  disconnect: vi.fn(),
};

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}));

describe('useHostSocket Hook Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(mockSocketHandlers).forEach((key) => delete mockSocketHandlers[key]);
  });

  it('manages complete host game flow state machine', async () => {
    const { result } = renderHook(() => useHostSocket());

    expect(result.current.gameState).toBe('DISCONNECTED');

    // 1. Create Room
    act(() => {
      result.current.createRoom({ quizId: 'quiz-1', title: 'Midterm 4B' });
    });
    expect(mockSocket.emit).toHaveBeenCalledWith('room:create', {
      quizId: 'quiz-1',
      title: 'Midterm 4B',
    });

    // Server broadcasts room:created
    act(() => {
      mockSocketHandlers['room:created']?.({ pin: '123456', sessionId: 'sess-1' });
    });
    expect(result.current.gameState).toBe('LOBBY');
    expect(result.current.pin).toBe('123456');
    expect(result.current.sessionId).toBe('sess-1');

    // 2. Players join and leave
    act(() => {
      mockSocketHandlers['player:joined']?.({ playerId: 'p1', nickname: 'Alice' });
      mockSocketHandlers['player:joined']?.({ playerId: 'p2', nickname: 'Bob' });
    });
    expect(result.current.players.length).toBe(2);

    act(() => {
      mockSocketHandlers['player:left']?.({ playerId: 'p2' });
    });
    expect(result.current.players.length).toBe(1);

    // 3. Start Game -> Countdown
    act(() => {
      result.current.startGame();
    });
    expect(mockSocket.emit).toHaveBeenCalledWith('game:start', { pin: '123456' });

    act(() => {
      mockSocketHandlers['game:countdown']?.({ seconds: 5 });
    });
    expect(result.current.gameState).toBe('COUNTDOWN');
    expect(result.current.countdownSeconds).toBe(5);

    // 4. Question Active
    act(() => {
      mockSocketHandlers['question:active']?.({
        questionId: 'q-1',
        questionIndex: 0,
        totalQuestions: 2,
        questionText: 'What is 2+2?',
        questionType: 'MULTIPLE_CHOICE',
        timeLimitSeconds: 20,
        options: [
          { id: 'opt-1', orderIndex: 0, optionText: '3', colorShapeIndex: 0 },
          { id: 'opt-2', orderIndex: 1, optionText: '4', colorShapeIndex: 1 },
        ],
      });
    });
    expect(result.current.gameState).toBe('QUESTION_ACTIVE');
    expect(result.current.currentQuestion?.questionText).toBe('What is 2+2?');

    // 5. Answer received
    act(() => {
      mockSocketHandlers['question:answer_received']?.({ answeredCount: 1, totalPlayers: 1 });
    });
    expect(result.current.answerStats.answeredCount).toBe(1);

    // 6. Show Results
    act(() => {
      result.current.showResults();
    });
    expect(mockSocket.emit).toHaveBeenCalledWith('question:show_result', { pin: '123456' });

    act(() => {
      mockSocketHandlers['question:result_host']?.({
        questionId: 'q-1',
        correctOptionId: 'opt-2',
        distribution: { 'opt-1': 0, 'opt-2': 1 },
        answeredCount: 1,
        totalPlayers: 1,
      });
    });
    expect(result.current.gameState).toBe('QUESTION_RESULT');
    expect(result.current.resultData?.correctOptionId).toBe('opt-2');

    // 7. Show Leaderboard
    act(() => {
      result.current.showLeaderboard();
    });
    expect(mockSocket.emit).toHaveBeenCalledWith('game:show_leaderboard', { pin: '123456' });

    act(() => {
      mockSocketHandlers['game:leaderboard']?.({
        topPlayers: [{ playerId: 'p1', nickname: 'Alice', score: 1000, rank: 1 }],
      });
    });
    expect(result.current.gameState).toBe('LEADERBOARD');
    expect(result.current.leaderboard.length).toBe(1);

    // 8. Next question trigger & Podium
    act(() => {
      result.current.nextQuestion();
    });
    expect(mockSocket.emit).toHaveBeenCalledWith('game:next_question', { pin: '123456' });

    act(() => {
      mockSocketHandlers['game:podium']?.({
        podium: [{ rank: 1, playerId: 'p1', nickname: 'Alice', finalScore: 1000 }],
      });
    });
    expect(result.current.gameState).toBe('PODIUM');
    expect(result.current.podium.length).toBe(1);

    // 9. End Game / Close room
    act(() => {
      result.current.endGame();
    });
    expect(mockSocket.emit).toHaveBeenCalledWith('game:end', { pin: '123456' });

    act(() => {
      mockSocketHandlers['game:ended']?.();
    });
    expect(result.current.gameState).toBe('FINISHED');

    // 10. Close room manually
    act(() => {
      result.current.closeRoom();
    });
    expect(mockSocket.emit).toHaveBeenCalledWith('room:close', { pin: '123456' });

    // 11. Error handling
    act(() => {
      mockSocketHandlers['room:error']?.({ message: 'Boom' });
    });
    expect(result.current.error).toBe('Boom');
  });
});

