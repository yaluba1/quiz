'use client';

import React from 'react';
import Image from 'next/image';
import { useI18n } from '../../i18n/I18nProvider';

interface DynamicLogoProps {
  logoUrl?: string | null;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  alt?: string;
}

export function DynamicLogo({
  logoUrl,
  className = 'h-[53.2px] w-auto',
  width = 213,
  height = 53,
  priority = false,
  alt,
}: DynamicLogoProps) {
  let t: ((key: string) => string) | null = null;
  try {
    t = useI18n().t;
  } catch {
    // outside I18nProvider
  }

  const roomAlt = alt || (t ? t('common.quizRoomLogoAlt') : 'Quiz Room Logo');
  const defaultAlt = alt || (t ? t('common.openQuizLogoAlt') : 'OpenQuiz Logo');

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={roomAlt}
        className={className}
        style={{ maxHeight: height, width: 'auto', objectFit: 'contain' }}
      />
    );
  }

  return (
    <>
      <Image
        src="/logo.svg"
        alt={defaultAlt}
        width={width}
        height={height}
        className={`${className} dark:hidden`}
        priority={priority}
      />
      <Image
        src="/logo-dark.svg"
        alt=""
        aria-hidden="true"
        width={width}
        height={height}
        className={`${className} hidden dark:block`}
        priority={priority}
      />
    </>
  );
}
