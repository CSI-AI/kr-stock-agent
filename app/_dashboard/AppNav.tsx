"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "대시보드" },
  { href: "/strategy-lab", label: "전략랩" },
  { href: "/performance", label: "성과분석" },
  { href: "/settings", label: "설정" },
];

export function AppNav({ updatedAt }: { updatedAt?: string }) {
  const pathname = usePathname();

  return (
    <header className="topBar">
      <div className="brand">
        <span>W</span> 와바바 투자 에이전트
      </div>
      <nav>
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={active ? "active" : undefined}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="topStatus">
        <span>
          자동운용 <span className="autoOn">● ON</span>
          {updatedAt ? ` · ${updatedAt}` : null}
        </span>
      </div>
    </header>
  );
}
