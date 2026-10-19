'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight, Loader2, User, KeyRound } from 'lucide-react';
import { validateNickname } from '../../lib/profanity';
import { useI18n } from '../../i18n/I18nProvider';

interface JoinScreenProps {
  initialPin?: string;
  initialNickname?: string;
  isConnecting: boolean;
  errorMessage: string | null;
  onJoin: (pin: string, nickname: string) => void;
}

export function JoinScreen({
  initialPin = '',
  initialNickname = '',
  isConnecting,
  errorMessage,
  onJoin,
}: JoinScreenProps) {
  const { t } = useI18n();
  const [pinDigits, setPinDigits] = useState<string[]>(() => {
    const arr = new Array(6).fill('');
    if (initialPin) {
      const clean = initialPin.replace(/\D/g, '').slice(0, 6);
      for (let i = 0; i < clean.length; i++) {
        arr[i] = clean[i];
      }
    }
    return arr;
  });

  const [nickname, setNickname] = useState(initialNickname);
  const [validationError, setValidationError] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first empty PIN digit or nickname
    const firstEmpty = pinDigits.findIndex((d) => !d);
    if (firstEmpty !== -1 && inputRefs.current[firstEmpty]) {
      inputRefs.current[firstEmpty]?.focus();
    }
  }, []);

  const handleDigitChange = (index: number, value: string) => {
    const char = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...pinDigits];
    newDigits[index] = char;
    setPinDigits(newDigits);
    setValidationError(null);

    // Auto-advance to next input
    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pinDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newDigits = [...pinDigits];
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    setPinDigits(newDigits);

    const nextIndex = Math.min(pasted.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const pin = pinDigits.join('');

    if (pin.length !== 6) {
      setValidationError(t('errors.invalidPin'));
      return;
    }

    const nickValidation = validateNickname(nickname);
    if (!nickValidation.isValid) {
      if (nickValidation.errorMessage === 'Nickname contains inappropriate words') {
        setValidationError(t('errors.profanityBlocked'));
      } else {
        setValidationError(t('errors.invalidNickname'));
      }
      return;
    }

    setValidationError(null);
    onJoin(pin, nickValidation.sanitized);
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 py-8 sm:py-12 flex flex-col justify-center min-h-[calc(100vh-4rem)]">
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-darkbg-card border border-slate-200 dark:border-darkbg-border shadow-xl">
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            {t('game.joinTitle')}
          </h2>
          <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
            {t('game.joinSubtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 6-Digit PIN Boxes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-brand-pistachio" />
              <span>{t('game.pinLabel')}</span>
            </label>
            <div className="flex gap-2 sm:gap-3 justify-center">
              {pinDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    inputRefs.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  onPaste={handlePaste}
                  aria-label={t('game.digitAria', { index: String(idx + 1) })}
                  className="w-11 h-14 sm:w-12 sm:h-16 text-center text-2xl font-mono font-bold rounded-xl border-2 border-slate-200 dark:border-darkbg-border bg-slate-50 dark:bg-darkbg-primary text-slate-900 dark:text-white focus:outline-none focus:border-brand-pistachio focus:ring-2 focus:ring-brand-pistachio/20 transition-all"
                />
              ))}
            </div>
          </div>

          {/* Nickname Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-brand-pumpkin" />
              <span>{t('game.nicknameLabel')}</span>
            </label>
            <input
              type="text"
              maxLength={50}
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value);
                setValidationError(null);
              }}
              placeholder={t('game.nicknamePlaceholder')}
              className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-200 dark:border-darkbg-border bg-slate-50 dark:bg-darkbg-primary text-slate-900 dark:text-white text-base font-medium placeholder:text-slate-400 focus:outline-none focus:border-brand-pumpkin focus:ring-2 focus:ring-brand-pumpkin/20 transition-all"
            />
          </div>

          {/* Error Message */}
          {(validationError || errorMessage) && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-medium text-center">
              {validationError || errorMessage}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isConnecting}
            className="w-full min-h-[64px] flex items-center justify-center gap-2 rounded-2xl bg-brand-pistachio hover:bg-brand-pistachio-dark text-white text-lg font-bold shadow-lg shadow-brand-pistachio/30 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] transition-all"
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{t('game.connecting')}</span>
              </>
            ) : (
              <>
                <span>{t('game.joinBtn')}</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

