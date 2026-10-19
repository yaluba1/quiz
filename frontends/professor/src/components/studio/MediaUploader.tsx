'use client';

import React, { useState, useRef } from 'react';
import {
  Image as ImageIcon,
  Music,
  Video as VideoIcon,
  Upload,
  Link as LinkIcon,
  Trash2,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { MediaType } from '../../types/quiz';
import { apiClient } from '../../lib/api-client';
import { useI18n } from '../../i18n/I18nProvider';

interface MediaUploaderProps {
  mediaUrl?: string | null;
  mediaType?: MediaType | null;
  onChange: (url: string | null, type: MediaType | null) => void;
}

export function inferMediaType(url: string): MediaType {
  const clean = url.split('?')[0].toLowerCase();
  if (clean.match(/\.(mp3|wav|ogg|aac|m4a|weba)$/)) return 'AUDIO';
  if (clean.match(/\.(mp4|webm|ogv|mov)$/)) return 'VIDEO';
  return 'IMAGE';
}

export function MediaUploader({ mediaUrl, mediaType, onChange }: MediaUploaderProps) {
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Determine current active media type (explicit or inferred)
  const currentType: MediaType = mediaType || (mediaUrl ? inferMediaType(mediaUrl) : 'IMAGE');

  const handleFileSelect = async (file: File) => {
    setErrorMessage(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const result = await apiClient.upload<{
        url: string;
        mediaType: MediaType;
        filename: string;
        size: number;
      }>('/media/upload', formData);

      onChange(result.url, result.mediaType);
    } catch (err: any) {
      setErrorMessage(err.message || t('studio.mediaUploadFailed'));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleManualUrlChange = (urlVal: string) => {
    setErrorMessage(null);
    const trimmed = urlVal.trim();
    if (!trimmed) {
      onChange(null, null);
    } else {
      onChange(trimmed, inferMediaType(trimmed));
    }
  };

  const handleClear = () => {
    setErrorMessage(null);
    onChange(null, null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3" data-testid="media-uploader">
      {/* Header & Mode Switcher */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          {currentType === 'AUDIO' ? (
            <Music className="w-4 h-4 text-purple-500" />
          ) : currentType === 'VIDEO' ? (
            <VideoIcon className="w-4 h-4 text-rose-500" />
          ) : (
            <ImageIcon className="w-4 h-4 text-blue-500" />
          )}
          <span>{t('studio.mediaTitle')}</span>
        </label>

        <div className="flex items-center gap-1 text-xs">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition ${
              mode === 'upload'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t('studio.mediaUploadTab')}
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition ${
              mode === 'url'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t('studio.mediaUrlTab')}
          </button>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,audio/*,video/*"
        onChange={onFileInputChange}
        className="hidden"
        data-testid="media-file-input"
      />

      {/* Error alert */}
      {errorMessage && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Active Media Preview if uploaded or provided */}
      {mediaUrl ? (
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {currentType === 'AUDIO' && <Music className="w-3 h-3 text-purple-500" />}
              {currentType === 'VIDEO' && <VideoIcon className="w-3 h-3 text-rose-500" />}
              {currentType === 'IMAGE' && <ImageIcon className="w-3 h-3 text-blue-500" />}
              {currentType === 'AUDIO'
                ? t('studio.mediaTypeAudio')
                : currentType === 'VIDEO'
                ? t('studio.mediaTypeVideo')
                : t('studio.mediaTypeImage')}
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
                title={t('studio.replaceMedia')}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{t('studio.replaceMedia')}</span>
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                title={t('studio.removeMedia')}
                data-testid="clear-media-button"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Media Player / Thumbnail Preview */}
          <div className="flex justify-center bg-white dark:bg-slate-950 p-2 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {currentType === 'IMAGE' && (
              <img
                src={mediaUrl}
                alt={t('studio.questionPreview')}
                className="max-h-48 object-contain rounded-lg"
              />
            )}
            {currentType === 'AUDIO' && (
              <div className="w-full py-2 px-1">
                <audio controls src={mediaUrl} className="w-full" />
              </div>
            )}
            {currentType === 'VIDEO' && (
              <video
                controls
                playsInline
                src={mediaUrl}
                className="max-h-48 rounded-lg object-contain w-full"
              />
            )}
          </div>
        </div>
      ) : (
        /* Empty State: Upload or URL Input */
        <div>
          {mode === 'upload' ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-5 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition ${
                isDragOver
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                  : 'border-slate-300 dark:border-slate-700 hover:border-emerald-500 bg-slate-50/50 dark:bg-slate-900/50'
              }`}
            >
              {isUploading ? (
                <div className="flex flex-col items-center gap-2 py-2">
                  <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    {t('studio.mediaUploading')}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-blue-500" />
                    <Music className="w-5 h-5 text-purple-500" />
                    <VideoIcon className="w-5 h-5 text-rose-500" />
                  </div>
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    {t('studio.mediaDropPrompt')}
                  </div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500 max-w-sm">
                    {t('studio.mediaFormatHints')}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <LinkIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="url"
                  value={mediaUrl || ''}
                  onChange={(e) => handleManualUrlChange(e.target.value)}
                  placeholder={t('studio.mediaUrlPlaceholder')}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 transition"
                  data-testid="media-url-input"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

