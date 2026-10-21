'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useHostSocket } from '../../hooks/useHostSocket';
import { LobbyScreen } from './LobbyScreen';
import { QuestionDisplay } from './QuestionDisplay';
import { ResultsChart } from './ResultsChart';
import { LeaderboardSlide } from './LeaderboardSlide';
import { PodiumCeremony } from './PodiumCeremony';
import { useI18n } from '../../i18n/I18nProvider';

interface HostProjectorProps {
  quizId: string;
  sessionTitle?: string;
  classGroup?: string;
  themeId?: string;
  logoUrl?: string | null;
  executionMode?: 'MANUAL' | 'AUTOMATIC';
}

export function HostProjector({
  quizId,
  sessionTitle,
  classGroup,
  themeId,
  logoUrl,
  executionMode = 'MANUAL',
}: HostProjectorProps) {
  const { locale, t } = useI18n();
  const router = useRouter();

  const {
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
  } = useHostSocket();

  const prefix = `/${locale}`;

  // Automatically initialize room if in DISCONNECTED state
  React.useEffect(() => {
    if (gameState === 'DISCONNECTED') {
      createRoom({
        quizId,
        title: sessionTitle,
        classGroup,
        themeId,
        executionMode,
      });
    }
  }, [gameState, quizId, sessionTitle, classGroup, themeId, executionMode, createRoom]);

  // Navigate to analytics when finished
  React.useEffect(() => {
    if (gameState === 'FINISHED' && sessionId) {
      router.push(`${prefix}/analytics/${sessionId}`);
    }
  }, [gameState, sessionId, router, prefix]);

  if (error) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="p-6 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 max-w-md">
          <h3 className="text-lg font-black text-rose-600 dark:text-rose-400 mb-2">
            Failed to Host Session
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">{error}</p>
          <button
            type="button"
            onClick={() => router.push(`${prefix}/dashboard`)}
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'DISCONNECTED' || !pin) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
            Initializing classroom projector session...
          </p>
        </div>
      </div>
    );
  }

  if (gameState === 'LOBBY') {
    return (
      <LobbyScreen
        pin={pin}
        sessionTitle={sessionTitle}
        players={players}
        onStartGame={startGame}
        logoUrl={logoUrl}
      />
    );
  }

  if (gameState === 'COUNTDOWN') {
    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center text-center p-6">
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-500 mb-2">
          Get Ready!
        </span>
        <div
          className="text-8xl sm:text-9xl font-black text-slate-900 dark:text-white font-mono animate-pulse"
          data-testid="countdown-display"
        >
          {countdownSeconds}
        </div>
      </div>
    );
  }

  if (gameState === 'QUESTION_ACTIVE' && currentQuestion) {
    return (
      <div className="relative">
        <QuestionDisplay
          question={currentQuestion}
          answeredCount={answerStats.answeredCount}
          totalPlayers={answerStats.totalPlayers}
          onTimeUp={executionMode === 'AUTOMATIC' ? undefined : showResults}
        />
        {/* Professor Control / Mode Indicator Bar */}
        <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2">
          {executionMode === 'AUTOMATIC' ? (
            <div
              className="px-4 py-2 rounded-xl bg-purple-900/90 text-purple-200 text-xs font-bold shadow-lg backdrop-blur border border-purple-500/30 flex items-center gap-2 animate-pulse"
              data-testid="automatic-mode-indicator"
            >
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              <span>{t('host.autoAdvancing') || 'Automatic Mode (Advancing on timer)'}</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={showResults}
              className="px-5 py-2.5 rounded-xl bg-slate-900/90 dark:bg-white/90 text-white dark:text-slate-900 text-xs font-bold shadow-lg backdrop-blur hover:opacity-90 transition"
              data-testid="skip-to-results-button"
            >
              {t('host.revealAnswers')}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (gameState === 'QUESTION_RESULT' && currentQuestion && resultData) {
    return (
      <ResultsChart
        question={currentQuestion}
        resultData={resultData}
        onShowLeaderboard={showLeaderboard}
      />
    );
  }

  if (gameState === 'LEADERBOARD' && currentQuestion) {
    const isFinalQuestion = currentQuestion.questionIndex + 1 >= currentQuestion.totalQuestions;
    return (
      <LeaderboardSlide
        leaderboard={leaderboard}
        isFinalQuestion={isFinalQuestion}
        onNext={nextQuestion}
      />
    );
  }

  if (gameState === 'PODIUM') {
    return (
      <PodiumCeremony
        podium={podium}
        onEndSession={endGame}
      />
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 text-center">
      <p className="text-base font-bold text-slate-600 dark:text-slate-300">
        {t('host.sessionFinished')}
      </p>
    </div>
  );
}

