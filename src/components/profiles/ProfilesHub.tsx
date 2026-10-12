import React from 'react';
import type { UserProfile } from '../../types';
import { SAMPLE_PROFILES } from '../../data/sampleProfiles';
import { useTVNavigation } from '../../context/TVNavigationContext';
import { Users, Shield, Check } from 'lucide-react';

interface ProfilesHubProps {
  activeProfile: UserProfile;
  onSelectProfile: (profile: UserProfile) => void;
  onBackToHome: () => void;
}

export const ProfilesHub: React.FC<ProfilesHubProps> = ({
  activeProfile,
  onSelectProfile,
  onBackToHome,
}) => {
  const { playFeedbackSound } = useTVNavigation();

  return (
    <div className="w-full max-w-[1400px] mx-auto px-8 py-10 animate-fade-in select-none">
      
      {/* Title */}
      <div className="text-center max-w-xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-none bg-fire-amber/20 text-fire-amber border border-fire-amber/40 text-xs font-bold uppercase tracking-wider mb-3">
          <Users className="w-4 h-4" />
          <span>Fire TV Household Profiles</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-white">
          Who's Holding the Remote?
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Switching profiles personalizes AI match predictions, age safety boundaries, and mood recommendations.
        </p>
      </div>

      {/* Profiles Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
        {SAMPLE_PROFILES.map((profile) => {
          const isActive = profile.id === activeProfile.id;

          return (
            <button
              key={profile.id}
              onClick={() => {
                playFeedbackSound('select');
                onSelectProfile(profile);
              }}
              className={`p-6 rounded-none border text-left transition-all duration-300 flex flex-col justify-between h-[360px] tv-focusable ${
                isActive
                  ? 'bg-slate-800 border-fire-amber ring-2 ring-fire-amber shadow-xl scale-105'
                  : 'bg-cinematic-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="w-16 h-16 rounded-none flex items-center justify-center text-3xl shadow-lg"
                    style={{ backgroundColor: `${profile.color}25`, border: `2px solid ${profile.color}` }}
                  >
                    {profile.avatar}
                  </div>
                  {isActive && (
                    <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-1 bg-fire-amber text-black rounded-none">
                      <Check className="w-3 h-3 stroke-[3]" />
                      ACTIVE
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold font-display text-white mb-0.5">
                  {profile.name}
                </h3>
                <span className="text-xs font-medium text-slate-400 block mb-3">
                  Role: {profile.role}
                </span>

                {/* Age rating safeguard badge */}
                <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-none bg-slate-800 text-[11px] font-semibold text-slate-300 mb-3 border border-slate-700">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Max Rating: {profile.maxAgeRating}</span>
                </div>
              </div>

              {/* Preferences breakdown */}
              <div className="border-t border-slate-800 pt-3 text-[11px] space-y-1 text-slate-400">
                <div>
                  <span className="text-slate-500 font-semibold">Fav Moods: </span>
                  <span className="text-slate-300">{profile.favoriteMoods.join(', ')}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold">Genres: </span>
                  <span className="text-slate-300">{profile.favoriteGenres.join(', ')}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Done Button */}
      <div className="flex justify-center">
        <button
          onClick={onBackToHome}
          className="px-8 py-3.5 rounded-none bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 shadow-lg"
        >
          Return to Entertainment Hub
        </button>
      </div>

    </div>
  );
};
