import React from 'react';
import type { GenreType } from '../../types';
import { GENRES_LIST } from '../../data/moviesData';
import { useTVFocus } from '../../context/TVNavigationContext';
import { Film } from 'lucide-react';

interface GenreFilterBarProps {
  selectedGenre: GenreType | 'All';
  onSelectGenre: (genre: GenreType | 'All') => void;
}

const GenrePill: React.FC<{
  label: string;
  isSelected: boolean;
  order: number;
  onSelect: () => void;
}> = ({ label, isSelected, order, onSelect }) => {
  const { ref, isFocused } = useTVFocus(`genre-pill-${label}`, 'home-genres', {
    order,
    onSelect,
  });

  return (
    <button
      ref={ref as any}
      onClick={onSelect}
      className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all tv-focusable ${
        isSelected
          ? 'bg-slate-100 text-black shadow-md shadow-white/10 font-bold scale-105'
          : 'bg-cinematic-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
      } ${
        isFocused ? 'tv-focused ring-2 ring-fire-amber scale-105' : ''
      }`}
    >
      {label}
    </button>
  );
};

export const GenreFilterBar: React.FC<GenreFilterBarProps> = ({
  selectedGenre,
  onSelectGenre,
}) => {
  return (
    <div className="px-8 my-4 flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold uppercase tracking-wider mr-2">
        <Film className="w-3.5 h-3.5 text-fire-amber" />
        <span>Genre:</span>
      </div>

      <GenrePill
        label="All"
        isSelected={selectedGenre === 'All'}
        order={0}
        onSelect={() => onSelectGenre('All')}
      />

      {GENRES_LIST.map((genre, index) => (
        <GenrePill
          key={genre}
          label={genre}
          isSelected={selectedGenre === genre}
          order={index + 1}
          onSelect={() => onSelectGenre(genre)}
        />
      ))}
    </div>
  );
};
