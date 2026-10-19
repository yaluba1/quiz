import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuestionDisplay } from '../../src/components/host/QuestionDisplay';
import { LeaderboardSlide } from '../../src/components/host/LeaderboardSlide';
import { HostProjector } from '../../src/components/host/HostProjector';
import { I18nProvider } from '../../src/i18n/I18nProvider';
import * as hostSocketModule from '../../src/hooks/useHostSocket';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/teacher/en/host/1',
}));

describe('Host Extra Components Tests', () => {
  it('renders QuestionDisplay countdown ring and options', () => {
    const onTimeUp = vi.fn();
    const mockQuestion = {
      questionId: 'q-1',
      questionIndex: 0,
      totalQuestions: 5,
      questionText: 'What is the speed of light?',
      questionType: 'MULTIPLE_CHOICE' as const,
      timeLimitSeconds: 20,
      mediaUrl: 'https://example.com/speed.png',
      options: [
        { id: '1', orderIndex: 0, optionText: '300,000 km/s', colorShapeIndex: 0 },
        { id: '2', orderIndex: 1, optionText: '150,000 km/s', colorShapeIndex: 1 },
      ],
    };

    render(
      <I18nProvider>
        <QuestionDisplay
          question={mockQuestion}
          answeredCount={10}
          totalPlayers={15}
          onTimeUp={onTimeUp}
        />
      </I18nProvider>
    );

    expect(screen.getByTestId('question-display')).toBeInTheDocument();
    expect(screen.getByText('What is the speed of light?')).toBeInTheDocument();
    expect(screen.getByTestId('countdown-timer-value')).toHaveTextContent('20');
    expect(screen.getByTestId('answer-stats')).toHaveTextContent('10 / 15');
    expect(screen.getByText('300,000 km/s')).toBeInTheDocument();
  });

  it('renders LeaderboardSlide rankings and next action', () => {
    const onNext = vi.fn();
    const mockLeaderboard = [
      { playerId: 'p1', nickname: 'Ada', score: 2500, rank: 1, streak: 4 },
      { playerId: 'p2', nickname: 'Alan', score: 2100, rank: 2 },
    ];

    render(
      <I18nProvider>
        <LeaderboardSlide
          leaderboard={mockLeaderboard}
          isFinalQuestion={false}
          onNext={onNext}
        />
      </I18nProvider>
    );

    expect(screen.getByTestId('leaderboard-slide')).toBeInTheDocument();
    expect(screen.getByText('Ada')).toBeInTheDocument();
    expect(screen.getByText('4 Streak')).toBeInTheDocument();

    const nextBtn = screen.getByTestId('leaderboard-next-button');
    fireEvent.click(nextBtn);
    expect(onNext).toHaveBeenCalled();
  });

  it('renders HostProjector in various game states', () => {
    // Mock hook state as QUESTION_ACTIVE
    vi.spyOn(hostSocketModule, 'useHostSocket').mockReturnValue({
      gameState: 'QUESTION_ACTIVE',
      pin: '123456',
      sessionId: 'sess-1',
      players: [],
      countdownSeconds: 5,
      currentQuestion: {
        questionId: 'q-1',
        questionIndex: 0,
        totalQuestions: 1,
        questionText: 'Active test question',
        questionType: 'MULTIPLE_CHOICE',
        timeLimitSeconds: 20,
        options: [{ id: '1', orderIndex: 0, optionText: 'Opt 1', colorShapeIndex: 0 }],
      },
      answerStats: { answeredCount: 2, totalPlayers: 5 },
      resultData: null,
      leaderboard: [],
      podium: [],
      error: null,
      createRoom: vi.fn(),
      startGame: vi.fn(),
      showResults: vi.fn(),
      showLeaderboard: vi.fn(),
      nextQuestion: vi.fn(),
      endGame: vi.fn(),
      closeRoom: vi.fn(),
    });

    render(
      <I18nProvider>
        <HostProjector quizId="quiz-1" />
      </I18nProvider>
    );

    expect(screen.getByText('Active test question')).toBeInTheDocument();
    expect(screen.getByTestId('skip-to-results-button')).toBeInTheDocument();
  });

  it('renders HostProjector in automatic mode with auto indicator and without manual skip button', () => {
    vi.spyOn(hostSocketModule, 'useHostSocket').mockReturnValue({
      gameState: 'QUESTION_ACTIVE',
      pin: '123456',
      sessionId: 'sess-1',
      players: [],
      countdownSeconds: 5,
      currentQuestion: {
        questionId: 'q-1',
        questionIndex: 0,
        totalQuestions: 1,
        questionText: 'Active test question',
        questionType: 'MULTIPLE_CHOICE',
        timeLimitSeconds: 20,
        options: [{ id: '1', orderIndex: 0, optionText: 'Opt 1', colorShapeIndex: 0 }],
      },
      answerStats: { answeredCount: 2, totalPlayers: 5 },
      resultData: null,
      leaderboard: [],
      podium: [],
      error: null,
      createRoom: vi.fn(),
      startGame: vi.fn(),
      showResults: vi.fn(),
      showLeaderboard: vi.fn(),
      nextQuestion: vi.fn(),
      endGame: vi.fn(),
      closeRoom: vi.fn(),
    });

    render(
      <I18nProvider>
        <HostProjector quizId="quiz-1" executionMode="AUTOMATIC" />
      </I18nProvider>
    );

    expect(screen.getByText('Active test question')).toBeInTheDocument();
    expect(screen.getByTestId('automatic-mode-indicator')).toBeInTheDocument();
    expect(screen.queryByTestId('skip-to-results-button')).not.toBeInTheDocument();
  });
});

