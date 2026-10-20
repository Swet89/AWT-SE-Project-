import { Injectable, effect, signal } from '@angular/core';

const STORAGE_KEY = 'odyssey-theme';

/**
 * Handles dark / light mode. Applies a `data-theme` attribute on <html>,
 * which every color token in styles.scss reacts to, and remembers the
 * choice in localStorage.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly isDark = signal<boolean>(this.readInitial());

  constructor() {
    effect(() => {
      const dark = this.isDark();
      document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
      try {
        localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light');
      } catch {
        /* storage may be unavailable (e.g. private browsing) - safe to ignore */
      }
    });
  }

  toggle(): void {
    this.isDark.update((value) => !value);
  }

  private readInitial(): boolean {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return stored === 'dark';
    } catch {
      /* ignore */
    }
    return (
      typeof window !== 'undefined' &&
      !!window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    );
  }
}
