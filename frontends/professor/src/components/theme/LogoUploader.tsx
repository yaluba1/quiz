'use client';

import React, { useState } from 'react';
import { Upload, Link as LinkIcon, Trash2, AlertCircle } from 'lucide-react';
import { validateLogoFile } from '../../lib/theme-compiler';
import { useI18n } from '../../i18n/I18nProvider';

interface LogoUploaderProps {
  logoUrl?: string | null;
  onChange: (url: string | null) => void;
}

export function LogoUploader({ logoUrl, onChange }: LogoUploaderProps) {
  const { t } = useI18n();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mode, setMode] = useState<'upload' | 'url'>('url');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateLogoFile(file);
    if (!validation.valid) {
      setErrorMsg(validation.error || 'Invalid logo file');
      return;
    }

    // Convert to DataURL for immediate browser preview & saving
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onChange(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-3" data-testid="logo-uploader">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {t('themeStudio.logoTitle')}
        </label>
        <div className="flex items-center gap-1 text-xs">
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition ${
              mode === 'url' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t('themeStudio.modeUrl')}
          </button>
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition ${
              mode === 'upload' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t('themeStudio.modeUpload')}
          </button>
        </div>
      </div>

      {mode === 'url' ? (
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <LinkIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="url"
              value={logoUrl || ''}
              onChange={(e) => onChange(e.target.value || null)}
              placeholder={t('themeStudio.logoUrlPlaceholder')}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
              data-testid="logo-url-input"
            />
          </div>
          {logoUrl && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              title={t('themeStudio.clearLogo')}
              data-testid="clear-logo-button"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 hover:border-emerald-500 cursor-pointer text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 transition">
            <Upload className="w-4 h-4 text-emerald-500" />
            <span>{t('themeStudio.uploadFile')}</span>
            <input
              type="file"
              accept=".svg,.png,.webp"
              onChange={handleFileUpload}
              className="hidden"
              data-testid="logo-file-input"
            />
          </label>
          {logoUrl && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              title={t('themeStudio.clearLogo')}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
}

