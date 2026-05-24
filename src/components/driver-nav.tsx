"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Car, ClipboardList, Home, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/driver", icon: Home, label: "Home" },
  { href: "/driver/company", icon: Settings, label: "Company" },
  { href: "/driver/fleet", icon: Car, label: "Fleet" },
  { href: "/driver/bookings", icon: ClipboardList, label: "Bookings" },
];

export function DriverNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-wtva-dark-300 bg-wtva-dark-400/95 backdrop-blur md:hidden">
      <div className="flex justify-around py-2">
        {links.map(({ href, icon: Icon, label }) => {
          const active =
            href === "/driver" ? pathname === "/driver" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 px-2 text-xs",
                active ? "text-foreground" : "text-wtva-muted",
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
