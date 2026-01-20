"use client"

import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';
import { ReactNode } from 'react';

/**
 * Client-side provider for i18next translation context.
 * Wraps the application with the I18nextProvider to enable multi-language support.
 */
export default function ClientI18nProvider({ children }: { children: ReactNode }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
