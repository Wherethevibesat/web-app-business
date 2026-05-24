"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/promoter", label: "Home" },
  { href: "/promoter/profile", label: "Profile" },
  { href: "/promoter/venues", label: "Venues" },
  { href: "/promoter/events", label: "Events" },
  { href: "/promoter/offers", label: "Offers" },
  { href: "/promoter/inbox", label: "Inbox" },
];

export function PromoterNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-wtva-dark-300 bg-wtva-dark-500 md:hidden">
      <div className="flex justify-around py-2">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-2 py-1 text-xs font-medium ${
                active ? "text-foreground" : "text-wtva-muted"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
