'use client';

import React from 'react';
import { Download, Printer } from 'lucide-react';
import { GameSessionDetail } from '../../types/session';
import { generateSessionCsv, downloadCsvFile } from '../../lib/csv-exporter';
import { useI18n } from '../../i18n/I18nProvider';

interface ExportToolbarProps {
  detail: GameSessionDetail;
}

export function ExportToolbar({ detail }: ExportToolbarProps) {
  const { t } = useI18n();

  const handleExportCsv = () => {
    const csvData = generateSessionCsv(detail);
    const filename = `session-${detail.session.pin}-${Date.now()}.csv`;
    downloadCsvFile(filename, csvData);
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div
      className="flex items-center gap-3 print:hidden"
      data-testid="export-toolbar"
    >
      <button
        type="button"
        onClick={handleExportCsv}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 text-xs font-bold transition shadow-sm"
        data-testid="export-csv-button"
      >
        <Download className="w-4 h-4 text-emerald-500" />
        <span>{t('analytics.exportCsv')}</span>
      </button>

      <button
        type="button"
        onClick={handlePrint}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 text-xs font-bold transition shadow-sm"
        data-testid="print-report-button"
      >
        <Printer className="w-4 h-4 text-blue-500" />
        <span>{t('analytics.printReport')}</span>
      </button>
    </div>
  );
}

