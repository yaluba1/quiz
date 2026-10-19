'use client';

import React from 'react';
import { Tag, X } from 'lucide-react';
import { useI18n } from '../../i18n/I18nProvider';

interface TagFilterBarProps {
  tags: string[];
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
}

export function TagFilterBar({ tags, selectedTag, onSelectTag }: TagFilterBarProps) {
  const { t } = useI18n();

  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 py-1">
      <span className="text-xs text-slate-400 flex items-center gap-1 mr-1">
        <Tag className="w-3.5 h-3.5" />
        <span>{t('dashboard.tagsLabel')}</span>
      </span>

      {selectedTag && (
        <button
          type="button"
          onClick={() => onSelectTag(null)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-600 text-white shadow-sm transition hover:bg-emerald-700"
          data-testid="active-tag-chip"
        >
          <span>{selectedTag}</span>
          <X className="w-3 h-3" />
        </button>
      )}

      {tags
        .filter((t) => t !== selectedTag)
        .slice(0, 10)
        .map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => onSelectTag(tag)}
            className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition"
            data-testid={`tag-chip-${tag}`}
          >
            #{tag}
          </button>
        ))}
    </div>
  );
}

