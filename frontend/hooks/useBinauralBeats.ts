// neuroforge/frontend/hooks/useBinauralBeats.ts
// Purpose: React hook to manage the state and playback of binaural/isochronic tones
import { useState, useCallback, useEffect } from 'react';
import { playTones, stopTones, setVolume as setAudioVolume } from 'lib/webAudio';

// Define presets
export interface AudioPreset {
    name: string;
    type: 'binaural' | 'isochronic';
    description: string;
    // For binaural
    beatFrequency?: number; // e.g., 10 for Alpha
    // For isochronic
    pulseFrequency?: number; // e.g., 10 for Alpha
    // Optional base frequency if different from default
    baseFrequency?: number;
}

export const audioPresets: Record<string, AudioPreset> = {
    focus: { name: 'Focus (Beta)', type: 'binaural', beatFrequency: 15, description: 'Enhanced concentration and alertness (14-30 Hz)' },
    creative: { name: 'Creative (Alpha)', type: 'binaural', beatFrequency: 10, description: 'Relaxed focus, creativity, learning (7-14 Hz)' },
    deep_learning: { name: 'Deep Learn (Theta)', type: 'binaural', beatFrequency: 5, description: 'Deep meditation, memory consolidation (4-7 Hz)' },
    relaxation: { name: 'Relaxation (Alpha/Theta)', type: 'isochronic', pulseFrequency: 8, description: 'Gentle relaxation and stress reduction' },
    // Add more presets: Delta for sleep, Gamma for high-level processing, etc.
};

export type PresetKey = keyof typeof audioPresets | 'custom';

interface UseBinauralBeatsReturn {
    isPlaying: boolean;
    volume: number;
    currentPreset: PresetKey | null;
    play: (presetKey: PresetKey, customSettings?: { base: number; beat: number; type: 'binaural' | 'isochronic' }) => void;
    stop: () => void;
    setVolume: (newVolume: number) => void;
    supported: boolean;
}

export function useBinauralBeats(initialVolume: number = 0.5): UseBinauralBeatsReturn {
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(initialVolume);
    const [currentPreset, setCurrentPreset] = useState<PresetKey | null>(null);
    const [supported, setSupported] = useState(true); // Assume supported initially

    useEffect(() => {
        // Check for Web Audio API support on mount
        if (!(window.AudioContext || (window as any).webkitAudioContext)) {
            console.warn("Web Audio API not supported in this browser.");
            setSupported(false);
        }
        // Ensure tones are stopped on component unmount
        return () => {
            stopTones();
        };
    }, []);

    const play = useCallback((
        presetKey: PresetKey,
        customSettings?: { base: number; beat: number; type: 'binaural' | 'isochronic' }
    ) => {
        if (!supported) return;

        let options: Parameters<typeof playTones>[0] = { volume };
        let preset: AudioPreset | undefined;

        if (presetKey === 'custom' && customSettings) {
             options.baseFrequency = customSettings.base;
             options.toneType = customSettings.type;
             if (customSettings.type === 'binaural') {
                options.beatFrequency = customSettings.beat;
             } else {
                options.pulseFrequency = customSettings.beat; // Use 'beat' for pulse in custom isochronic too
             }
             console.log("Playing custom settings:", options);
        } else if (presetKey !== 'custom') {
            preset = audioPresets[presetKey];
            if (!preset) {
                console.error(`Preset "${presetKey}" not found.`);
                return;
            }
            options.toneType = preset.type;
            options.beatFrequency = preset.beatFrequency;
            options.pulseFrequency = preset.pulseFrequency;
            options.baseFrequency = preset.baseFrequency; // Use preset base freq if defined
            console.log(`Playing preset: ${preset.name}`);
        } else {
             console.error("Custom preset selected without custom settings.");
             return;
        }


        try {
            playTones(options);
            setIsPlaying(true);
            setCurrentPreset(presetKey);
        } catch (error) {
            console.error("Failed to play tones:", error);
            setIsPlaying(false);
            setCurrentPreset(null);
        }
    }, [volume, supported]);

    const stop = useCallback(() => {
        if (!supported) return;
        stopTones();
        setIsPlaying(false);
        setCurrentPreset(null);
    }, [supported]);

    const handleSetVolume = useCallback((newVolume: number) => {
        if (!supported) return;
        const clampedVolume = Math.max(0, Math.min(1, newVolume));
        setVolume(clampedVolume);
        if (isPlaying) {
            setAudioVolume(clampedVolume); // Update volume of currently playing tones
        }
    }, [isPlaying, supported]);

    return { isPlaying, volume, currentPreset, play, stop, setVolume: handleSetVolume, supported };
}