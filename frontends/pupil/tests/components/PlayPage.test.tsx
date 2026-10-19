import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import PlayPage from '../../src/app/play/page';
import * as quizSocketHook from '../../src/hooks/useQuizSocket';
import { I18nProvider } from '../../src/i18n/I18nProvider';

vi.mock('../../src/hooks/useQuizSocket');

describe('PlayPage', () => {
  const baseMockReturn: any = {
    gameState: 'JOIN',
    pin: '',
    nickname: '',
    playerId: '',
    quizTitle: '',
    theme: null,
    countdownSeconds: 5,
    currentQuestion: null,
    selectedOptionId: null,
    isAnswerSubmitted: false,
    feedback: null,
    podium: [],
    errorMessage: null,
    isConnecting: false,
    joinRoom: vi.fn(),
    submitAnswer: vi.fn(),
    resetGame: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders JoinScreen in JOIN state', () => {
    (quizSocketHook.useQuizSocket as any).mockReturnValue({
      ...baseMockReturn,
      gameState: 'JOIN',
    });

    render(
      <I18nProvider>
        <PlayPage />
      </I18nProvider>
    );

    expect(screen.getByText(/Enter Game PIN/i)).toBeInTheDocument();
  });

  it('renders LobbyScreen in LOBBY state', () => {
    (quizSocketHook.useQuizSocket as any).mockReturnValue({
      ...baseMockReturn,
      gameState: 'LOBBY',
      pin: '654321',
      nickname: 'Alex',
      quizTitle: 'Geography 101',
    });

    render(
      <I18nProvider>
        <PlayPage />
      </I18nProvider>
    );

    expect(screen.getByText('Geography 101')).toBeInTheDocument();
    expect(screen.getByText('Alex')).toBeInTheDocument();
  });

  it('renders CountdownScreen in COUNTDOWN state', () => {
    (quizSocketHook.useQuizSocket as any).mockReturnValue({
      ...baseMockReturn,
      gameState: 'COUNTDOWN',
      countdownSeconds: 5,
    });

    render(
      <I18nProvider>
        <PlayPage />
      </I18nProvider>
    );

    expect(screen.getByText('Get Ready!')).toBeInTheDocument();
  });

  it('renders QuestionScreen in QUESTION_ACTIVE state', () => {
    (quizSocketHook.useQuizSocket as any).mockReturnValue({
      ...baseMockReturn,
      gameState: 'QUESTION_ACTIVE',
      currentQuestion: {
        questionId: 'q-1',
        questionIndex: 0,
        totalQuestions: 1,
        questionText: 'Capital of France?',
        questionType: 'SINGLE_CHOICE',
        timeLimitSeconds: 20,
        showAnswersOnDevice: true,
        options: [
          { id: 'opt-1', orderIndex: 0, optionText: 'Paris', colorShapeIndex: 0 },
        ],
      },
    });

    render(
      <I18nProvider>
        <PlayPage />
      </I18nProvider>
    );

    expect(screen.getByText('Capital of France?')).toBeInTheDocument();
  });

  it('renders FeedbackScreen in QUESTION_RESULT state', () => {
    (quizSocketHook.useQuizSocket as any).mockReturnValue({
      ...baseMockReturn,
      gameState: 'QUESTION_RESULT',
      feedback: {
        isCorrect: true,
        pointsEarned: 1000,
        streak: 2,
        responseTimeMs: 500,
      },
    });

    render(
      <I18nProvider>
        <PlayPage />
      </I18nProvider>
    );

    expect(screen.getByText('Correct!')).toBeInTheDocument();
  });

  it('renders Leaderboard placeholder in LEADERBOARD state', () => {
    (quizSocketHook.useQuizSocket as any).mockReturnValue({
      ...baseMockReturn,
      gameState: 'LEADERBOARD',
    });

    render(
      <I18nProvider>
        <PlayPage />
      </I18nProvider>
    );

    expect(screen.getByText(/Check the Host Screen!/i)).toBeInTheDocument();
  });

  it('renders PodiumScreen in PODIUM state and resets cleanly on Play Another Game', () => {
    const handleReset = vi.fn();
    (quizSocketHook.useQuizSocket as any).mockReturnValue({
      ...baseMockReturn,
      gameState: 'PODIUM',
      podium: [{ rank: 1, playerId: 'p-1', nickname: 'Alex', finalScore: 5000 }],
      resetGame: handleReset,
    });

    render(
      <I18nProvider>
        <PlayPage />
      </I18nProvider>
    );

    expect(screen.getByText('Final Podium')).toBeInTheDocument();
    const playAgainBtn = screen.getByRole('button', { name: /Play Another Game/i });
    playAgainBtn.click();
    expect(handleReset).toHaveBeenCalled();
  });

  it('renders error notice in ERROR state and handles reset', () => {
    const handleReset = vi.fn();
    (quizSocketHook.useQuizSocket as any).mockReturnValue({
      ...baseMockReturn,
      gameState: 'ERROR',
      errorMessage: 'Kicked by host',
      resetGame: handleReset,
    });

    render(
      <I18nProvider>
        <PlayPage />
      </I18nProvider>
    );

    expect(screen.getByText('Kicked by host')).toBeInTheDocument();
    screen.getByRole('button', { name: /Return to Join/i }).click();
    expect(handleReset).toHaveBeenCalled();
  });
});

