// neuroforge/frontend/components/layout/Navbar.tsx
// Purpose: Top navigation bar for authenticated users
"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "components/ui/button";
import { ThemeToggle } from "components/common/ThemeToggle";
import { LayoutGrid, LogOut, Settings, User as UserIcon } from "lucide-react"; // Icons
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "components/ui/skeleton"; // For loading state

export function Navbar() {
    const { data: session, status } = useSession(); // Get session data and status

    const getUserInitials = (name?: string | null) => {
        if (!name) return "NF"; // NeuroForge fallback
        const names = name.split(' ');
        if (names.length > 1) {
            return names[0][0] + names[names.length - 1][0];
        }
        return name.substring(0, 2);
    };

    const userXp = (session?.user as any)?.xp ?? 0; // Use 'any' or extend Session type properly
    const userLevel = (session?.user as any)?.level ?? 1;

    return (
        <nav className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur md:px-6">
            {/* Left side - Placeholder for Breadcrumbs or Title */}
            {/* Left side - Maybe show Level/XP briefly */}
            {/* --- START NEW --- */}
            <div className="flex items-center gap-2 text-sm">
                 <span className="font-semibold hidden sm:inline">NeuroForge</span>
                 {status === 'authenticated' && (
                     <span className="text-muted-foreground hidden lg:inline">| Lvl: {userLevel} | XP: {userXp}</span>
                 )}
            </div>
            <div>
                {/* Maybe display current section title here */}
                <span className="font-semibold">NeuroForge Terminal</span>
            </div>

             {/* Right side - Theme toggle and User Menu */}
             <div className="flex items-center gap-4">
                {/* --- START NEW --- */}
                 {/* Optional: Show condensed Level/XP here too */}
                 {status === 'authenticated' && (
                     <span className="text-xs text-muted-foreground lg:hidden">L{userLevel}</span>
                 )}
                 {/* --- END NEW --- */}
                <ThemeToggle />

                {status === "loading" && (
                    <Skeleton className="h-9 w-9 rounded-full" />
                )}

                {status === "authenticated" && session?.user && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src={session.user.image || undefined} alt={session.user.name || "User Avatar"} />
                                    <AvatarFallback>{getUserInitials(session.user.name)}</AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{session.user.name}</p>
                                    <p className="text-xs leading-none text-muted-foreground">
                                        {session.user.email}
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild className="cursor-pointer">
                                <Link href="/dashboard"><LayoutGrid className="mr-2 h-4 w-4" /> Dashboard</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="cursor-pointer">
                                <Link href="/profile"><UserIcon className="mr-2 h-4 w-4" /> Profile</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="cursor-pointer">
                                <Link href="/settings"><Settings className="mr-2 h-4 w-4" /> Settings</Link>
                            </DropdownMenuItem>
                             <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/' })} className="cursor-pointer text-red-500 focus:text-red-600 focus:bg-red-100/50">
                                <LogOut className="mr-2 h-4 w-4" /> Log out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}

                 {status === "unauthenticated" && (
                     <Button asChild variant="outline" size="sm">
                         <Link href="/login">Log In</Link>
                     </Button>
                 )}
            </div>
        </nav>
    );
}