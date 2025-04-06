// neuroforge/frontend/components/audio/BinauralPlayer.tsx
// Purpose: UI component to control the binaural/isochronic tones
"use client";

import React, { useState, useEffect } from 'react';
import { useBinauralBeats, audioPresets, PresetKey } from 'hooks/useBinauralBeats';
import { Button } from 'components/ui/button';
import { Slider } from "components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Pause, Volume1, Volume2, VolumeX, Settings2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
//import { Label } from "@/components/ui/label";
import { useSession } from 'next-auth/react';
import { updateMyProfile } from 'lib/api';
import { toast } from 'sonner';
import { useNeuroForgeWebSocket } from '@/components/providers/websocket-provider'; // Import WS hook
import { WebSocketStatus } from '@/hooks/useWebSocket'; // Import status enum


export function BinauralPlayer() {
    const { data: session } = useSession();
    const userPreferences = (session?.user as any)?.preferences?.audio; // Adjust type as needed
    const { sendMessage, status: wsStatus } = useNeuroForgeWebSocket(); // Get WS send function

    // Initialize state from user preferences or defaults
    const initialVolume = userPreferences?.defaultVolume ?? 0.5;
    const initialPreset = userPreferences?.defaultPreset ?? 'focus'; // Default to 'focus' if not set

    const { isPlaying, volume, currentPreset, play, stop, setVolume, supported } = useBinauralBeats(initialVolume);
    const [selectedPreset, setSelectedPreset] = useState<PresetKey>(initialPreset);
    const [isGloballyEnabled, setIsGloballyEnabled] = useState(userPreferences?.enabled ?? false); // Control overall feature

    // Function to send audio interaction update
    const sendAudioInteraction = useCallback((preset: PresetKey | null, volumeValue: number, playing: boolean) => {
        if (wsStatus === WebSocketStatus.OPEN) {
                sendMessage({
                    type: 'interaction',
                    payload: {
                        // Context can be global or tied to current activity if available
                        context: { type: 'global', id: null },
                        interactionType: 'audio_preset_change',
                        details: {
                            preset: preset,
                            volume: volumeValue,
                            isPlaying: playing
                        }
                    }
                });
        }
    }, [sendMessage, wsStatus]);
    

    // Effect to play the initial/default preset if enabled
    useEffect(() => {
        if (isGloballyEnabled && !isPlaying && selectedPreset) {
            play(selectedPreset);
        } else if (!isGloballyEnabled && isPlaying) {
            stop();
        }
        // Intentionally exclude play/stop/isPlaying from deps to only run on enabled/preset change
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isGloballyEnabled, selectedPreset]);


    const handlePlayPause = () => {
        let nextPlayingState: boolean;
        let nextPresetState: PresetKey | null;

        if (isPlaying) {
            stop(); // Call the hook's stop function
            nextPlayingState = false;
            nextPresetState = null; // Preset becomes null when stopped
            setIsGloballyEnabled(false);
            saveAudioPreference({ enabled: false });
        } else if (selectedPreset) {
            play(selectedPreset); // Call the hook's play function
            nextPlayingState = true;
            nextPresetState = selectedPreset;
            setIsGloballyEnabled(true);
            saveAudioPreference({ enabled: true });
        } else {
             // Should not happen if a preset is always selected when trying to play
             return;
         }
          // Send WS update AFTER state change logic
        sendAudioInteraction(nextPresetState, volume, nextPlayingState);
    };

    const handleVolumeChange = (value: number[]) => {
        const newVolume = value[0];
        setVolume(newVolume);
        // Send update immediately while sliding? Or only on commit? Let's do on commit for less noise.
    };

    const handleVolumeCommit = (value: number[]) => {
        const newVolume = value[0];
        saveAudioPreference({ defaultVolume: newVolume });
        // Send WS update on commit
        sendAudioInteraction(currentPreset, newVolume, isPlaying);
    };

    const handlePresetChange = (value: PresetKey) => {
        setSelectedPreset(value);
         let nextPlayingState = isPlaying;
        if (isPlaying) {
            play(value); // Restart with the new preset
             nextPlayingState = true; // Ensure playing state is true if restarting
        }
         saveAudioPreference({ defaultPreset: value });
         // Send WS update on preset change
         sendAudioInteraction(value, volume, nextPlayingState);
    };

    const saveAudioPreference = async (prefsToSave: { [key: string]: any }) => {
        try {
             await updateMyProfile({ preferences: { audio: prefsToSave } });
             toast("Audio preference saved", { 
                description: "Duration: 2000"
             });
             // Optionally refresh session data if needed, though `updateMyProfile` might return updated user
        } catch (error) {
             console.error("Failed to save audio preference:", error);
             toast("Error saving preference");
        }
     };


    if (!supported) {
        return <p className="text-xs text-destructive">Audio Enhancement not supported by browser.</p>;
    }

    const getVolumeIcon = () => {
        if (volume === 0 || !isGloballyEnabled) return <VolumeX className="h-4 w-4" />;
        if (volume < 0.5) return <Volume1 className="h-4 w--4" />;
        return <Volume2 className="h-4 w-4" />;
    };

    return (
        <div className="flex items-center gap-2 rounded-md border p-2 bg-background/80 backdrop-blur-sm shadow-sm">
            <Button variant="ghost" size="icon" onClick={handlePlayPause} title={isPlaying ? "Pause Tones" : "Play Tones"}>
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>

            <Select value={selectedPreset || ''} onValueChange={handlePresetChange} disabled={!isGloballyEnabled}>
                <SelectTrigger className="w-[150px] h-8 text-xs" title="Select Audio Preset">
                    <SelectValue placeholder="Select Preset" />
                </SelectTrigger>
                <SelectContent>
                    {Object.entries(audioPresets).map(([key, preset]) => (
                        <SelectItem key={key} value={key} className="text-xs">{preset.name}</SelectItem>
                    ))}
                    {/* Add Custom option later if needed */}
                </SelectContent>
            </Select>

            <div className="flex items-center gap-1 flex-1 mx-2">
                 <span title={`Volume: ${Math.round(volume * 100)}%`}>
                     {getVolumeIcon()}
                 </span>
                <Slider
                    min={0}
                    max={1}
                    step={0.05}
                    value={[volume]}
                    onValueChange={handleVolumeChange}
                     onValueCommit={handleVolumeCommit} // Save volume on release
                    className="w-full max-w-[100px]"
                    disabled={!isGloballyEnabled}
                />
            </div>

            {/* Optional: Popover for advanced settings */}
            <Popover>
                 <PopoverTrigger asChild>
                     <Button variant="ghost" size="icon" disabled={!isGloballyEnabled}>
                         <Settings2 className="h-4 w-4"/>
                     </Button>
                 </PopoverTrigger>
                 <PopoverContent className="w-60">
                     <p className="text-sm">Advanced Settings (coming soon)</p>
                 </PopoverContent>
            </Popover>
        </div>
    );
}