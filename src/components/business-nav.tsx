"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, CalendarDays, Handshake, Home, MapPin, Megaphone, Settings, Sparkles, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/venues", icon: MapPin, label: "Venues" },
  { href: "/events", icon: CalendarDays, label: "Events" },
  { href: "/browse", icon: Users, label: "Talent" },
  { href: "/bookings", icon: Calendar, label: "Bookings" },
  { href: "/promoters", icon: Handshake, label: "Promoters" },
  { href: "/promotions", icon: Megaphone, label: "Promos" },
  { href: "/package-stops", icon: Sparkles, label: "Packages" },
  { href: "/vibe-bookings", icon: Sparkles, label: "Vibes" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function BusinessNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-wtva-dark-300 bg-white/95 shadow-sm backdrop-blur md:hidden">
      <div className="flex justify-around py-2">
        {links.map(({ href, icon: Icon, label }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 px-2 text-xs font-semibold",
                active ? "text-accent" : "text-wtva-muted",
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
