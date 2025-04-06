// neuroforge/frontend/components/layout/Sidebar.tsx
// Purpose: Side navigation for authenticated app sections
"use client"; // If using hooks like usePathname

import Link from "next/link";
import { usePathname } from 'next/navigation';
import { cn } from "lib/utils"; // Shadcn utility for conditional classes
import { Button } from "components/ui/button";
import { Home, BookOpen, BrainCircuit, BarChart3, Award, Users, Rocket, Code } from "lucide-react"; // Icons

// Define navigation items
const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/subjects", label: "Subjects", icon: BookOpen },
  { href: "/learn", label: "Learning Hub", icon: BrainCircuit },
  { href: "/progress", label: "Progress", icon: BarChart3 },
  { href: "/achievements", label: "Achievements", icon: Award },
  { href: "/community", label: "Community", icon: Users },
  { href: "/ar", label: "AR Quests", icon: Rocket },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="hidden h-screen w-64 flex-col border-r bg-background p-4 md:flex">
            {/* Logo/Brand */}
            <div className="mb-6 flex items-center gap-2 px-2">
                {/* Replace with actual Neon Brain logo */}
                <BrainCircuit className="h-8 w-8 text-purple-500" />
                <span className="text-xl font-bold tracking-tight">NeuroForge</span>
            </div>

            {/* Navigation */}
            <nav className="flex flex-col gap-1">
                {navItems.map((item) => (
                    <Button
                        key={item.href}
                        asChild
                        variant={pathname === item.href ? "secondary" : "ghost"}
                        className={cn(
                            "w-full justify-start",
                            pathname === item.href && "font-semibold"
                        )}
                    >
                        <Link href={item.href}>
                            <item.icon className="mr-2 h-4 w-4" />
                            {item.label}
                        </Link>
                    </Button>
                ))}
            </nav>

             {/* Optional: Onboarding Link if needed */}
             <div className="mt-auto">
                 <Button
                     asChild
                     variant={pathname === "/onboarding" ? "secondary" : "ghost"}
                     className={cn("w-full justify-start", pathname === "/onboarding" && "font-semibold")}
                 >
                    <Link href="/onboarding">
                         <Code className="mr-2 h-4 w-4" /> Onboarding Test
                    </Link>
                 </Button>
             </div>
        </aside>
    );
}