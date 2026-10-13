import React, { useState, useEffect, useRef } from 'react';
import { useTVNavigation } from '../../context/TVNavigationContext';
import { speechToTextService } from '../../services/speechToTextService';
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
  Play,
  Radio,
  Sparkles
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

  const [isAudioListening, setIsAudioListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceStatusText, setVoiceStatusText] = useState('Listening to microphone...');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const stopListeningRef = useRef<(() => void) | null>(null);

  const sampleVoicePrompts = [
    'Find hilarious family comedies under 100 minutes',
    'What should we watch tonight with 8-year-old Leo?',
    'Show me exciting sci-fi movies that will blow our minds',
    'Start a Family Vote session for tonight',
    'Feel-good romantic comedies with happy endings',
  ];

  // Stop listening on unmount
  useEffect(() => {
    return () => {
      if (stopListeningRef.current) {
        stopListeningRef.current();
      }
    };
  }, []);

  // Real Audio-to-Text Speech Recognition Trigger
  const handleStartVoice = () => {
    playFeedbackSound('select');
    setVoiceError(null);
    setVoiceTranscript('');
    setVoiceStatusText('Listening to microphone... Speak now');

    // Check if Speech Recognition is supported in the browser
    if (speechToTextService.isSupported()) {
      setIsAudioListening(true);
      const stopFn = speechToTextService.startListening({
        onStart: () => {
          setIsAudioListening(true);
          setVoiceStatusText('Microphone active — Listening to your voice...');
        },
        onInterimResult: (interim) => {
          setVoiceTranscript(interim);
        },
        onFinalResult: (finalText) => {
          setVoiceTranscript(finalText);
          setVoiceStatusText(`Transcribed: "${finalText}"`);

          // Submit recognized audio to text search after brief confirmation delay
          setTimeout(() => {
            setIsAudioListening(false);
            if (onVoiceSearchTrigger) {
              onVoiceSearchTrigger(finalText);
            }
          }, 1000);
        },
        onError: (errMsg) => {
          setVoiceError(errMsg);
          setVoiceStatusText('Voice error. You can pick a sample query below:');
        },
        onEnd: () => {
          // Handled in onFinalResult or user cancel
        },
      });

      stopListeningRef.current = stopFn;
    } else {
      // Graceful fallback simulation if browser lacks SpeechRecognition
      setIsAudioListening(true);
      const selected = sampleVoicePrompts[Math.floor(Math.random() * sampleVoicePrompts.length)];
      setVoiceStatusText('Web Speech API unavailable in browser. Simulating voice audio:');
      setVoiceTranscript(selected);

      setTimeout(() => {
        setIsAudioListening(false);
        if (onVoiceSearchTrigger) {
          onVoiceSearchTrigger(selected);
        }
      }, 1600);
    }
  };

  const handleStopVoice = () => {
    if (stopListeningRef.current) {
      stopListeningRef.current();
    }
    speechToTextService.stopListening();
    setIsAudioListening(false);
  };

  const handlePickSamplePrompt = (prompt: string) => {
    setVoiceTranscript(prompt);
    speechToTextService.playSuccessChime();
    setTimeout(() => {
      setIsAudioListening(false);
      if (onVoiceSearchTrigger) {
        onVoiceSearchTrigger(prompt);
      }
    }, 600);
  };

  // Minimized Trigger Button (bottom-right corner)
  if (!isVirtualRemoteOpen) {
    return (
      <button
        onClick={() => setIsVirtualRemoteOpen(true)}
        className="keep-dark fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 remote-pill bg-neutral-900 border border-neutral-700 text-slate-200 hover:text-white shadow-xl hover:border-neutral-500 transition-all hover:scale-105 group"
        title="Open Fire TV Remote with Rounded Curves (Press R)"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full remote-circle bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex remote-circle h-3 w-3 bg-amber-400"></span>
        </span>
        <div className="flex flex-col text-left">
          <span className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
            Fire TV Remote
            <span className="px-1.5 py-0.2 bg-neutral-800 text-amber-400 text-[10px] remote-btn border border-neutral-700 font-mono">
              [R]
            </span>
          </span>
          <span className="text-[10px] text-slate-400">Click or press R to open</span>
        </div>
      </button>
    );
  }

  return (
    <div className="keep-dark fixed bottom-6 right-6 z-50 flex flex-col items-end">
      
      {/* Real Audio-to-Text Voice HUD when active */}
      {isAudioListening && (
        <div className="mb-4 mr-1 p-5 w-84 max-w-sm remote-hud bg-neutral-900 border border-neutral-700 shadow-2xl animate-fade-in text-left">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-neutral-200 text-xs font-bold uppercase tracking-wider">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full remote-circle bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex remote-circle h-3 w-3 bg-sky-400"></span>
              </span>
              <span>Alexa Voice Audio Active</span>
            </div>
            <button
              onClick={handleStopVoice}
              className="text-slate-400 hover:text-white p-1"
              title="Cancel Voice Search"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Real-time Status / Sound Wave Visualizer */}
          <div className="flex items-center gap-2 my-2 text-xs text-slate-300">
            <div className="flex items-center gap-1 h-5 px-1 bg-neutral-800 border border-neutral-700 remote-pill">
              <span className="w-1 h-2.5 bg-sky-400 animate-pulse remote-pill" style={{ animationDelay: '0ms' }} />
              <span className="w-1 h-4 bg-sky-300 animate-pulse remote-pill" style={{ animationDelay: '150ms' }} />
              <span className="w-1 h-3 bg-sky-400 animate-pulse remote-pill" style={{ animationDelay: '300ms' }} />
              <span className="w-1 h-1.5 bg-sky-400 animate-pulse remote-pill" style={{ animationDelay: '75ms' }} />
            </div>
            <span className="text-[11px] font-medium text-slate-400 line-clamp-1">
              {voiceStatusText}
            </span>
          </div>

          {/* Live Audio Transcript Box */}
          <div className="p-3 my-2 bg-neutral-950 border border-neutral-800 remote-btn min-h-[52px] flex items-center">
            {voiceTranscript ? (
              <p className="text-sm font-semibold text-white tracking-wide">
                "{voiceTranscript}"
              </p>
            ) : (
              <p className="text-xs text-slate-400 italic flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-sky-400 animate-spin" />
                Listening to your microphone... Say a movie, mood, or actor
              </p>
            )}
          </div>

          {/* Error Message or Quick Voice Prompts */}
          {voiceError && (
            <div className="text-[11px] text-amber-400 mb-2">
              ⚠️ {voiceError}
            </div>
          )}

          {/* Quick Fallback Prompts */}
          <div className="mt-2 pt-2 border-t border-neutral-800">
            <span className="text-[9px] uppercase tracking-wider text-slate-400 block mb-1.5 font-bold">
              Or pick an instant query:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {sampleVoicePrompts.slice(0, 3).map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handlePickSamplePrompt(prompt)}
                  className="px-2 py-1 text-[10px] bg-neutral-800 hover:bg-neutral-750 text-slate-200 border border-neutral-700 remote-btn hover:border-neutral-500 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Fire TV Physical Remote Chassis with Authentic Rounded Curves */}
      <div className="w-68 remote-curved bg-[#141518] p-5 border border-neutral-700 shadow-2xl flex flex-col items-center select-none backdrop-blur-xl">
        
        {/* Remote Header / Brand */}
        <div className="w-full flex items-center justify-between mb-4 px-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 remote-circle bg-amber-400" />
            <span className="text-[11px] font-bold tracking-widest uppercase text-slate-300 font-display">
              Fire TV <span className="text-amber-400 font-mono text-[9px] px-1 bg-neutral-800 border border-neutral-700 remote-btn">REMOTE</span>
            </span>
          </div>
          <button
            onClick={() => setIsVirtualRemoteOpen(false)}
            className="p-1 remote-circle text-slate-400 hover:text-white hover:bg-neutral-800 transition-colors"
            title="Close Remote"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Alexa Blue Voice Microphone Button with Audio-to-Text */}
        <div className="mb-5 flex flex-col items-center">
          <button
            onClick={handleStartVoice}
            className={`flex items-center justify-center w-14 h-14 remote-circle transition-all active:scale-95 group relative ${
              isAudioListening
                ? 'bg-sky-500 text-white ring-4 ring-sky-500/40 scale-105'
                : 'bg-[#00a8e1] hover:bg-[#0094c7] text-white shadow-md hover:scale-105'
            }`}
            title="Alexa Voice Search — Audio to Text"
          >
            <Mic className={`w-7 h-7 transition-transform group-hover:scale-110 ${isAudioListening ? 'animate-pulse' : ''}`} />
          </button>
          <span className="text-[9px] font-bold text-sky-400 tracking-wider uppercase mt-1 flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5" />
            {isAudioListening ? 'Listening...' : 'Alexa Voice'}
          </span>
        </div>

        {/* Circular D-Pad Controller with Ergonomic Rounded Curves */}
        <div className="relative w-44 h-44 remote-dpad bg-[#1c1d22] border border-neutral-700 shadow-inner flex items-center justify-center my-2">
          
          {/* UP Button */}
          <button
            onClick={() => navigateDirection('up')}
            className="absolute top-1 w-14 h-12 flex items-center justify-center text-slate-300 hover:text-fire-amber hover:bg-white/5 remote-dpad-up transition-colors active:scale-90"
            title="Navigate Up"
          >
            <ChevronUp className="w-6 h-6" />
          </button>

          {/* DOWN Button */}
          <button
            onClick={() => navigateDirection('down')}
            className="absolute bottom-1 w-14 h-12 flex items-center justify-center text-slate-300 hover:text-fire-amber hover:bg-white/5 remote-dpad-down transition-colors active:scale-90"
            title="Navigate Down"
          >
            <ChevronDown className="w-6 h-6" />
          </button>

          {/* LEFT Button */}
          <button
            onClick={() => navigateDirection('left')}
            className="absolute left-1 h-14 w-12 flex items-center justify-center text-slate-300 hover:text-fire-amber hover:bg-white/5 remote-dpad-left transition-colors active:scale-90"
            title="Navigate Left"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* RIGHT Button */}
          <button
            onClick={() => navigateDirection('right')}
            className="absolute right-1 h-14 w-12 flex items-center justify-center text-slate-300 hover:text-fire-amber hover:bg-white/5 remote-dpad-right transition-colors active:scale-90"
            title="Navigate Right"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* CENTER SELECT / OK BUTTON */}
          <button
            onClick={triggerSelect}
            className="w-[74px] h-[74px] remote-circle bg-[#24262e] hover:bg-[#30333c] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center shadow-md transition-all active:scale-95 border border-neutral-600/40"
            title="Select / OK"
          >
            OK
          </button>
        </div>

        {/* Function Keys Row: Back, Home, Play */}
        <div className="w-full grid grid-cols-3 gap-2.5 mt-5 px-1">
          <button
            onClick={triggerBack}
            className="flex flex-col items-center justify-center h-12 remote-btn bg-[#1b1c22] hover:bg-[#252730] text-slate-300 hover:text-white transition-all active:scale-95 border border-neutral-700/60"
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
            className="flex flex-col items-center justify-center h-12 remote-btn bg-[#1b1c22] hover:bg-[#252730] text-slate-300 hover:text-white transition-all active:scale-95 border border-neutral-700/60"
            title="Home"
          >
            <Home className="w-4 h-4" />
            <span className="text-[9px] mt-1 text-slate-400 font-medium">HOME</span>
          </button>

          <button
            onClick={triggerSelect}
            className="flex flex-col items-center justify-center h-12 remote-btn bg-[#1b1c22] hover:bg-[#252730] text-slate-300 hover:text-white transition-all active:scale-95 border border-neutral-700/60"
            title="Play / Pause"
          >
            <Play className="w-4 h-4" />
            <span className="text-[9px] mt-1 text-slate-400 font-medium">PLAY</span>
          </button>
        </div>

        {/* Sound & Navigation Help footer */}
        <div className="w-full flex items-center justify-between mt-4 px-2 pt-3 border-t border-neutral-800 text-[10px] text-slate-400">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="flex items-center gap-1.5 hover:text-slate-200 transition-colors"
            title="Toggle TV audio click sound effects"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-amber-400" />
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
            D-Pad + Audio Voice
          </span>
        </div>

      </div>
    </div>
  );
};
