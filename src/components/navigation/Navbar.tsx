import React, { useState, useEffect } from 'react';
import type { ActiveScreen, UserProfile } from '../../types';
import { useTVFocus } from '../../context/TVNavigationContext';
import { 
  Sparkles, 
  Home, 
  Vote, 
  Bookmark, 
  Search, 
  Users, 
  ShieldCheck, 
  Tv, 
  Smile
} from 'lucide-react';

interface NavbarProps {
  activeScreen: ActiveScreen;
  onScreenChange: (screen: ActiveScreen) => void;
  activeProfile: UserProfile;
  onProfileClick: () => void;
  watchlistCount: number;
  familySafeMode: boolean;
  onToggleFamilySafeMode: () => void;
}

const NavTab: React.FC<{
  id: string;
  order: number;
  active: boolean;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  onClick: () => void;
}> = ({ id, order, active, label, icon, badge, onClick }) => {
  const { ref, isFocused } = useTVFocus(id, 'navbar', {
    order,
    onSelect: onClick,
  });

  return (
    <button
      ref={ref as any}
      onClick={onClick}
      className={`relative flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-medium text-sm transition-all tv-focusable ${
        active
          ? 'bg-gradient-to-r from-fire-amber to-fire-orange text-black font-semibold shadow-lg shadow-fire-amber/25'
          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
      } ${isFocused ? 'tv-focused ring-2 ring-fire-amber' : ''}`}
    >
      <span className={active ? 'text-black' : 'text-slate-400 group-hover:text-white'}>
        {icon}
      </span>
      <span>{label}</span>
      {badge && (
        <span
          className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
            active
              ? 'bg-black/25 text-black'
              : 'bg-fire-amber/20 text-fire-amber border border-fire-amber/30'
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
};

export const Navbar: React.FC<NavbarProps> = ({
  activeScreen,
  onScreenChange,
  activeProfile,
  onProfileClick,
  watchlistCount,
  familySafeMode,
  onToggleFamilySafeMode,
}) => {
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const safeButton = useTVFocus('nav-safemode', 'navbar', {
    order: 6,
    onSelect: onToggleFamilySafeMode,
  });

  const profileButton = useTVFocus('nav-profile-btn', 'navbar', {
    order: 7,
    onSelect: onProfileClick,
  });

  return (
    <header className="sticky top-0 z-40 w-full px-8 py-4 backdrop-blur-xl bg-cinematic-950/85 border-b border-slate-800/70 transition-all">
      <div className="max-w-[1920px] mx-auto flex items-center justify-between">
        
        {/* Brand Logo & Fire TV Badge */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onScreenChange('home')}>
            <div className="w-10 h-10 rounded-none bg-gradient-to-tr from-fire-amber to-neon-purple p-0.5 shadow-lg shadow-fire-amber/20 flex items-center justify-center">
              <div className="w-full h-full bg-[#0d111b] rounded-none flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-fire-amber" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight font-display text-white">
                  Cine<span className="text-fire-amber">Mind</span>
                </span>
                <span className="flex items-center gap-1 text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 bg-slate-800 text-slate-300 rounded-md border border-slate-700">
                  <Tv className="w-3 h-3 text-fire-amber" />
                  Fire TV
                </span>
              </div>
              <span className="text-[11px] text-slate-400 block -mt-0.5">
                Smart Family Discovery
              </span>
            </div>
          </div>
        </div>

        {/* 10-Foot Navigation Bar Items */}
        <nav className="flex items-center gap-1.5 p-1 rounded-2xl bg-cinematic-900/90 border border-slate-800/80 shadow-inner">
          <NavTab
            id="nav-home"
            order={0}
            active={activeScreen === 'home'}
            label="Home"
            icon={<Home className="w-4 h-4" />}
            onClick={() => onScreenChange('home')}
          />
          <NavTab
            id="nav-moods"
            order={1}
            active={activeScreen === 'moods'}
            label="Mood Match"
            icon={<Smile className="w-4 h-4" />}
            onClick={() => onScreenChange('moods')}
          />
          <NavTab
            id="nav-family-vote"
            order={2}
            active={activeScreen === 'family-vote'}
            label="Family Vote"
            badge="Vote!"
            icon={<Vote className="w-4 h-4" />}
            onClick={() => onScreenChange('family-vote')}
          />
          <NavTab
            id="nav-watchlist"
            order={3}
            active={activeScreen === 'watchlist'}
            label="Watchlist"
            badge={watchlistCount > 0 ? String(watchlistCount) : undefined}
            icon={<Bookmark className="w-4 h-4" />}
            onClick={() => onScreenChange('watchlist')}
          />
          <NavTab
            id="nav-search"
            order={4}
            active={activeScreen === 'search'}
            label="Search"
            icon={<Search className="w-4 h-4" />}
            onClick={() => onScreenChange('search')}
          />
          <NavTab
            id="nav-profiles"
            order={5}
            active={activeScreen === 'profiles'}
            label="Profiles"
            icon={<Users className="w-4 h-4" />}
            onClick={() => onScreenChange('profiles')}
          />
        </nav>

        {/* Right Utility: Family Safe Guard, Profile Pill, and Clock */}
        <div className="flex items-center gap-3">
          
          {/* Family Friendly Mode Toggle */}
          <button
            ref={safeButton.ref as any}
            onClick={onToggleFamilySafeMode}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all tv-focusable ${
              familySafeMode
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-md shadow-emerald-500/20'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200'
            } ${safeButton.isFocused ? 'tv-focused ring-2 ring-emerald-400' : ''}`}
            title="Toggle Kids & Family Safe Mode (G/PG Only)"
          >
            <ShieldCheck className={`w-4 h-4 ${familySafeMode ? 'text-emerald-400' : 'text-slate-500'}`} />
            <span>{familySafeMode ? 'Family Lock: ON' : 'Family Lock'}</span>
          </button>

          {/* Active Profile Avatar Pill */}
          <button
            ref={profileButton.ref as any}
            onClick={onProfileClick}
            className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 hover:border-fire-amber/50 transition-all tv-focusable ${
              profileButton.isFocused ? 'tv-focused ring-2 ring-fire-amber' : ''
            }`}
          >
            <span className="text-lg leading-none">{activeProfile.avatar}</span>
            <div className="text-left hidden sm:block">
              <span className="text-xs font-bold text-slate-100 block leading-tight">
                {activeProfile.name.split(' ')[0]}
              </span>
              <span className="text-[10px] text-slate-400 block leading-tight">
                {activeProfile.role}
              </span>
            </div>
          </button>

          {/* Live TV Clock */}
          <div className="text-right pl-2 hidden md:block">
            <span className="text-sm font-mono font-semibold text-slate-300 tracking-wider">
              {time}
            </span>
          </div>
        </div>

      </div>
    </header>
  );
};
