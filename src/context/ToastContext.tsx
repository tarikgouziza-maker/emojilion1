import React, { createContext, useContext, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';

interface Toast {
  id: string;
  message: string;
  emoji?: string;
}

interface ToastContextType {
  showToast: (message: string, emoji?: string) => void;
  copyEmoji: (emojiChar: string, emojiName?: string, e?: React.MouseEvent) => Promise<boolean>;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, emoji?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev.slice(-2), { id, message, emoji }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 2400);
  }, []);

  const copyEmoji = useCallback(async (emojiChar: string, emojiName?: string, e?: React.MouseEvent) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(emojiChar);
      } else {
        // Fallback
        const textArea = document.createElement('textarea');
        textArea.value = emojiChar;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      // Small confetti pop on click coordinates if available
      if (e) {
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;
        confetti({
          particleCount: 15,
          spread: 45,
          origin: { x, y },
          colors: ['#f59e0b', '#ec4899', '#3b82f6', '#10b981'],
          disableForReducedMotion: true,
          scalar: 0.8
        });
      }

      showToast('Copied to clipboard!', emojiChar);

      // Track analytics anonymously
      try {
        fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'copy', slug: emojiName ? emojiName.toLowerCase().replace(/\s+/g, '-') : undefined })
        }).catch(() => {});
      } catch (_) {}

      return true;
    } catch (err) {
      console.error('Failed to copy emoji:', err);
      showToast('Failed to copy', emojiChar);
      return false;
    }
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, copyEmoji }}>
      {children}
      {/* Toast Notification Container */}
      <div 
        aria-live="polite"
        className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none"
      >
        {toasts.map(toast => (
          <div
            key={toast.id}
            role="status"
            className="flex items-center gap-3 px-4 py-2.5 bg-slate-900/95 dark:bg-slate-100/95 text-white dark:text-slate-900 rounded-xl shadow-xl backdrop-blur-md border border-slate-700/50 dark:border-slate-300/50 transition-all duration-300 transform translate-y-0 opacity-100 font-medium text-sm pointer-events-auto"
          >
            {toast.emoji && (
              <span className="text-2xl font-emoji leading-none animate-bounce">
                {toast.emoji}
              </span>
            )}
            <div>
              <div className="font-semibold text-xs text-amber-400 dark:text-amber-600 uppercase tracking-wider">
                Copied!
              </div>
              <div className="text-slate-200 dark:text-slate-800 text-xs">
                {toast.message}
              </div>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
