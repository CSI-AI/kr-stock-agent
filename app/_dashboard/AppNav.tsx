"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAV_ITEMS = [
  { href: "/", label: "대시보드" },
  { href: "/magic-formula/rankings", label: "순위검증" },
  { href: "/performance", label: "성과분석" },
  { href: "/settings", label: "설정" },
];

// updatedAt 형식: formatShortDate 출력 "YY.MM.DD HH:mm" (예: "26.06.01 08:45").
function parseShortDate(value?: string): Date | null {
  if (!value) return null;
  const m = value.match(/^(\d{2})\.(\d{2})\.(\d{2})/);
  if (!m) return null;
  const d = new Date(2000 + Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function AppNav({ updatedAt }: { updatedAt?: string }) {
  const pathname = usePathname();
  // stale 판정은 현재 날짜 기준이라 클라이언트에서만 계산(SSR/CSR 불일치 방지).
  const [stale, setStale] = useState(false);

  useEffect(() => {
    const base = parseShortDate(updatedAt);
    if (!base) {
      setStale(false);
      return;
    }
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const days = Math.round((today.getTime() - base.getTime()) / 86400000);
    // 주말·휴장 갱신 공백을 감안해 3일 이상 지난 경우에만 조용히 표시.
    setStale(days >= 3);
  }, [updatedAt]);

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
        <span>데이터 기준{updatedAt ? ` · ${updatedAt}` : null}</span>
        {stale ? <span className="dataStaleNote">최근 갱신 대기 중</span> : null}
      </div>
    </header>
  );
}
