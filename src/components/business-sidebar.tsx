"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Handshake,
  Home,
  MapPin,
  Megaphone,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import { useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/venues", label: "Venues", icon: MapPin },
  { href: "/events", label: "Events", icon: CalendarDays },
  { href: "/browse", label: "Browse talent", icon: Users },
  { href: "/bookings", label: "Bookings", icon: Calendar },
  { href: "/promoters", label: "Promoters", icon: Handshake },
  { href: "/promotions", label: "Promotions", icon: Megaphone },
  { href: "/package-stops", label: "Night packages", icon: Sparkles },
  { href: "/vibe-bookings", label: "Vibe bookings", icon: Sparkles },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BusinessSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "hidden min-h-screen shrink-0 flex-col border-r border-wtva-dark-300 bg-white shadow-sm transition-all md:flex",
        collapsed ? "w-[72px]" : "w-64",
      )}
    >
      <div
        className={cn(
          "border-b border-wtva-dark-300 px-3 py-3",
          collapsed
            ? "flex flex-col items-center gap-1"
            : "flex items-center justify-between gap-2",
        )}
      >
        {collapsed ? (
          <Link
            href="/"
            className="block overflow-hidden"
            aria-label="Where The Vibes At"
          >
            <Image
              src="/brand/wtva-logo.jpg"
              alt="Where The Vibes At"
              width={1024}
              height={493}
              priority
              className="h-9 w-9 object-cover object-left mix-blend-multiply"
            />
          </Link>
        ) : (
          <BrandLogo
            href="/"
            label="Business"
            heightClass="h-9"
            className="min-w-0"
          />
        )}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="shrink-0 rounded-lg p-1.5 text-wtva-muted hover:bg-wtva-dark-300 hover:text-foreground"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      <nav className="flex flex-col gap-0.5 p-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "bg-accent-gradient text-white shadow-accent"
                  : "text-wtva-muted hover:bg-wtva-dark-300 hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
