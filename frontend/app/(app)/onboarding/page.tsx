// neuroforge/frontend/app/(app)/onboarding/page.tsx
// Purpose: Simple onboarding page for new users
"use client";

import { Button } from "components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "components/ui/card";
import { useState } from "react";
import { useRouter } from "next/navigation";
// import { updateUserOnboardingStatus } from "@/lib/api"; // API call to mark onboarding complete

export default function OnboardingPage() {
    const [step, setStep] = useState(1);
    const [code, setCode] = useState("");
    const [cracked, setCracked] = useState(false);
    const router = useRouter();

    const handleCodeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Simple check for the "code"
        if (code.toLowerCase() === "neuroforge") {
            setCracked(true);
            // Optionally call API to mark onboarding as complete
            // updateUserOnboardingStatus(true).catch(console.error);
            // setStep(2); // Move to next step if there is one
        } else {
            alert("Incorrect code sequence. Analyze the transmission again.");
        }
    };

    const finishOnboarding = () => {
        // Mark onboarding complete on backend (if not done earlier)
        // updateUserOnboardingStatus(true).catch(console.error);
        router.push('/dashboard'); // Redirect to dashboard
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-theme(space.16))] p-6">
             <Card className="w-full max-w-xl bg-card">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center text-primary">NeuroForge Onboarding Protocol</CardTitle>
                    <CardDescription className="text-center">Welcome, Operative. Initiate cognitive synchronization.</CardDescription>
                </CardHeader>
                <CardContent>
                    {step === 1 && !cracked && (
                        <form onSubmit={handleCodeSubmit} className="space-y-4">
                            <h3 className="text-lg font-semibold">Phase 1: Decryption Sequence</h3>
                            <p className="text-sm text-muted-foreground">
                                Access requires validation. Decrypt the primary activation keyword hidden within the project's core identity signal.
                                <span className="block text-xs italic">(Hint: What is the name of this classified project?)</span>
                            </p>
                            <div>
                                <label htmlFor="code" className="block text-sm font-medium mb-1">Enter Code:</label>
                                <input
                                    id="code"
                                    type="text"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md bg-input text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="Activation Keyword"
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full">
                                Attempt Decryption
                            </Button>
                        </form>
                    )}

                    {cracked && (
                        <div className="text-center space-y-4">
                             <h3 className="text-xl font-semibold text-green-500">Sequence Accepted!</h3>
                             <p>Cognitive link established. You have successfully bypassed the initial security layer.</p>
                             <p className="text-sm text-muted-foreground">
                                 Prepare for accelerated learning protocols. Your journey into the NeuroForge begins now.
                             </p>
                            <Button onClick={finishOnboarding} className="w-full">
                                Proceed to Dashboard
                            </Button>
                        </div>
                    )}

                    {/* Add Step 2 here if needed */}
                    {/* {step === 2 && ( ... next part of onboarding ... )} */}

                </CardContent>
             </Card>
        </div>
    );
}