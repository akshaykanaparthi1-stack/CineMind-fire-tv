import React, { useState } from 'react';
import { Film, Sparkles } from 'lucide-react';

interface MovieImageProps {
  src: string;
  alt: string;
  title: string;
  year?: number;
  genre?: string;
  mood?: string;
  aspectRatio?: 'poster' | 'backdrop';
  className?: string;
}

export const MovieImage: React.FC<MovieImageProps> = ({
  src,
  alt,
  title,
  year,
  genre,
  mood,
  aspectRatio = 'poster',
  className = '',
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const aspectClass = aspectRatio === 'backdrop' ? 'aspect-video' : '';

  // Gradient themes based on mood or title hash
  const getGradient = () => {
    switch (mood) {
      case 'Happy':
        return 'from-amber-600 via-yellow-700 to-slate-900';
      case 'Excited':
        return 'from-red-600 via-orange-700 to-slate-900';
      case 'Curious':
        return 'from-cyan-600 via-blue-800 to-slate-900';
      case 'Romantic':
        return 'from-pink-600 via-rose-800 to-slate-900';
      case 'Adventurous':
        return 'from-purple-600 via-indigo-800 to-slate-900';
      case 'Relaxed':
        return 'from-emerald-600 via-teal-800 to-slate-900';
      default:
        return 'from-slate-800 via-indigo-950 to-cinematic-950';
    }
  };

  if (hasError) {
    return (
      <div
        className={`relative w-full h-full flex flex-col justify-between p-4 bg-gradient-to-br ${getGradient()} select-none border border-slate-700/50 ${className}`}
      >
        <div className="flex items-center justify-between">
          <div className="w-8 h-8 rounded-lg bg-black/40 backdrop-blur-md flex items-center justify-center text-fire-amber">
            <Film className="w-4 h-4" />
          </div>
          {year && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/50 text-slate-300 backdrop-blur-md">
              {year}
            </span>
          )}
        </div>

        <div className="my-auto text-center py-2">
          <Sparkles className="w-6 h-6 text-fire-amber/60 mx-auto mb-1" />
          <h4 className="text-sm font-bold text-white font-display line-clamp-2 px-1">
            {title}
          </h4>
          {genre && (
            <span className="text-[10px] uppercase font-semibold text-slate-300 mt-1 block">
              {genre}
            </span>
          )}
        </div>

        <div className="text-[9px] text-slate-400 text-center uppercase tracking-wider font-mono">
          CineMind AI Master
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full overflow-hidden bg-slate-900 ${aspectClass} ${className}`}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-slate-800/80 animate-pulse flex items-center justify-center">
          <Film className="w-6 h-6 text-slate-600" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
};
