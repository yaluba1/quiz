import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { HostProjector } from '../../src/components/host/HostProjector';
import { LobbyScreen } from '../../src/components/host/LobbyScreen';
import { LeaderboardSlide } from '../../src/components/host/LeaderboardSlide';
import { QuestionDisplay } from '../../src/components/host/QuestionDisplay';
import { LogoUploader } from '../../src/components/theme/LogoUploader';
import { QuizStudio } from '../../src/components/studio/QuizStudio';
import { QuestionAnalyticsTable } from '../../src/components/analytics/QuestionAnalyticsTable';
import { SessionSummaryCard } from '../../src/components/analytics/SessionSummaryCard';
import { Header } from '../../src/components/common/Header';
import { I18nProvider, useI18n } from '../../src/i18n/I18nProvider';
import * as hostSocketModule from '../../src/hooks/useHostSocket';
import * as authModule from '../../src/hooks/useAuth';
import { apiClient } from '../../src/lib/api-client';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/teacher/en/dashboard',
}));

describe('Branch Coverage Booster Tests', () => {
  it('covers HostProjector across all game states and errors', () => {
    // 1. Error state
    const mockHook = vi.spyOn(hostSocketModule, 'useHostSocket');
    mockHook.mockReturnValue({
      gameState: 'LOBBY',
      pin: null,
      sessionId: null,
      players: [],
      countdownSeconds: 0,
      currentQuestion: null,
      answerStats: { answeredCount: 0, totalPlayers: 0 },
      resultData: null,
      leaderboard: [],
      podium: [],
      error: 'Connection timeout',
      createRoom: vi.fn(),
      startGame: vi.fn(),
      showResults: vi.fn(),
      showLeaderboard: vi.fn(),
      nextQuestion: vi.fn(),
      endGame: vi.fn(),
      closeRoom: vi.fn(),
    });

    const { rerender } = render(
      <I18nProvider>
        <HostProjector quizId="q1" />
      </I18nProvider>
    );
    expect(screen.getByText('Connection timeout')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Back to Dashboard'));

    // 2. DISCONNECTED / initializing state
    mockHook.mockReturnValue({
      ...mockHook(),
      error: null,
      gameState: 'DISCONNECTED',
      pin: null,
    });
    rerender(
      <I18nProvider>
        <HostProjector quizId="q1" />
      </I18nProvider>
    );
    expect(screen.getByText(/Initializing classroom projector session/i)).toBeInTheDocument();

    // 3. LOBBY state
    mockHook.mockReturnValue({
      ...mockHook(),
      gameState: 'LOBBY',
      pin: '654321',
      players: [{ playerId: 'p1', nickname: 'John' }],
    });
    rerender(
      <I18nProvider>
        <HostProjector quizId="q1" sessionTitle="Science Test" />
      </I18nProvider>
    );
    expect(screen.getByText('Science Test')).toBeInTheDocument();
    expect(screen.getByTestId('game-pin-display')).toHaveTextContent('654321');

    // 4. COUNTDOWN state
    mockHook.mockReturnValue({
      ...mockHook(),
      gameState: 'COUNTDOWN',
      countdownSeconds: 3,
    });
    rerender(
      <I18nProvider>
        <HostProjector quizId="q1" />
      </I18nProvider>
    );
    expect(screen.getByTestId('countdown-display')).toHaveTextContent('3');

    // 5. QUESTION_RESULT state
    mockHook.mockReturnValue({
      ...mockHook(),
      gameState: 'QUESTION_RESULT',
      currentQuestion: {
        questionId: 'q-1',
        questionIndex: 0,
        totalQuestions: 2,
        questionText: 'Result Question',
        questionType: 'MULTIPLE_CHOICE',
        timeLimitSeconds: 20,
        options: [{ id: 'opt-1', orderIndex: 0, optionText: 'Opt A', colorShapeIndex: 0 }],
      },
      resultData: {
        questionId: 'q-1',
        correctOptionId: 'opt-1',
        distribution: { 'opt-1': 5 },
        answeredCount: 5,
        totalPlayers: 5,
      },
    });
    rerender(
      <I18nProvider>
        <HostProjector quizId="q1" />
      </I18nProvider>
    );
    expect(screen.getByTestId('results-chart')).toBeInTheDocument();

    // 6. LEADERBOARD state
    mockHook.mockReturnValue({
      ...mockHook(),
      gameState: 'LEADERBOARD',
      leaderboard: [{ playerId: 'p1', nickname: 'Leader', score: 2000, rank: 1 }],
    });
    rerender(
      <I18nProvider>
        <HostProjector quizId="q1" />
      </I18nProvider>
    );
    expect(screen.getByTestId('leaderboard-slide')).toBeInTheDocument();

    // 7. PODIUM state
    mockHook.mockReturnValue({
      ...mockHook(),
      gameState: 'PODIUM',
      podium: [{ rank: 1, playerId: 'p1', nickname: 'Champ', finalScore: 3000 }],
    });
    rerender(
      <I18nProvider>
        <HostProjector quizId="q1" />
      </I18nProvider>
    );
    expect(screen.getByTestId('podium-ceremony')).toBeInTheDocument();

    // 8. FINISHED state
    mockHook.mockReturnValue({
      ...mockHook(),
      gameState: 'FINISHED',
      sessionId: 'sess-done',
    });
    rerender(
      <I18nProvider>
        <HostProjector quizId="q1" />
      </I18nProvider>
    );
    expect(screen.getByText(/Session Finished/i)).toBeInTheDocument();
  });

  it('covers LogoUploader upload toggle and clear button', () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <I18nProvider>
        <LogoUploader logoUrl="https://example.com/logo.svg" onChange={onChange} />
      </I18nProvider>
    );

    // Clear logo button
    const clearBtn = screen.getByTestId('clear-logo-button');
    fireEvent.click(clearBtn);
    expect(onChange).toHaveBeenCalledWith(null);

    // Switch to upload mode
    fireEvent.click(screen.getByText('Upload'));
    expect(screen.getByText(/Upload Logo/i)).toBeInTheDocument();

    // Upload a valid file
    const file = new File(['<svg></svg>'], 'school.svg', { type: 'image/svg+xml' });
    const input = screen.getByTestId('logo-file-input');
    fireEvent.change(input, { target: { files: [file] } });

    // Upload an invalid file
    const invalidFile = new File(['hello'], 'doc.txt', { type: 'text/plain' });
    fireEvent.change(input, { target: { files: [invalidFile] } });
    expect(screen.getByText(/Only SVG, PNG, and WebP/i)).toBeInTheDocument();
  });

  it('covers QuizStudio in edit mode and question management', async () => {
    vi.spyOn(authModule, 'useAuth').mockReturnValue({
      user: { id: 'prof-1', email: 'prof@test.com', name: 'Dr. Jane' },
      loading: false,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      requestPasswordReset: vi.fn(),
      resetPassword: vi.fn(),
      refreshUser: vi.fn(),
    });

    vi.spyOn(apiClient, 'request').mockImplementation(async (endpoint) => {
      if (endpoint === '/themes') return { systemThemes: [], customThemes: [] };
      if (endpoint === '/quizzes/existing-quiz') {
        return {
          quiz: {
            id: 'existing-quiz',
            title: 'Existing Quiz',
            description: 'Desc',
            tags: ['test'],
          },
          questions: [
            {
              orderIndex: 0,
              questionText: 'Q1',
              questionType: 'MULTIPLE_CHOICE',
              timeLimitSeconds: 20,
              pointsMultiplier: '1.00',
              showAnswersOnDevice: false,
              answerOptions: [
                { orderIndex: 0, optionText: 'A', isCorrect: true },
                { orderIndex: 1, optionText: 'B', isCorrect: false },
              ],
            },
            {
              orderIndex: 1,
              questionText: 'Q2',
              questionType: 'TRUE_FALSE',
              timeLimitSeconds: 10,
              pointsMultiplier: '2.00',
              showAnswersOnDevice: true,
              answerOptions: [
                { orderIndex: 0, optionText: 'True', isCorrect: true },
                { orderIndex: 1, optionText: 'False', isCorrect: false },
              ],
            },
          ],
        };
      }
      return { success: true };
    });

    render(
      <I18nProvider>
        <QuizStudio initialQuizId="existing-quiz" isNew={false} />
      </I18nProvider>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Existing Quiz')).toBeInTheDocument();
    });

    // Save existing quiz
    const saveBtn = screen.getByTestId('save-quiz-button');
    fireEvent.click(saveBtn);
  });

  it('covers accuracy percentage threshold colors in QuestionAnalyticsTable', () => {
    const lowAccuracyQuestions = [
      {
        questionId: 'q-low',
        questionText: 'Hard question',
        totalAnswers: 10,
        correctCount: 2,
        wrongCount: 8,
        correctPercentage: 20,
        averageResponseTimeMs: 5000,
        optionDistribution: { '1': 2, '2': 8 },
      },
      {
        questionId: 'q-med',
        questionText: 'Medium question',
        totalAnswers: 10,
        correctCount: 6,
        wrongCount: 4,
        correctPercentage: 60,
        averageResponseTimeMs: 4000,
        optionDistribution: { '1': 6, '2': 4 },
      },
    ];

    render(
      <I18nProvider>
        <QuestionAnalyticsTable questions={lowAccuracyQuestions} />
      </I18nProvider>
    );

    expect(screen.getByText('20%')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
  });

  it('covers Header unauthenticated view', () => {
    vi.spyOn(authModule, 'useAuth').mockReturnValue({
      user: null,
      loading: false,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      requestPasswordReset: vi.fn(),
      resetPassword: vi.fn(),
      refreshUser: vi.fn(),
    });

    render(
      <I18nProvider>
        <Header />
      </I18nProvider>
    );

    expect(screen.getByText('Sign In')).toBeInTheDocument();
    expect(screen.queryByTestId('logout-button')).not.toBeInTheDocument();
  });

  it('covers I18n translation with variable replacement and fallback', () => {
    function TestComponent() {
      const { t } = useI18n();
      return (
        <div>
          <span data-testid="var-replacement">{t('host.joinInstructions', { url: 'my-quiz.org' })}</span>
          <span data-testid="fallback-key">{t('non.existent.key')}</span>
        </div>
      );
    }

    render(
      <I18nProvider>
        <TestComponent />
      </I18nProvider>
    );

    expect(screen.getByTestId('var-replacement')).toHaveTextContent('my-quiz.org');
    expect(screen.getByTestId('fallback-key')).toHaveTextContent('non.existent.key');
  });

  it('covers LobbyScreen empty state and LeaderboardSlide final question', () => {
    // Empty lobby
    const { rerender } = render(
      <I18nProvider>
        <LobbyScreen
          pin="123456"
          players={[]}
          onStartGame={vi.fn()}
        />
      </I18nProvider>
    );
    expect(screen.getByText(/Waiting for students to connect/i)).toBeInTheDocument();

    // Leaderboard final question
    rerender(
      <I18nProvider>
        <LeaderboardSlide
          leaderboard={[{ playerId: 'p1', nickname: 'NoStreak', score: 100, rank: 1 }]}
          isFinalQuestion={true}
          onNext={vi.fn()}
        />
      </I18nProvider>
    );
    expect(screen.getByTestId('leaderboard-next-button')).toHaveTextContent('Final Podium');
  });

  it('covers useAuth error handling', async () => {
    vi.restoreAllMocks();
    const { useAuth } = await import('../../src/hooks/useAuth');
    const { renderHook, act } = await import('@testing-library/react');
    const { MockAuthProvider } = await import('../../src/services/auth/mock.service');
    const { setAuthProvider } = await import('../../src/services/auth/auth-factory');

    const mockAuth = new MockAuthProvider();
    setAuthProvider(mockAuth);

    const { result } = renderHook(() => useAuth());

    // Login failure
    await act(async () => {
      try {
        await result.current.login({ email: 'bad@test.com', password: 'wrong-password' });
      } catch {
        // expected
      }
    });
    await waitFor(() => {
      expect(result.current.error).toBe('Invalid email or password');
    });
  });

  it('covers sound-synthesizer muted branch and auth-factory env resolution', async () => {
    const { hostSounds } = await import('../../src/lib/sound-synthesizer');
    hostSounds.setMuted(true);
    expect(hostSounds.getMuted()).toBe(true);
    hostSounds.playPlayerJoined();
    hostSounds.playTick();
    hostSounds.playTimeUp();
    hostSounds.playFanfare();
    hostSounds.setMuted(false);

    // auth factory env branches
    const { getAuthProvider, setAuthProvider } = await import('../../src/services/auth/auth-factory');
    setAuthProvider(null as any);
    process.env.NEXT_PUBLIC_AUTH_PROVIDER = 'mock';
    const p1 = getAuthProvider();
    expect(p1).toBeDefined();

    setAuthProvider(null as any);
    process.env.NEXT_PUBLIC_AUTH_PROVIDER = 'self_hosted';
    const p2 = getAuthProvider();
    expect(p2).toBeDefined();
  });

  it('covers QuestionDisplay 2-options and 6-options layout, and timer expiration', () => {
    vi.useFakeTimers();
    const onTimeUp = vi.fn();

    // 2-options question
    const q2 = {
      questionId: 'q-2opt',
      questionIndex: 0,
      totalQuestions: 5,
      questionText: 'Is the sky blue?',
      questionType: 'TRUE_FALSE' as const,
      timeLimitSeconds: 2,
      options: [
        { id: 'opt-t', orderIndex: 0, optionText: 'True', colorShapeIndex: 0 },
        { id: 'opt-f', orderIndex: 1, optionText: 'False', colorShapeIndex: 1 },
      ],
    };

    const { rerender } = render(
      <I18nProvider>
        <QuestionDisplay question={q2} answeredCount={3} totalPlayers={10} onTimeUp={onTimeUp} />
      </I18nProvider>
    );

    expect(screen.getByText('Is the sky blue?')).toBeInTheDocument();
    expect(screen.getByTestId('countdown-timer-value')).toHaveTextContent('2');

    // Advance timer by 1s (secondsLeft = 1)
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByTestId('countdown-timer-value')).toHaveTextContent('1');

    // Advance timer by 1s more (secondsLeft <= 1 triggers clearInterval & onTimeUp)
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByTestId('countdown-timer-value')).toHaveTextContent('0');
    expect(onTimeUp).toHaveBeenCalledTimes(1);

    // 6-options question (grid-cols-3 branch)
    const q6 = {
      questionId: 'q-6opt',
      questionIndex: 1,
      totalQuestions: 5,
      questionText: 'Choose from 6 colors',
      questionType: 'MULTIPLE_CHOICE' as const,
      timeLimitSeconds: 30,
      options: [
        { id: 'o1', orderIndex: 0, optionText: 'Red', colorShapeIndex: 0 },
        { id: 'o2', orderIndex: 1, optionText: 'Blue', colorShapeIndex: 1 },
        { id: 'o3', orderIndex: 2, optionText: 'Green', colorShapeIndex: 2 },
        { id: 'o4', orderIndex: 3, optionText: 'Yellow', colorShapeIndex: 3 },
        { id: 'o5', orderIndex: 4, optionText: 'Purple', colorShapeIndex: 4 },
        { id: 'o6', orderIndex: 5, optionText: 'Pink', colorShapeIndex: 5 },
      ],
    };

    rerender(
      <I18nProvider>
        <QuestionDisplay question={q6} answeredCount={0} totalPlayers={10} />
      </I18nProvider>
    );

    expect(screen.getByText('Choose from 6 colors')).toBeInTheDocument();
    expect(screen.getByTestId('option-card-5')).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('covers SessionSummaryCard fallback values when title and classGroup are empty', () => {
    const emptySession = {
      id: 'sess-empty',
      quizId: 'q1',
      title: '',
      classGroup: '',
      pin: '111222',
      status: 'FINISHED' as const,
      totalParticipants: 0,
      averageScore: 0,
      overallAccuracyPercentage: 0,
      averageResponseTimeMs: 0,
      createdAt: '2026-10-08T00:00:00Z',
    };

    render(
      <I18nProvider>
        <SessionSummaryCard session={emptySession} />
      </I18nProvider>
    );

    expect(screen.getByText('Untitled Session')).toBeInTheDocument();
    expect(screen.getByText(/Cohort: General/i)).toBeInTheDocument();
  });

  it('covers QuestionAnalyticsTable high accuracy green badge threshold', () => {
    const highAccuracyQuestions = [
      {
        questionId: 'q-high',
        questionText: 'Easy question',
        totalAnswers: 20,
        correctCount: 18,
        wrongCount: 2,
        correctPercentage: 90,
        averageResponseTimeMs: 2500,
        optionDistribution: { '1': 18, '2': 2 },
      },
    ];

    render(
      <I18nProvider>
        <QuestionAnalyticsTable questions={highAccuracyQuestions} />
      </I18nProvider>
    );

    expect(screen.getByText('90%')).toBeInTheDocument();
  });
});

