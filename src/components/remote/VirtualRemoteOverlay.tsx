import React, { useState } from 'react';
import { useTVNavigation } from '../../context/TVNavigationContext';
import { 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  CornerDownLeft, 
  Home, 
  Volume2, 
  VolumeX, 
  Mic, 
  X,
  Play
} from 'lucide-react';

interface VirtualRemoteProps {
  onHomePress: () => void;
  onVoiceSearchTrigger?: (query: string) => void;
}

export const VirtualRemoteOverlay: React.FC<VirtualRemoteProps> = ({ 
  onHomePress,
  onVoiceSearchTrigger 
}) => {
  const { 
    isVirtualRemoteOpen, 
    setIsVirtualRemoteOpen, 
    navigateDirection, 
    triggerSelect, 
    triggerBack,
    soundEnabled,
    setSoundEnabled,
    playFeedbackSound
  } = useTVNavigation();

  const [simulatedVoiceActive, setSimulatedVoiceActive] = useState(false);
  const [voiceQuery, setVoiceQuery] = useState('');

  const sampleVoicePrompts = [
    "Find hilarious family comedies under 100 minutes",
    "What should we watch tonight with 8-year-old Leo?",
    "Show me sci-fi movies that will blow our minds",
    "Start a Family Vote session for tonight's movie"
  ];

  const handleSimulatedVoice = (query?: string) => {
    const selected = query || sampleVoicePrompts[Math.floor(Math.random() * sampleVoicePrompts.length)];
    setSimulatedVoiceActive(true);
    setVoiceQuery(selected);
    playFeedbackSound('select');

    setTimeout(() => {
      setSimulatedVoiceActive(false);
      if (onVoiceSearchTrigger) {
        onVoiceSearchTrigger(selected);
      }
    }, 1800);
  };

  if (!isVirtualRemoteOpen) {
    return (
      <button
        onClick={() => setIsVirtualRemoteOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-gradient-to-r from-cinematic-800 to-cinematic-900 border border-fire-amber/40 text-slate-200 hover:text-white shadow-2xl hover:shadow-fire-amber/30 transition-all hover:scale-105 group"
        title="Open Fire TV Remote (Press R)"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-fire-amber opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-fire-amber"></span>
        </span>
        <div className="flex flex-col text-left">
          <span className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
            Fire TV Remote
            <span className="px-1.5 py-0.2 bg-fire-amber/20 text-fire-amber text-[10px] rounded border border-fire-amber/40 font-mono">
              [R]
            </span>
          </span>
          <span className="text-[10px] text-slate-400">Click or press R to open</span>
        </div>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Voice Prompt HUD when active */}
      {simulatedVoiceActive && (
        <div className="mb-4 mr-2 p-4 w-72 rounded-2xl glass-panel-elevated border border-fire-amber shadow-2xl animate-bounce-subtle">
          <div className="flex items-center gap-2 text-fire-amber text-xs font-semibold uppercase tracking-wider mb-1">
            <Mic className="w-4 h-4 animate-pulse text-fire-amber" />
            <span>Fire TV Voice AI Listening...</span>
          </div>
          <p className="text-sm font-medium text-white italic">"{voiceQuery}"</p>
        </div>
      )}

      {/* Fire TV Physical Remote Chassis */}
      <div className="w-64 rounded-[36px] bg-gradient-to-b from-[#181d29] via-[#10141f] to-[#0c0f17] p-5 border-2 border-slate-700/60 shadow-[0_20px_60px_rgba(0,0,0,0.9)] flex flex-col items-center select-none backdrop-blur-md">
        
        {/* Remote Header / Brand */}
        <div className="w-full flex items-center justify-between mb-4 px-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-fire-amber animate-pulse" />
            <span className="text-[11px] font-bold tracking-widest uppercase text-slate-300 font-display">
              Fire TV <span className="text-fire-amber font-mono text-[9px] px-1 bg-fire-amber/20 rounded">REMOTE</span>
            </span>
          </div>
          <button
            onClick={() => setIsVirtualRemoteOpen(false)}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Alexa Blue Voice Microphone Button */}
        <button
          onClick={() => handleSimulatedVoice()}
          className="mb-5 flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-500 hover:from-cyan-500 hover:to-blue-400 text-white shadow-lg shadow-cyan-500/30 transition-all hover:scale-105 active:scale-95 group relative"
          title="Alexa Voice Search"
        >
          <Mic className="w-6 h-6 group-hover:scale-110 transition-transform" />
          <span className="absolute -bottom-5 text-[9px] font-semibold text-cyan-400 tracking-wider uppercase">
            Alexa AI
          </span>
        </button>

        {/* Circular D-Pad Controller */}
        <div className="relative w-44 h-44 rounded-full bg-gradient-to-b from-[#22293b] to-[#161a26] border-2 border-slate-600/50 shadow-inner flex items-center justify-center my-2">
          
          {/* UP Button */}
          <button
            onClick={() => navigateDirection('up')}
            className="absolute top-1.5 w-14 h-11 flex items-center justify-center text-slate-300 hover:text-fire-amber hover:bg-white/5 rounded-t-full transition-colors active:scale-90"
            title="Up"
          >
            <ChevronUp className="w-6 h-6" />
          </button>

          {/* DOWN Button */}
          <button
            onClick={() => navigateDirection('down')}
            className="absolute bottom-1.5 w-14 h-11 flex items-center justify-center text-slate-300 hover:text-fire-amber hover:bg-white/5 rounded-b-full transition-colors active:scale-90"
            title="Down"
          >
            <ChevronDown className="w-6 h-6" />
          </button>

          {/* LEFT Button */}
          <button
            onClick={() => navigateDirection('left')}
            className="absolute left-1.5 h-14 w-11 flex items-center justify-center text-slate-300 hover:text-fire-amber hover:bg-white/5 rounded-l-full transition-colors active:scale-90"
            title="Left"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* RIGHT Button */}
          <button
            onClick={() => navigateDirection('right')}
            className="absolute right-1.5 h-14 w-11 flex items-center justify-center text-slate-300 hover:text-fire-amber hover:bg-white/5 rounded-r-full transition-colors active:scale-90"
            title="Right"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* CENTER SELECT BUTTON */}
          <button
            onClick={triggerSelect}
            className="w-18 h-18 w-[72px] h-[72px] rounded-full bg-gradient-to-b from-[#2e374f] to-[#1a2030] hover:from-fire-amber hover:to-fire-orange text-slate-200 hover:text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center shadow-lg transition-all active:scale-95 border border-slate-500/40"
            title="Select / OK"
          >
            OK
          </button>
        </div>

        {/* Function Keys Row 1: Back, Home, Play */}
        <div className="w-full grid grid-cols-3 gap-2.5 mt-5 px-1">
          <button
            onClick={triggerBack}
            className="flex flex-col items-center justify-center h-12 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all active:scale-95 border border-slate-700/50"
            title="Back (Esc / Backspace)"
          >
            <CornerDownLeft className="w-4 h-4" />
            <span className="text-[9px] mt-1 text-slate-400 font-medium">BACK</span>
          </button>

          <button
            onClick={() => {
              playFeedbackSound('select');
              onHomePress();
            }}
            className="flex flex-col items-center justify-center h-12 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all active:scale-95 border border-slate-700/50"
            title="Home"
          >
            <Home className="w-4 h-4" />
            <span className="text-[9px] mt-1 text-slate-400 font-medium">HOME</span>
          </button>

          <button
            onClick={triggerSelect}
            className="flex flex-col items-center justify-center h-12 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all active:scale-95 border border-slate-700/50"
            title="Play / Pause"
          >
            <Play className="w-4 h-4" />
            <span className="text-[9px] mt-1 text-slate-400 font-medium">PLAY</span>
          </button>
        </div>

        {/* Sound & Navigation Help row */}
        <div className="w-full flex items-center justify-between mt-4 px-2 pt-3 border-t border-slate-800/80 text-[10px] text-slate-400">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="flex items-center gap-1.5 hover:text-slate-200 transition-colors"
            title="Toggle TV audio feedback"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-fire-amber" />
                <span className="text-slate-300">SFX On</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                <span>Muted</span>
              </>
            )}
          </button>

          <span className="text-slate-500 font-mono text-[9px]">
            Arrow Keys + Enter
          </span>
        </div>
      </div>
    </div>
  );
};
