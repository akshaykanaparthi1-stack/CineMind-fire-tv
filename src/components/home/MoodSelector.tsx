import React from 'react';
import type { MoodType } from '../../types';
import { MOODS_CONFIG } from '../../data/moviesData';
import { useTVFocus } from '../../context/TVNavigationContext';
import { Sparkles } from 'lucide-react';

interface MoodSelectorProps {
  selectedMood: MoodType | null;
  onSelectMood: (mood: MoodType) => void;
}

const MoodCardItem: React.FC<{
  config: typeof MOODS_CONFIG[0];
  index: number;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ config, index, isSelected, onSelect }) => {
  const { ref, isFocused } = useTVFocus(`mood-item-${config.mood}`, 'home-moods', {
    order: index,
    onSelect,
  });

  return (
    <button
      ref={ref as any}
      onClick={onSelect}
      className={`relative flex-1 min-w-[190px] p-4 rounded-2xl border text-left transition-all duration-300 tv-focusable ${
        isSelected
          ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-fire-amber ring-2 ring-fire-amber shadow-lg shadow-fire-amber/30 scale-105'
          : 'bg-cinematic-900/80 border-slate-800/80 hover:border-slate-700 hover:bg-cinematic-850'
      } ${
        isFocused ? 'tv-focused ring-4 ring-fire-amber scale-105 shadow-2xl' : ''
      }`}
    >
      {/* Glow gradient background */}
      <div
        className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${config.gradient} opacity-20 pointer-events-none`}
      />

      <div className="relative z-10 flex flex-col justify-between h-full">
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl">{config.emoji}</span>
          {isSelected && (
            <span className="px-1.5 py-0.5 text-[9px] uppercase font-bold tracking-wider rounded bg-fire-amber text-black">
              ACTIVE
            </span>
          )}
        </div>

        <div>
          <h3 className="text-sm font-bold font-display text-white mb-0.5">
            {config.mood}
          </h3>
          <p className="text-[11px] text-slate-400 line-clamp-1">
            {config.label}
          </p>
        </div>
      </div>
    </button>
  );
};

export const MoodSelector: React.FC<MoodSelectorProps> = ({
  selectedMood,
  onSelectMood,
}) => {
  return (
    <div className="my-6 px-8">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-fire-amber" />
          <h2 className="text-lg font-bold font-display text-white">
            What is the Living Room Vibe Tonight?
          </h2>
        </div>
        <span className="text-xs text-slate-400 hidden sm:inline">
          Filter movies instantly by emotional tone
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {MOODS_CONFIG.map((config, index) => (
          <MoodCardItem
            key={config.mood}
            config={config}
            index={index}
            isSelected={selectedMood === config.mood}
            onSelect={() => onSelectMood(config.mood)}
          />
        ))}
      </div>
    </div>
  );
};
