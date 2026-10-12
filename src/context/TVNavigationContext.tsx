import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

export interface TVFocusable {
  id: string;
  group: string;
  order?: number;
  ref: HTMLElement | null;
  onSelect?: () => void;
  meta?: any;
}

interface TVNavigationContextType {
  focusedId: string | null;
  setFocusedId: (id: string | null) => void;
  registerFocusable: (item: TVFocusable) => void;
  unregisterFocusable: (id: string) => void;
  navigateDirection: (direction: 'up' | 'down' | 'left' | 'right') => void;
  triggerSelect: () => void;
  triggerBack: () => void;
  isVirtualRemoteOpen: boolean;
  setIsVirtualRemoteOpen: (open: boolean) => void;
  playFeedbackSound: (type?: 'move' | 'select' | 'back' | 'fanfare') => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
}

const TVNavigationContext = createContext<TVNavigationContextType | undefined>(undefined);

// Web Audio API generator for authentic TV remote sound effects without external audio files
class TVSoundEngine {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
  }

  play(type: 'move' | 'select' | 'back' | 'fanfare') {
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      if (type === 'move') {
        // Subtle soft wooden click / pop
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.04);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'select') {
        // High bright chime
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.setValueAtTime(880, now + 0.05); // A5
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'back') {
        // Descending soft cue
        osc.type = 'sine';
        osc.frequency.setValueAtTime(392, now); // G4
        osc.frequency.exponentialRampToValueAtTime(261.63, now + 0.08); // C4
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'fanfare') {
        // Winner fanfare chord
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C Major arpeggio
        notes.forEach((freq, idx) => {
          if (!this.ctx) return;
          const o = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          o.connect(g);
          g.connect(this.ctx.destination);
          o.type = 'triangle';
          o.frequency.setValueAtTime(freq, now + idx * 0.09);
          g.gain.setValueAtTime(0.12, now + idx * 0.09);
          g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.35);
          o.start(now + idx * 0.09);
          o.stop(now + idx * 0.09 + 0.4);
        });
      }
    } catch {
      // Audio context might be restricted before user gesture
    }
  }
}

const soundEngine = new TVSoundEngine();

export const TVNavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [isVirtualRemoteOpen, setIsVirtualRemoteOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const focusablesRef = useRef<Map<string, TVFocusable>>(new Map());

  const playFeedbackSound = useCallback((type: 'move' | 'select' | 'back' | 'fanfare' = 'move') => {
    if (soundEnabled) {
      soundEngine.play(type);
    }
  }, [soundEnabled]);

  const registerFocusable = useCallback((item: TVFocusable) => {
    focusablesRef.current.set(item.id, item);
    // If nothing focused yet and this is an initial home item, focus it
    setFocusedId((prev) => {
      if (!prev && item.id.startsWith('nav-home')) {
        return item.id;
      }
      return prev;
    });
  }, []);

  const unregisterFocusable = useCallback((id: string) => {
    focusablesRef.current.delete(id);
    setFocusedId((prev) => (prev === id ? null : prev));
  }, []);

  // Spatial search algorithm for 2D 10-foot navigation
  const navigateDirection = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    const focusables = Array.from(focusablesRef.current.values()).filter(
      (f) => f.ref && f.ref.offsetParent !== null && !f.ref.hasAttribute('disabled')
    );

    if (focusables.length === 0) return;

    // If nothing is focused currently, pick the first visible item
    if (!focusedId || !focusablesRef.current.has(focusedId)) {
      const first = focusables[0];
      if (first) {
        setFocusedId(first.id);
        playFeedbackSound('move');
        first.ref?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      }
      return;
    }

    const current = focusablesRef.current.get(focusedId);
    if (!current || !current.ref) return;

    const currentRect = current.ref.getBoundingClientRect();
    const currentCenter = {
      x: currentRect.left + currentRect.width / 2,
      y: currentRect.top + currentRect.height / 2,
    };

    let bestCandidate: TVFocusable | null = null;
    let minDistance = Infinity;

    // Check same group sequential priority first for left/right
    const currentGroup = current.group;
    const sameGroupItems = focusables
      .filter((f) => f.group === currentGroup && f.id !== current.id)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    if ((direction === 'left' || direction === 'right') && sameGroupItems.length > 0 && current.order !== undefined) {
      const targetOrder = direction === 'right' ? current.order + 1 : current.order - 1;
      const directNeighbor = sameGroupItems.find((f) => f.order === targetOrder);
      if (directNeighbor) {
        bestCandidate = directNeighbor;
      }
    }

    // Spatial geometry fallback
    if (!bestCandidate) {
      for (const candidate of focusables) {
        if (candidate.id === current.id || !candidate.ref) continue;

        const candRect = candidate.ref.getBoundingClientRect();
        const candCenter = {
          x: candRect.left + candRect.width / 2,
          y: candRect.top + candRect.height / 2,
        };

        const dx = candCenter.x - currentCenter.x;
        const dy = candCenter.y - currentCenter.y;

        let isDirectionValid = false;
        let primaryDist = 0;
        let secondaryDist = 0;

        switch (direction) {
          case 'right':
            isDirectionValid = dx > 8;
            primaryDist = dx;
            secondaryDist = Math.abs(dy);
            break;
          case 'left':
            isDirectionValid = dx < -8;
            primaryDist = Math.abs(dx);
            secondaryDist = Math.abs(dy);
            break;
          case 'down':
            isDirectionValid = dy > 8;
            primaryDist = dy;
            secondaryDist = Math.abs(dx);
            break;
          case 'up':
            isDirectionValid = dy < -8;
            primaryDist = Math.abs(dy);
            secondaryDist = Math.abs(dx);
            break;
        }

        if (isDirectionValid) {
          // Weight secondary axis to favor elements directly in line
          const weightedDistance = primaryDist + secondaryDist * 1.8;
          if (weightedDistance < minDistance) {
            minDistance = weightedDistance;
            bestCandidate = candidate;
          }
        }
      }
    }

    if (bestCandidate && bestCandidate.ref) {
      setFocusedId(bestCandidate.id);
      playFeedbackSound('move');
      bestCandidate.ref.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [focusedId, playFeedbackSound]);

  const triggerSelect = useCallback(() => {
    if (!focusedId) return;
    const current = focusablesRef.current.get(focusedId);
    if (current) {
      playFeedbackSound('select');
      if (current.onSelect) {
        current.onSelect();
      } else if (current.ref) {
        current.ref.click();
      }
    }
  }, [focusedId, playFeedbackSound]);

  const triggerBack = useCallback(() => {
    playFeedbackSound('back');
    // Dispatch custom back event so active modals or views handle first
    const event = new CustomEvent('tv:back');
    window.dispatchEvent(event);
  }, [playFeedbackSound]);

  // Global Remote & Keyboard Event Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in a real search input
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      const isInput = targetTag === 'input' || targetTag === 'textarea';

      // Remote shortcut keys
      if (e.key === 'r' || e.key === 'R') {
        if (!isInput) {
          e.preventDefault();
          setIsVirtualRemoteOpen((prev) => !prev);
          return;
        }
      }

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          navigateDirection('up');
          break;
        case 'ArrowDown':
          e.preventDefault();
          navigateDirection('down');
          break;
        case 'ArrowLeft':
          if (!isInput) {
            e.preventDefault();
            navigateDirection('left');
          }
          break;
        case 'ArrowRight':
          if (!isInput) {
            e.preventDefault();
            navigateDirection('right');
          }
          break;
        case 'Enter':
          if (!isInput) {
            e.preventDefault();
            triggerSelect();
          }
          break;
        case 'Escape':
        case 'Backspace':
          if (!isInput) {
            e.preventDefault();
            triggerBack();
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigateDirection, triggerSelect, triggerBack]);

  return (
    <TVNavigationContext.Provider
      value={{
        focusedId,
        setFocusedId,
        registerFocusable,
        unregisterFocusable,
        navigateDirection,
        triggerSelect,
        triggerBack,
        isVirtualRemoteOpen,
        setIsVirtualRemoteOpen,
        playFeedbackSound,
        soundEnabled,
        setSoundEnabled,
      }}
    >
      {children}
    </TVNavigationContext.Provider>
  );
};

export const useTVNavigation = () => {
  const context = useContext(TVNavigationContext);
  if (!context) {
    throw new Error('useTVNavigation must be used within a TVNavigationProvider');
  }
  return context;
};

// Reusable hook for registering any focusable element
export const useTVFocus = (
  id: string,
  group: string,
  options?: {
    order?: number;
    onSelect?: () => void;
    autoFocus?: boolean;
    meta?: any;
  }
) => {
  const { focusedId, setFocusedId, registerFocusable, unregisterFocusable } = useTVNavigation();
  const elementRef = useRef<HTMLElement | null>(null);

  const isFocused = focusedId === id;

  useEffect(() => {
    if (elementRef.current) {
      registerFocusable({
        id,
        group,
        order: options?.order,
        ref: elementRef.current,
        onSelect: options?.onSelect,
        meta: options?.meta,
      });

      if (options?.autoFocus) {
        setFocusedId(id);
      }
    }

    return () => {
      unregisterFocusable(id);
    };
  }, [id, group, options?.order, options?.onSelect, options?.autoFocus, registerFocusable, unregisterFocusable, setFocusedId]);

  return {
    ref: elementRef,
    isFocused,
    setAsFocused: () => setFocusedId(id),
  };
};
