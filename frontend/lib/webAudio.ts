// neuroforge/frontend/lib/webAudio.ts
// Purpose: Core logic for generating binaural beats and isochronic tones

// Singleton AudioContext for performance
let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
    if (!audioContext) {
        audioContext = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        // Resume context if needed (required after user interaction in some browsers)
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
    }
    return audioContext;
};

interface ToneSources {
    left?: OscillatorNode;
    right?: OscillatorNode;
    isochronic?: OscillatorNode;
    gain?: GainNode;
    panner?: StereoPannerNode; // Used for binaural effect
    isochronicGain?: GainNode; // Gain node for amplitude modulation
    intervalId?: NodeJS.Timeout; // For isochronic pulse timing
}

interface PlayOptions {
    volume?: number; // 0 to 1
    baseFrequency?: number; // Hz (e.g., 100Hz)
    beatFrequency?: number; // Hz (e.g., 10Hz for Alpha) - For Binaural
    pulseFrequency?: number; // Hz (e.g., 10Hz for Alpha) - For Isochronic
    toneType?: 'binaural' | 'isochronic';
}

let currentSources: ToneSources | null = null;

/**
 * Creates and starts the audio oscillators based on options.
 */
export function playTones(options: PlayOptions = {}): ToneSources | null {
    stopTones(); // Stop any currently playing tones

    const ctx = getAudioContext();
    const {
        volume = 0.5,
        baseFrequency = 120, // A generally comfortable base frequency
        beatFrequency = 10, // Default to Alpha range for binaural
        pulseFrequency = 10, // Default to Alpha range for isochronic
        toneType = 'binaural',
    } = options;

    const sources: ToneSources = {};

    try {
        sources.gain = ctx.createGain();
        sources.gain.gain.setValueAtTime(volume, ctx.currentTime);
        sources.gain.connect(ctx.destination);

        if (toneType === 'binaural') {
            // Binaural: Two slightly different frequencies, one for each ear
            const freqLeft = baseFrequency - beatFrequency / 2;
            const freqRight = baseFrequency + beatFrequency / 2;

            sources.left = ctx.createOscillator();
            sources.left.frequency.setValueAtTime(freqLeft, ctx.currentTime);
            sources.left.type = 'sine'; // Sine waves are common for binaural

            sources.right = ctx.createOscillator();
            sources.right.frequency.setValueAtTime(freqRight, ctx.currentTime);
            sources.right.type = 'sine';

            // Use StereoPanner for true stereo separation
            sources.panner = ctx.createStereoPanner();
            sources.panner.connect(sources.gain);

            // Pan left oscillator hard left, right oscillator hard right
            const pannerLeft = ctx.createStereoPanner();
            pannerLeft.pan.setValueAtTime(-1, ctx.currentTime);
            sources.left.connect(pannerLeft).connect(sources.panner);

            const pannerRight = ctx.createStereoPanner();
            pannerRight.pan.setValueAtTime(1, ctx.currentTime);
            sources.right.connect(pannerRight).connect(sources.panner);

            sources.left.start();
            sources.right.start();

        } else if (toneType === 'isochronic') {
            // Isochronic: Single tone pulsed on and off
            sources.isochronic = ctx.createOscillator();
            sources.isochronic.frequency.setValueAtTime(baseFrequency, ctx.currentTime);
            sources.isochronic.type = 'sine'; // Can use other wave types too

            // Use a GainNode for amplitude modulation (pulsing)
            sources.isochronicGain = ctx.createGain();
            sources.isochronicGain.gain.setValueAtTime(0, ctx.currentTime); // Start silent
            sources.isochronic.connect(sources.isochronicGain).connect(sources.gain);
            sources.isochronic.start();

            // Calculate pulse duration and interval time
            const pulseIntervalSeconds = 1 / pulseFrequency;
            const pulseDurationSeconds = pulseIntervalSeconds / 2; // 50% duty cycle

            // Function to schedule gain changes for pulsing effect
            const schedulePulse = () => {
                const now = ctx.currentTime;
                sources.isochronicGain?.gain.setValueAtTime(1, now); // Turn sound on
                sources.isochronicGain?.gain.setValueAtTime(0, now + pulseDurationSeconds); // Turn sound off
            };

            // Schedule the first pulse immediately
             schedulePulse();
            // Schedule subsequent pulses using setInterval (less precise) or recursive setTimeout
            // Using setInterval for simplicity here, but recursive setTimeout with accurate timing is better for precision audio work
             sources.intervalId = setInterval(schedulePulse, pulseIntervalSeconds * 1000);

        } else {
            console.error("Unsupported tone type:", toneType);
            return null;
        }

        currentSources = sources;
        console.log(`Playing ${toneType} tones. Base: ${baseFrequency}Hz, Beat/Pulse: ${toneType === 'binaural' ? beatFrequency : pulseFrequency}Hz`);
        return sources;

    } catch (error) {
        console.error("Error playing tones:", error);
        stopTones(); // Clean up on error
        return null;
    }
}

/**
 * Stops any currently playing tones and cleans up resources.
 */
export function stopTones() {
    if (!currentSources) return;

    console.log("Stopping tones...");
    try {
        // Stop oscillators
        currentSources.left?.stop();
        currentSources.right?.stop();
        currentSources.isochronic?.stop();

        // Clear interval if it exists (for isochronic)
        if (currentSources.intervalId) {
            clearInterval(currentSources.intervalId);
        }

        // Disconnect nodes to release resources
        currentSources.left?.disconnect();
        currentSources.right?.disconnect();
        currentSources.isochronic?.disconnect();
        currentSources.isochronicGain?.disconnect();
        currentSources.panner?.disconnect();
        currentSources.gain?.disconnect();

    } catch (error) {
        // Ignore errors during stop/disconnect, often related to nodes already stopped
        console.warn("Minor error during tone stop/cleanup:", error);
    } finally {
        currentSources = null;
        // Optionally close the AudioContext if no longer needed (can cause issues if reused later)
        // if (audioContext && audioContext.state !== 'closed') {
        //     audioContext.close().then(() => audioContext = null);
        // }
    }
}

/**
 * Updates the volume of currently playing tones.
 */
export function setVolume(volume: number) {
    if (currentSources?.gain && audioContext) {
        const clampedVolume = Math.max(0, Math.min(1, volume));
        currentSources.gain.gain.setValueAtTime(clampedVolume, audioContext.currentTime);
        console.log("Volume updated to:", clampedVolume);
    }
}