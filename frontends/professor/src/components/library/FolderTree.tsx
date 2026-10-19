'use client';

import React from 'react';
import { Folder, FolderOpen, ChevronRight } from 'lucide-react';
import { useI18n } from '../../i18n/I18nProvider';

interface FolderTreeProps {
  folders: string[];
  selectedFolder: string | null;
  onSelectFolder: (folder: string | null) => void;
}

export function FolderTree({ folders, selectedFolder, onSelectFolder }: FolderTreeProps) {
  const { t } = useI18n();

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-700">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {t('dashboard.foldersTitle')}
        </h4>
        {selectedFolder && (
          <button
            type="button"
            onClick={() => onSelectFolder(null)}
            className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            {t('common.clear')}
          </button>
        )}
      </div>

      <div className="space-y-1">
        <button
          type="button"
          onClick={() => onSelectFolder(null)}
          className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            selectedFolder === null
              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 font-bold'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
          data-testid="folder-all"
        >
          <FolderOpen className="w-4 h-4" />
          <span>{t('dashboard.allFolders')}</span>
        </button>

        {folders.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => onSelectFolder(f)}
            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              selectedFolder === f
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 font-bold'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
            data-testid={`folder-${f}`}
          >
            <div className="flex items-center gap-2 truncate">
              <Folder className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{f}</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}

