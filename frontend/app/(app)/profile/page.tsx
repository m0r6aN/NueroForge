// neuroforge/frontend/app/(app)/profile/page.tsx or a dedicated settings page
// Purpose: Allow users to manage their settings, including audio preferences
"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { updateMyProfile } from 'lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'components/ui/card';
import { Label } from 'components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from 'components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
// Import Select, Slider etc. if adding more controls here

export default function ProfileSettingsPage() {
    const { data: session, update: updateSession } = useSession(); // Get session and update function
    const [isLoading, setIsLoading] = useState(false);
    const [audioEnabled, setAudioEnabled] = useState(false);
    // Add state for other audio prefs if editing them here (volume, default preset)
    const { toast } = useToast();

    // Initialize state from session when component mounts or session updates
    useEffect(() => {
        const audioPrefs = (session?.user as any)?.preferences?.audio;
        if (audioPrefs) {
            setAudioEnabled(audioPrefs.enabled ?? false);
            // Set other states like defaultVolume, defaultPreset if needed
        }
    }, [session]);

    const handleAudioEnableChange = async (enabled: boolean) => {
        setAudioEnabled(enabled); // Optimistic UI update
        setIsLoading(true);
        try {
             const response = await updateMyProfile({ preferences: { audio: { enabled } } });
             if (response.success) {
                 toast({ title: "Audio Setting Updated" });
                 // IMPORTANT: Update the session client-side to reflect change immediately
                 // This avoids needing a page refresh for the BinauralPlayer to get the new setting
                 await updateSession({
                     ...session,
                     user: {
                         ...session?.user,
                         preferences: {
                            ...(session?.user as any)?.preferences,
                             audio: {
                                 ...((session?.user as any)?.preferences?.audio),
                                 enabled: enabled
                             }
                         }
                     }
                 });
             } else {
                 throw new Error(response.message || "Failed to update setting");
             }
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
            setAudioEnabled(!enabled); // Revert UI on error
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Profile & Settings</h1>

            {/* Other profile sections (Name, Avatar, Theme etc.) */}

            <Card>
                <CardHeader>
                    <CardTitle>Audio Enhancement</CardTitle>
                    <CardDescription>Configure binaural beats and isochronic tones for cognitive states.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                        <div className="space-y-0.5">
                             <Label htmlFor="audio-enable" className="text-base">Enable Audio Enhancement</Label>
                             <p className="text-sm text-muted-foreground">
                                 Activate background audio tones during learning sessions.
                             </p>
                        </div>
                        <Switch
                            id="audio-enable"
                            checked={audioEnabled}
                            onCheckedChange={handleAudioEnableChange}
                            disabled={isLoading}
                        />
                         {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    </div>

                    {/* Add controls for Default Volume and Default Preset here if desired */}
                    {/* Example:
                     <div className="space-y-2">
                         <Label htmlFor="default-volume">Default Volume</Label>
                         <Slider id="default-volume" ... />
                     </div>
                     <div className="space-y-2">
                         <Label htmlFor="default-preset">Default Preset</Label>
                         <Select id="default-preset" ... > ... </Select>
                     </div>
                     <Button onClick={handleSaveAudioSettings} disabled={isLoading}>Save Audio Settings</Button>
                     */}

                </CardContent>
            </Card>
        </div>
    );
}