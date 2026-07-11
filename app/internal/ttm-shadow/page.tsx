"use client";

// 내부 PoC — Shadow Portfolio(공식 연간 top30 vs TTM 실험 top30) 조회 전용.
// 가상 포트폴리오. 실주문 없음. 운영 nav 미노출. 공식 순위 미반영.
// Phase MF-TTM-SHADOW-PORTFOLIO-POC.

import { useState } from "react";
import freeze from "./freeze.json";

const won = (v: number | null | undefined) =>
  v == null ? "-" : Math.round(v).toLocaleString() + "원";
const wonMan = (v: number | null | undefined) =>
  v == null ? "-" : (v / 1e4).toLocaleString(undefined, { maximumFractionDigits: 0 }) + "만";

function Badge({ children, tone = "gray" }: { children: React.ReactNode; tone?: string }) {
  const t: Record<string, string> = {
    gray: "bg-gray-100 text-gray-700", red: "bg-red-100 text-red-800",
    blue: "bg-blue-100 text-blue-800", green: "bg-green-100 text-green-800", amber: "bg-amber-100 text-amber-800",
  };
  return <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${t[tone]}`}>{children}</span>;
}

type Holding = {
  stockCode: string; companyName: string; rankAtFreeze: number;
  entryPrice: number | null; shares: number; investedAmount: number;
  weight: number; qualityStatus: string;
};

function HoldingsTable({ holdings, isTtm }: { holdings: Holding[]; isTtm: boolean }) {
  const common = new Set(freeze.overlap.common);
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="border-b border-gray-300 text-left text-gray-500">
            <th className="p-1.5">순위</th>
            <th className="p-1.5">종목</th>
            <th className="p-1.5">기준가</th>
            <th className="p-1.5">수량</th>
            <th className="p-1.5">투자금액</th>
            <th className="p-1.5">비중</th>
            <th className="p-1.5">공통</th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((h) => (
            <tr key={h.stockCode} className="border-b border-gray-100">
              <td className="p-1.5">{h.rankAtFreeze}</td>
              <td className="p-1.5 font-medium">{h.companyName} <span className="text-gray-400">{h.stockCode}</span>{isTtm && h.qualityStatus !== "PASS" ? <span className="ml-1 text-blue-500">·{h.qualityStatus.replace("PASS_", "")}</span> : null}</td>
              <td className="p-1.5">{won(h.entryPrice)}</td>
              <td className="p-1.5">{h.shares}주</td>
              <td className="p-1.5">{won(h.investedAmount)}</td>
              <td className="p-1.5">{h.weight ? (h.weight * 100).toFixed(1) + "%" : "-"}</td>
              <td className="p-1.5">{common.has(h.stockCode) ? "●" : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function TtmShadowPage() {
  const [tab, setTab] = useState<"annual" | "ttm">("annual");
  const m = freeze.sourceMetadata;
  const a = freeze.strategies.annual;
  const t = freeze.strategies.ttm;

  return (
    <div className="mx-auto max-w-6xl p-6 text-sm">
      <h1 className="text-xl font-bold">Shadow Portfolio — 공식 연간 vs TTM 실험 (내부 PoC)</h1>
      <div className="mt-2 flex flex-wrap gap-2">
        <Badge tone="red">가상 포트폴리오</Badge>
        <Badge tone="red">실주문 없음</Badge>
        <Badge tone="red">투자 추천 아님</Badge>
        <Badge tone="gray">공식 순위 미반영</Badge>
        <Badge tone="blue">TTM = 실험값</Badge>
      </div>
      <p className="mt-2 text-xs text-gray-500">{freeze.disclaimer}</p>

      {/* 기준일 */}
      <div className="mt-3 rounded-lg border border-gray-200 p-3 text-xs text-gray-600">
        freezeId {m.freezeId} · freezeDate {m.freezeDate} · priceAsOfDate {m.priceAsOfDate} ·
        연간 {m.annualFinancialYear} · TTM {m.ttmAsOfQuarter} · {m.leakageNote}
      </div>

      {/* 두 전략 요약 카드 */}
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {([["공식 연간 top30", a, "green"], ["TTM 실험 top30", t, "blue"]] as const).map(([label, s, tone]) => (
          <div key={label} className="rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="font-semibold">{label}</div>
              <Badge tone={tone}>{s.strategyType}</Badge>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-center">
              <div><div className="text-xs text-gray-500">초기자본</div><div className="font-semibold">{wonMan(s.initialCapital)}</div></div>
              <div><div className="text-xs text-gray-500">투자금액</div><div className="font-semibold">{wonMan(s.investedAmount)}</div></div>
              <div><div className="text-xs text-gray-500">잔여현금</div><div className="font-semibold">{won(s.cash)}</div></div>
            </div>
          </div>
        ))}
      </div>

      {/* 교집합 */}
      <div className="mt-3 rounded-lg border border-gray-200 p-3 text-xs">
        <span className="font-semibold">종목 구성:</span> 공통 {freeze.overlap.commonCount}종 · 공식 전용 {freeze.overlap.annualOnly.length}종 · TTM 전용 {freeze.overlap.ttmOnly.length}종
        <span className="ml-2 text-gray-500">(TTM top30 내 WARNING/BLOCKED 포함 {freeze.warningBlockedExcludedFromTtm.ttmTop30HasNonPass}종)</span>
      </div>

      {/* 스냅샷 이력(관찰 전) */}
      <div className="mt-3 rounded-lg border border-dashed border-gray-300 p-3 text-xs text-gray-500">
        📈 주간 스냅샷 이력: <b>관찰 시작 전(0 스냅샷)</b>. 매주 금요일 장 마감 후 종가로 누적 예정(read-only). 초기 몇 주 성과로 우열 결론 금지 · 최소 6개월 관찰.
      </div>

      {/* 보유종목 탭 */}
      <div className="mt-4">
        <div className="flex gap-2">
          <button onClick={() => setTab("annual")} className={`rounded px-3 py-1 text-xs ${tab === "annual" ? "bg-green-600 text-white" : "bg-gray-100"}`}>공식 연간 top30</button>
          <button onClick={() => setTab("ttm")} className={`rounded px-3 py-1 text-xs ${tab === "ttm" ? "bg-blue-600 text-white" : "bg-gray-100"}`}>TTM 실험 top30</button>
        </div>
        <div className="mt-2">
          {tab === "annual" ? <HoldingsTable holdings={a.holdings as Holding[]} isTtm={false} /> : <HoldingsTable holdings={t.holdings as Holding[]} isTtm={true} />}
        </div>
      </div>
    </div>
  );
}
