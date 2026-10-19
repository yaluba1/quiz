'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useI18n } from '../../i18n/I18nProvider';

export function FaqSection() {
  const { t } = useI18n();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    { q: t('landing.faq1Q'), a: t('landing.faq1A') },
    { q: t('landing.faq2Q'), a: t('landing.faq2A') },
    { q: t('landing.faq3Q'), a: t('landing.faq3A') },
  ];

  return (
    <section className="py-16 sm:py-24 bg-slate-50/50 dark:bg-darkbg-card/20 border-t border-slate-200/60 dark:border-darkbg-border/60">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <h2 className="text-3xl font-extrabold text-center text-slate-900 dark:text-white mb-10">
          {t('landing.faqTitle')}
        </h2>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="rounded-2xl bg-white dark:bg-darkbg-card border border-slate-200 dark:border-darkbg-border overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 font-semibold text-slate-900 dark:text-white"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-brand-pistachio' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 sm:px-6 sm:pb-6 text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-darkbg-border/50 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

