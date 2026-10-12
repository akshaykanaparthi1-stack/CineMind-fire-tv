import React, { useState } from 'react';
import type { ActiveScreen, UserProfile } from '../../types';
import { useTVFocus, useTVNavigation } from '../../context/TVNavigationContext';
import { 
  Home, 
  Smile, 
  Film, 
  Vote, 
  Search, 
  Bookmark, 
  Users, 
  Settings, 
  Sparkles, 
  Tv, 
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

interface LeftNavigationRailProps {
  activeScreen: ActiveScreen;
  onScreenChange: (screen: ActiveScreen) => void;
  activeProfile: UserProfile;
  watchlistCount: number;
  familySafeMode: boolean;
  onToggleFamilySafeMode: () => void;
}

interface NavRailItemProps {
  id: string;
  order: number;
  screen: ActiveScreen;
  active: boolean;
  label: string;
  icon: React.ReactNode;
  badge?: string | number;
  onSelect: () => void;
  isExpanded: boolean;
}

const NavRailItem: React.FC<NavRailItemProps> = ({
  id,
  order,
  active,
  label,
  icon,
  badge,
  onSelect,
  isExpanded,
}) => {
  const { ref, isFocused } = useTVFocus(id, 'left-nav-rail', {
    order,
    onSelect,
  });

  return (
    <button
      ref={ref as any}
      onClick={onSelect}
      className={`relative w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-medium text-sm transition-all duration-200 select-none tv-focusable group ${
        active
          ? 'bg-gradient-to-r from-fire-amber to-fire-orange text-black font-bold shadow-lg shadow-fire-amber/30 scale-102'
          : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
      } ${isFocused ? 'tv-focused ring-4 ring-fire-amber scale-105 z-30' : ''}`}
      title={label}
    >
      {/* Icon */}
      <span
        className={`flex-shrink-0 transition-transform group-hover:scale-110 ${
          active ? 'text-black' : 'text-slate-400 group-hover:text-white'
        }`}
      >
        {icon}
      </span>

      {/* Label (visible when rail is expanded or large screen) */}
      <span
        className={`whitespace-nowrap transition-opacity duration-200 text-left flex-1 ${
          isExpanded ? 'opacity-100' : 'opacity-0 lg:opacity-100'
        }`}
      >
        {label}
      </span>

      {/* Badge */}
      {badge !== undefined && (
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider transition-opacity ${
            isExpanded ? 'opacity-100' : 'opacity-0 lg:opacity-100'
          } ${
            active
              ? 'bg-black text-fire-amber'
              : 'bg-fire-amber/20 text-fire-amber border border-fire-amber/40'
          }`}
        >
          {badge}
        </span>
      )}

      {/* Focused indicator dot on right */}
      {isFocused && (
        <span className="w-1.5 h-1.5 rounded-full bg-black ml-auto hidden lg:block" />
      )}
    </button>
  );
};

export const LeftNavigationRail: React.FC<LeftNavigationRailProps> = ({
  activeScreen,
  onScreenChange,
  activeProfile,
  watchlistCount,
  familySafeMode,
  onToggleFamilySafeMode,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const { playFeedbackSound } = useTVNavigation();

  const handleSelect = (screen: ActiveScreen) => {
    playFeedbackSound('select');
    onScreenChange(screen);
  };

  const navItems: {
    screen: ActiveScreen;
    label: string;
    icon: React.ReactNode;
    badge?: string | number;
  }[] = [
    { screen: 'home', label: 'Home', icon: <Home className="w-5 h-5" /> },
    { screen: 'moods', label: 'Discover by Mood', icon: <Smile className="w-5 h-5" /> },
    { screen: 'genres', label: 'Browse Genres', icon: <Film className="w-5 h-5" /> },
    { screen: 'family-vote', label: 'Family Vote', icon: <Vote className="w-5 h-5" />, badge: 'Vote!' },
    { screen: 'search', label: 'Search', icon: <Search className="w-5 h-5" /> },
    { screen: 'watchlist', label: 'My Watchlist', icon: <Bookmark className="w-5 h-5" />, badge: watchlistCount > 0 ? watchlistCount : undefined },
    { screen: 'profiles', label: 'User Profiles', icon: <Users className="w-5 h-5" /> },
    { screen: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`fixed left-0 top-0 bottom-0 z-40 bg-cinematic-950/95 border-r border-slate-800/80 backdrop-blur-2xl flex flex-col justify-between py-6 px-3 transition-all duration-300 select-none ${
        isHovered ? 'w-64 shadow-[15px_0_40px_rgba(0,0,0,0.8)]' : 'w-20 lg:w-64'
      }`}
    >
      {/* Top: Logo & Fire TV Badge */}
      <div className="px-2 mb-6">
        <div
          onClick={() => handleSelect('home')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-fire-amber to-purple-600 p-0.5 shadow-lg shadow-fire-amber/20 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-cinematic-900 rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-fire-amber" />
            </div>
          </div>
          <div
            className={`transition-opacity duration-200 overflow-hidden ${
              isHovered ? 'opacity-100' : 'opacity-0 lg:opacity-100'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-black tracking-tight font-display text-white">
                CineMind <span className="text-fire-amber">AI</span>
              </span>
            </div>
            <span className="flex items-center gap-1 text-[9px] font-bold tracking-wider uppercase text-slate-400">
              <Tv className="w-3 h-3 text-fire-amber" />
              Fire TV Edition
            </span>
          </div>
        </div>
      </div>

      {/* Middle: Navigation Items */}
      <nav className="flex-1 flex flex-col gap-1.5 overflow-y-auto no-scrollbar py-2">
        {navItems.map((item, index) => (
          <NavRailItem
            key={item.screen}
            id={`rail-nav-${item.screen}`}
            order={index}
            screen={item.screen}
            active={activeScreen === item.screen}
            label={item.label}
            icon={item.icon}
            badge={item.badge}
            onSelect={() => handleSelect(item.screen)}
            isExpanded={isHovered}
          />
        ))}
      </nav>

      {/* Bottom: Family Safe Lock & Active Profile Pill */}
      <div className="pt-4 border-t border-slate-800/80 flex flex-col gap-2 px-1">
        
        {/* Family Safe Mode Button */}
        <button
          onClick={onToggleFamilySafeMode}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            familySafeMode
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-md'
              : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
          }`}
          title="Toggle Kids & Family Lock (G/PG)"
        >
          <ShieldCheck className={`w-4 h-4 flex-shrink-0 ${familySafeMode ? 'text-emerald-400' : 'text-slate-500'}`} />
          <span
            className={`whitespace-nowrap transition-opacity ${
              isHovered ? 'opacity-100' : 'opacity-0 lg:opacity-100'
            }`}
          >
            {familySafeMode ? 'Family Lock: ON' : 'Family Lock: OFF'}
          </span>
        </button>

        {/* Profile Card */}
        <div
          onClick={() => handleSelect('profiles')}
          className="w-full flex items-center gap-3 p-2.5 rounded-2xl bg-cinematic-900/90 border border-slate-800 hover:border-fire-amber/50 cursor-pointer transition-all group"
        >
          <div className="text-xl flex-shrink-0">{activeProfile.avatar}</div>
          <div
            className={`overflow-hidden transition-opacity flex-1 ${
              isHovered ? 'opacity-100' : 'opacity-0 lg:opacity-100'
            }`}
          >
            <span className="text-xs font-bold text-white block line-clamp-1 group-hover:text-fire-amber transition-colors">
              {activeProfile.name.split(' ')[0]}
            </span>
            <span className="text-[10px] text-slate-400 block line-clamp-1">
              {activeProfile.role} • Max: {activeProfile.maxAgeRating}
            </span>
          </div>
          <ChevronRight
            className={`w-4 h-4 text-slate-500 group-hover:text-white transition-opacity ${
              isHovered ? 'opacity-100' : 'opacity-0 lg:opacity-100'
            }`}
          />
        </div>

        {/* TMDB Badge */}
        <div className={`pt-1 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0 lg:opacity-100'}`}>
          <div className="flex items-center justify-between px-2.5 py-1 rounded-xl bg-black/40 text-[9px] text-slate-500 font-mono border border-slate-800/60">
            <span>Metadata:</span>
            <span className="text-cyan-400 font-bold">TMDB API</span>
          </div>
        </div>

      </div>
    </aside>
  );
};
