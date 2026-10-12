/**
 * CineMind - Speech-to-Text (Audio-to-Text) Service
 * Uses Web Speech API (webkitSpeechRecognition / SpeechRecognition)
 * with Web Audio API sound chimes and seamless fallback.
 */

// SpeechRecognition type declarations for browsers
type SpeechRecognitionType = any;

interface SpeechRecognitionOptions {
  onStart?: () => void;
  onInterimResult?: (interimTranscript: string) => void;
  onFinalResult?: (finalTranscript: string) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
  lang?: string;
}

class SpeechToTextService {
  private recognition: SpeechRecognitionType | null = null;
  private isListening = false;
  private audioCtx: AudioContext | null = null;

  constructor() {
    this.initAudioContext();
  }

  private initAudioContext() {
    if (typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.audioCtx = new AudioCtx();
      }
    }
  }

  // Play authentic Alexa-style dual-tone ascending chime
  playListeningChime() {
    try {
      if (!this.audioCtx) this.initAudioContext();
      if (!this.audioCtx) return;
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.12); // G5

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.22);
    } catch {
      // Audio autoplay restrictions or errors handled silently
    }
  }

  // Play affirmative recognition success chime
  playSuccessChime() {
    try {
      if (!this.audioCtx) this.initAudioContext();
      if (!this.audioCtx) return;
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(659.25, now); // E5
      osc.frequency.setValueAtTime(880, now + 0.08); // A5

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.26);
    } catch {
      // Handled silently
    }
  }

  // Check if browser supports Web Speech API
  isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean(
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition
    );
  }

  // Start real audio-to-text recording
  startListening(options: SpeechRecognitionOptions = {}): () => void {
    if (this.isListening) {
      this.stopListening();
    }

    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      if (options.onError) {
        options.onError('Speech Recognition is not natively supported in this browser.');
      }
      return () => {};
    }

    try {
      const recognition = new SpeechRecognitionClass();
      this.recognition = recognition;

      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = options.lang || 'en-US';
      recognition.maxAlternatives = 1;

      let finalCaptured = '';

      recognition.onstart = () => {
        this.isListening = true;
        this.playListeningChime();
        if (options.onStart) options.onStart();
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          const text = item[0]?.transcript || '';
          if (item.isFinal) {
            finalCaptured += text;
          } else {
            interim += text;
          }
        }

        const currentText = finalCaptured || interim;
        if (options.onInterimResult && currentText) {
          options.onInterimResult(currentText);
        }
      };

      recognition.onerror = (event: any) => {
        this.isListening = false;
        const errType = event.error || 'unknown_error';
        let friendlyMsg = 'Microphone error occurred.';
        if (errType === 'not-allowed') {
          friendlyMsg = 'Microphone permission denied. Please allow microphone access.';
        } else if (errType === 'no-speech') {
          friendlyMsg = 'No speech detected. Please try speaking again.';
        } else if (errType === 'network') {
          friendlyMsg = 'Network connection needed for speech transcription.';
        }

        if (options.onError) {
          options.onError(friendlyMsg);
        }
      };

      recognition.onend = () => {
        this.isListening = false;
        if (finalCaptured.trim()) {
          this.playSuccessChime();
          if (options.onFinalResult) {
            options.onFinalResult(finalCaptured.trim());
          }
        }
        if (options.onEnd) {
          options.onEnd();
        }
      };

      recognition.start();

      return () => {
        this.stopListening();
      };
    } catch (err: unknown) {
      this.isListening = false;
      const msg = err instanceof Error ? err.message : 'Failed to start speech recognition.';
      if (options.onError) options.onError(msg);
      return () => {};
    }
  }

  // Stop current speech recognition session
  stopListening() {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Ignored
      }
      this.recognition = null;
    }
    this.isListening = false;
  }

  // Helper sample prompts for fallback or inspiration
  getSamplePrompts(): string[] {
    return [
      'Find a funny family movie under 100 minutes',
      'Show me exciting sci-fi adventures',
      'Relaxed feel-good animated movies for kids',
      'Clever suspense thriller with high ratings',
      'Start a Family Vote session for tonight',
    ];
  }
}

export const speechToTextService = new SpeechToTextService();
