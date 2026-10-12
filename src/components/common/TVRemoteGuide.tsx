import React from 'react';
import { useTVNavigation } from '../../context/TVNavigationContext';
import { Tv, Volume2, VolumeX } from 'lucide-react';

export const TVRemoteGuide: React.FC = () => {
  const { soundEnabled, setSoundEnabled, setIsVirtualRemoteOpen } = useTVNavigation();

  return (
    <footer className="fixed bottom-0 inset-x-0 z-30 pointer-events-none py-2 px-6 bg-gradient-to-t from-cinematic-950 via-cinematic-950/90 to-transparent">
      <div className="max-w-[1920px] mx-auto flex items-center justify-between text-[11px] text-slate-400 font-mono">
        
        {/* Remote D-Pad Navigation Keys */}
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 font-sans font-bold">
              ▲▼◀▶
            </kbd>
            <span>Navigate</span>
          </span>

          <span className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 font-sans font-bold">
              ENTER
            </kbd>
            <span>Select</span>
          </span>

          <span className="flex items-center gap-1.5 hidden sm:flex">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 font-sans font-bold">
              ESC / BACK
            </kbd>
            <span>Back</span>
          </span>
        </div>

        {/* Remote Helper and Sound Pill */}
        <div className="pointer-events-auto flex items-center gap-3">
          <button
            onClick={() => setIsVirtualRemoteOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
          >
            <Tv className="w-3.5 h-3.5 text-fire-amber" />
            <span className="hidden md:inline">Open Remote</span>
            <kbd className="px-1 rounded bg-slate-800 text-fire-amber border border-slate-700 text-[10px]">
              R
            </kbd>
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
            title="Toggle TV click sound effects"
          >
            {soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-fire-amber" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-slate-500" />
            )}
          </button>
        </div>

      </div>
    </footer>
  );
};
