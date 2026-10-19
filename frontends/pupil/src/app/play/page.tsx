'use client';

import React, { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '../../components/common/Header';
import { JoinScreen } from '../../components/game/JoinScreen';
import { LobbyScreen } from '../../components/game/LobbyScreen';
import { CountdownScreen } from '../../components/game/CountdownScreen';
import { QuestionScreen } from '../../components/game/QuestionScreen';
import { FeedbackScreen } from '../../components/game/FeedbackScreen';
import { PodiumScreen } from '../../components/game/PodiumScreen';
import { useQuizSocket } from '../../hooks/useQuizSocket';
import { useI18n } from '../../i18n/I18nProvider';

function PlayGameContent() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const pinParam = searchParams?.get('pin') || '';

  const [initialPin, setInitialPin] = useState(pinParam);
  const [savedNickname, setSavedNickname] = useState('');

  const {
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
    isConnecting,
    joinRoom,
    submitAnswer,
    resetGame,
  } = useQuizSocket();

  useEffect(() => {
    if (nickname) {
      setSavedNickname(nickname);
    }
  }, [nickname]);

  const handleResetGame = useCallback(() => {
    setInitialPin('');
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', window.location.pathname);
    }
    resetGame();
  }, [resetGame]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-darkbg-primary transition-colors">
      <Header logoUrl={theme?.logoUrl} showBackToHome={gameState === 'JOIN'} />

      <main className="flex-1 flex flex-col items-center justify-center">
        {gameState === 'JOIN' && (
          <JoinScreen
            key={initialPin ? `pin-${initialPin}` : 'pin-empty'}
            initialPin={initialPin}
            initialNickname={savedNickname}
            isConnecting={isConnecting}
            errorMessage={errorMessage}
            onJoin={joinRoom}
          />
        )}

        {gameState === 'LOBBY' && (
          <LobbyScreen
            pin={pin}
            nickname={nickname}
            quizTitle={quizTitle}
          />
        )}

        {gameState === 'COUNTDOWN' && (
          <CountdownScreen initialSeconds={countdownSeconds} />
        )}

        {gameState === 'QUESTION_ACTIVE' && currentQuestion && (
          <QuestionScreen
            question={currentQuestion}
            selectedOptionId={selectedOptionId}
            isAnswerSubmitted={isAnswerSubmitted}
            onSelectOption={submitAnswer}
            onTimeExpired={() => submitAnswer(null)}
          />
        )}

        {gameState === 'QUESTION_RESULT' && feedback && (
          <FeedbackScreen feedback={feedback} />
        )}

        {gameState === 'LEADERBOARD' && (
          <div className="w-full max-w-md mx-auto p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">{t('game.leaderboardProjectorTitle')}</h2>
            <p className="text-slate-500">{t('game.leaderboardProjectorDesc')}</p>
          </div>
        )}

        {(gameState === 'PODIUM' || gameState === 'FINISHED') && (
          <PodiumScreen
            podium={podium}
            currentPlayerId={playerId}
            onReset={handleResetGame}
          />
        )}

        {gameState === 'ERROR' && (
          <div className="w-full max-w-md mx-auto p-6 text-center">
            <div className="p-6 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400">
              <h3 className="font-bold text-lg mb-2">{t('game.notice')}</h3>
              <p className="text-sm mb-4">{errorMessage || t('game.connectionFailed')}</p>
              <button
                type="button"
                onClick={handleResetGame}
                className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold text-sm"
              >
                {t('game.returnToJoin')}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function PlayPageFallback() {
  const { t } = useI18n();
  return <div className="min-h-screen flex items-center justify-center">{t('common.loading')}</div>;
}

export default function PlayPage() {
  return (
    <Suspense fallback={<PlayPageFallback />}>
      <PlayGameContent />
    </Suspense>
  );
}

