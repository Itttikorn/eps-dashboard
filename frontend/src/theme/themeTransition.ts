/**
 * Disables all CSS transitions momentarily during theme toggling to prevent
 * asymmetric or patchy transitions and eliminating animation lag.
 * Implements the industry-standard pattern used by next-themes and shadcn/ui.
 */
function disableTransitionsTemporarily(): () => void {
  if (typeof document === 'undefined') return () => {};

  const css = document.createElement('style');
  css.appendChild(
    document.createTextNode(
      `*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}`
    )
  );
  document.head.appendChild(css);

  return () => {
    // Force a synchronous restyle
    (() => window.getComputedStyle(document.body))();

    // Re-enable transitions on the next tick
    setTimeout(() => {
      try {
        if (css.parentNode) {
          document.head.removeChild(css);
        }
      } catch {
        // Ignore removal errors
      }
    }, 1);
  };
}

/**
 * Applies the dark or light theme to document.documentElement and localStorage,
 * using Option 1 (instantaneous global synchronization with transitions disabled).
 *
 * @param isDark - whether dark mode should be enabled
 * @param disableTransition - whether to suppress transitions during the swap (default true)
 * @param persist - whether to save choice to localStorage (default true)
 */
export function applyTheme(isDark: boolean, disableTransition = true, persist = true): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const currentlyDark = root.classList.contains('dark');

  // If already at desired state, synchronize localStorage if persisting and exit
  if (currentlyDark === isDark) {
    if (persist) {
      try {
        localStorage.setItem('eps_theme', isDark ? 'dark' : 'light');
        localStorage.setItem('eps-theme', isDark ? 'dark' : 'light');
      } catch {
        // Ignore storage errors in restricted contexts
      }
    }
    return;
  }

  const cleanup = disableTransition ? disableTransitionsTemporarily() : () => {};

  if (isDark) {
    root.classList.add('dark');
    if (persist) {
      try {
        localStorage.setItem('eps_theme', 'dark');
        localStorage.setItem('eps-theme', 'dark');
      } catch {
        // Ignore
      }
    }
  } else {
    root.classList.remove('dark');
    if (persist) {
      try {
        localStorage.setItem('eps_theme', 'light');
        localStorage.setItem('eps-theme', 'light');
      } catch {
        // Ignore
      }
    }
  }

  cleanup();
}

/**
 * Helper to get the initial theme from localStorage or system media query.
 */
export function getInitialTheme(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const saved = localStorage.getItem('eps_theme') || localStorage.getItem('eps-theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return false;
  }
}
