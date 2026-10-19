'use client';

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Users, Play, Sparkles } from 'lucide-react';
import { JoinedPlayer } from '../../types/socket';
import { DynamicLogo } from '../common/DynamicLogo';
import { useI18n } from '../../i18n/I18nProvider';

interface LobbyScreenProps {
  pin: string;
  sessionTitle?: string;
  players: JoinedPlayer[];
  onStartGame: () => void;
  logoUrl?: string | null;
}

export function LobbyScreen({
  pin,
  sessionTitle,
  players,
  onStartGame,
  logoUrl,
}: LobbyScreenProps) {
  const { t } = useI18n();

  // Host join URL for pupils
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const joinUrl = `${origin}/play?pin=${pin}`;

  return (
    <div
      className="min-h-[85vh] flex flex-col justify-between p-6 sm:p-10 max-w-7xl mx-auto"
      data-testid="lobby-screen"
    >
      {/* Top Banner: Logo & Session Title */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800">
        <DynamicLogo customLogoUrl={logoUrl} className="h-10 sm:h-12 w-auto" />
        {sessionTitle && (
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 truncate max-w-md">
            {sessionTitle}
          </h2>
        )}
      </div>

      {/* Main Center Area: Giant PIN & QR Code */}
      <div className="my-8 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left: PIN and Instructions */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 sm:p-12 border border-slate-200 dark:border-slate-700 shadow-xl text-center space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              {t('host.joinInstructions', { url: origin.replace(/^https?:\/\//, '') + '/play' })}
            </span>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {t('host.pin')}
            </div>
            <div
              className="text-6xl sm:text-8xl font-black tracking-widest text-slate-900 dark:text-white font-mono bg-slate-50 dark:bg-slate-900 py-4 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-inner"
              data-testid="game-pin-display"
            >
              {pin}
            </div>
          </div>

          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            {t('host.scanQr')}
          </p>
        </div>

        {/* Right: QR Code */}
        <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl">
          <div className="p-4 bg-white rounded-2xl shadow-md border border-slate-100">
            <QRCodeSVG
              value={joinUrl}
              size={220}
              level="H"
              includeMargin={false}
              data-testid="lobby-qr-code"
            />
          </div>
          <span className="mt-4 text-xs font-mono font-bold text-slate-400">
            {joinUrl}
          </span>
        </div>
      </div>

      {/* Bottom Area: Players Counter, Roster & Start Button */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span data-testid="players-count">{players.length}</span>
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                  {t('host.playersJoined')}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled={players.length === 0}
            onClick={onStartGame}
            className="px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-black text-base shadow-xl shadow-emerald-600/30 transition transform hover:scale-105 active:scale-95 flex items-center gap-2"
            data-testid="start-game-button"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>{t('host.startGame')}</span>
          </button>
        </div>

        {/* Player Badges Roster */}
        <div className="min-h-24 p-4 rounded-2xl bg-slate-100/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-wrap gap-2.5 items-center">
          {players.length === 0 ? (
            <div className="w-full text-center py-6 text-sm font-medium text-slate-400 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 animate-spin text-emerald-500" />
              <span>{t('host.waitingForPlayers')}</span>
            </div>
          ) : (
            players.map((p) => (
              <span
                key={p.playerId}
                className="px-3.5 py-1.5 rounded-full text-sm font-bold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 shadow-sm animate-in zoom-in-75 duration-200"
                data-testid={`player-badge-${p.playerId}`}
              >
                {p.nickname}
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

