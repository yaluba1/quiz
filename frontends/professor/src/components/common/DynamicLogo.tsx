'use client';

import React, { useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';

interface DynamicLogoProps {
  customLogoUrl?: string | null;
  className?: string;
  alt?: string;
}

export function DynamicLogo({
  customLogoUrl,
  className = 'h-[53.2px] w-auto',
  alt,
}: DynamicLogoProps) {
  const { t } = useI18n();
  const effectiveAlt = alt || t('common.openQuizLogoAlt');
  const [hasError, setHasError] = useState(false);
  const [lightFallbackIndex, setLightFallbackIndex] = useState(0);
  const [darkFallbackIndex, setDarkFallbackIndex] = useState(0);

  // If custom logo provided and hasn't failed, use it
  if (customLogoUrl && !hasError) {
    return (
      <img
        src={customLogoUrl}
        alt={effectiveAlt}
        className={className}
        onError={() => setHasError(true)}
        data-testid="dynamic-logo"
      />
    );
  }

  // Fallback candidates: try basePath /teacher/... first, then root /... if running without basePath
  const lightFallbackSources = [
    '/teacher/logo.svg',
    '/teacher/logo-light.svg',
    '/logo.svg',
    '/logo-light.svg',
  ];
  const currentLightFallback =
    lightFallbackSources[lightFallbackIndex] || '/teacher/logo.svg';

  const darkFallbackSources = [
    '/teacher/logo-dark.svg',
    '/logo-dark.svg',
  ];
  const currentDarkFallback =
    darkFallbackSources[darkFallbackIndex] || '/teacher/logo-dark.svg';

  return (
    <>
      {/* Light mode logo */}
      <img
        src={currentLightFallback}
        alt={effectiveAlt}
        className={`${className} dark:hidden`}
        onError={() => {
          if (lightFallbackIndex < lightFallbackSources.length - 1) {
            setLightFallbackIndex(lightFallbackIndex + 1);
          }
        }}
        data-testid="dynamic-logo"
      />
      {/* Dark mode logo */}
      <img
        src={currentDarkFallback}
        alt=""
        aria-hidden="true"
        className={`${className} hidden dark:block`}
        onError={() => {
          if (darkFallbackIndex < darkFallbackSources.length - 1) {
            setDarkFallbackIndex(darkFallbackIndex + 1);
          }
        }}
        data-testid="dynamic-logo-dark"
      />
    </>
  );
}
