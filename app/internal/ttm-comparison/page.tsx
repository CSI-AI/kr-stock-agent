"use client";

// 내부 PoC — 공식 연간 마법공식값 vs TTM 실험값 비교(조회 전용).
// 운영 nav 미노출. 운영 데이터/공식 순위 미반영. 투자 추천 아님.
// Phase MF-TTM-READONLY-COMPARISON-DASHBOARD-POC. 소형 fixture(20종)만 사용.

import { Fragment, useMemo, useState } from "react";
import fixture from "./fixture.json";

type Row = (typeof fixture.rows)[number];

const won = (v: number | null | undefined) =>
  v == null ? "-" : (v / 1e8).toLocaleString(undefined, { maximumFractionDigits: 0 }) + "억";
const pctFmt = (v: number | null | undefined) => (v == null ? "-" : (v * 100).toFixed(2) + "%");
const num = (v: number | null | undefined) => (v == null ? "-" : v.toLocaleString());

function Badge({ children, tone = "gray" }: { children: React.ReactNode; tone?: string }) {
  const tones: Record<string, string> = {
    gray: "bg-gray-100 text-gray-700",
    amber: "bg-amber-100 text-amber-800",
    green: "bg-green-100 text-green-800",
    blue: "bg-blue-100 text-blue-800",
    red: "bg-red-100 text-red-800",
  };
  return <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${tones[tone] || tones.gray}`}>{children}</span>;
}

const statusTone: Record<string, string> = {
  PASS: "green",
  PASS_WITH_TRANSITION_NOTE: "blue",
  PASS_OFFICIAL_IR_CONFIRMED: "amber",
};

export default function TtmComparisonPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("ALL");
  const [bigOnly, setBigOnly] = useState(false);
  const [open, setOpen] = useState<string | null>(null);

  const rows = fixture.rows as Row[];
  const s = fixture.summary;
  const st = fixture.stats as unknown as Record<string, number | string>;

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (q && !(`${r.companyName}${r.stockCode}`.toLowerCase().includes(q.toLowerCase()))) return false;
      if (status !== "ALL" && r.qualityStatus !== status) return false;
      if (bigOnly && Math.abs(r.comparison.combinedRankChange ?? 0) < 50) return false;
      return true;
    });
  }, [rows, q, status, bigOnly]);

  return (
    <div className="mx-auto max-w-6xl p-6 text-sm">
      <h1 className="text-xl font-bold">TTM 실험값 vs 공식 연간값 비교 (내부 PoC)</h1>
      <div className="mt-2 flex flex-wrap gap-2">
        <Badge tone="red">운영 미반영</Badge>
        <Badge tone="red">투자 추천 아님</Badge>
        <Badge tone="gray">비교용 PoC</Badge>
        <Badge tone="gray">공식 연간 기준 = 운영값</Badge>
        <Badge tone="blue">TTM 실험 기준 = 최근 4분기(2026Q1 종료)</Badge>
      </div>
      <p className="mt-2 text-xs text-gray-500">{fixture.disclaimer}</p>

      {/* 요약 카드 */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          ["공식 eligible", s.officialEligible],
          ["TTM 포함(PASS계열)", s.includedExperiment],
          ["WARNING 제외", s.excludedWarning],
          ["BLOCKED 제외", s.excludedBlocked],
          ["미완성 제외", s.excludedIncomplete],
          ["실험순위 산출", s.experimentalRanked],
        ].map(([k, v]) => (
          <div key={k as string} className="rounded-lg border border-gray-200 p-3">
            <div className="text-xs text-gray-500">{k}</div>
            <div className="text-lg font-semibold">{num(v as number)}</div>
          </div>
        ))}
      </div>
      <div className="mt-1 text-xs text-gray-500">
        기준일 {fixture.generatedAt} · 연간 {fixture.annualFinancialYear} · TTM {fixture.ttmAsOfQuarter} · formula {fixture.formulaVersionAnnual}
      </div>

      {/* 분포/통계 */}
      <div className="mt-4 rounded-lg border border-gray-200 p-3">
        <div className="font-semibold">순위 민감도(전체 실험집합 기준, fixture는 표본 20종)</div>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            ["공식 top100 ∩ 실험 top100", st.annualTop100_vs_expTop100_overlap],
            ["실험 top100 신규진입", st.expTop100_newEntrants],
            ["실험 top100 이탈", st.expTop100_dropouts],
            ["평균 순위변화(subset)", st.avgCombinedRankChange_subset],
            ["중앙 순위변화(subset)", st.medianCombinedRankChange_subset],
            ["50위 이상 급변 종목", st.bigMovers_over50],
          ].map(([k, v]) => (
            <div key={k as string} className="rounded bg-gray-50 p-2">
              <div className="text-xs text-gray-500">{k}</div>
              <div className="font-semibold">{num(v as number)}</div>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-amber-700">selection bias: {st.selectionBias}</p>
      </div>

      {/* 필터 */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input
          className="rounded border border-gray-300 px-2 py-1"
          placeholder="종목명/코드 검색"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className="rounded border border-gray-300 px-2 py-1" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="ALL">전체 상태</option>
          <option value="PASS">PASS</option>
          <option value="PASS_WITH_TRANSITION_NOTE">TRANSITION_NOTE</option>
          <option value="PASS_OFFICIAL_IR_CONFIRMED">IR_CONFIRMED</option>
        </select>
        <label className="flex items-center gap-1 text-xs">
          <input type="checkbox" checked={bigOnly} onChange={(e) => setBigOnly(e.target.checked)} />
          50위+ 급변만
        </label>
        <span className="text-xs text-gray-500">{filtered.length} / {rows.length}종 (표본)</span>
      </div>

      {/* 비교 테이블 */}
      <div className="mt-2 overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-gray-300 text-left text-gray-500">
              <th className="p-2">종목</th>
              <th className="p-2">공식 종합순위</th>
              <th className="p-2">실험 종합순위</th>
              <th className="p-2">Δ(subset)</th>
              <th className="p-2">공식 EBIT/EV</th>
              <th className="p-2">실험 EBIT/EV</th>
              <th className="p-2">공식 자본수익률</th>
              <th className="p-2">실험 자본수익률</th>
              <th className="p-2">상태</th>
              <th className="p-2">기준분기</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const d = r.comparison.combinedRankChange;
              return (
                <Fragment key={r.stockCode}>
                  <tr
                    className="cursor-pointer border-b border-gray-100 hover:bg-gray-50"
                    onClick={() => setOpen(open === r.stockCode ? null : r.stockCode)}
                  >
                    <td className="p-2 font-medium">{r.companyName} <span className="text-gray-400">{r.stockCode}</span></td>
                    <td className="p-2">{num(r.annual.annualCombinedRankInSubset)} <span className="text-gray-400">(공식 {num(r.annual.combinedRank)})</span></td>
                    <td className="p-2">{num(r.ttmExperiment.experimentalCombinedRank)}</td>
                    <td className={`p-2 ${d == null ? "" : d < 0 ? "text-green-700" : d > 0 ? "text-red-700" : "text-gray-500"}`}>
                      {d == null ? "-" : (d < 0 ? "▲" : d > 0 ? "▼" : "") + Math.abs(d)}
                    </td>
                    <td className="p-2">{pctFmt(r.annual.ebitEv)}</td>
                    <td className="p-2">{pctFmt(r.ttmExperiment.experimentalEbitEv)}</td>
                    <td className="p-2">{pctFmt(r.annual.returnOnCapital)}</td>
                    <td className="p-2">{pctFmt(r.ttmExperiment.experimentalReturnOnCapital)}</td>
                    <td className="p-2"><Badge tone={statusTone[r.qualityStatus]}>{r.qualityStatus.replace("PASS_", "").replace("_CONFIRMATION", "")}</Badge></td>
                    <td className="p-2">{r.sourceTrace.ttmAsOfQuarter}</td>
                  </tr>
                  {open === r.stockCode && (
                    <tr className="bg-gray-50">
                      <td className="p-3" colSpan={10}>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <div className="font-semibold">최근 4개 단일분기 영업이익</div>
                            <div className="mt-1 flex gap-3">
                              {r.ttmExperiment.quarterlyOperatingIncome &&
                                Object.entries(r.ttmExperiment.quarterlyOperatingIncome as Record<string, number>).map(([q2, v]) => (
                                  <span key={q2}>{q2}: <b>{won(v)}</b></span>
                                ))}
                            </div>
                            <div className="mt-1 text-gray-600">TTM 영업이익(합) = {won(r.ttmExperiment.operatingIncome)} · TTM 매출 {won(r.ttmExperiment.revenue)}</div>
                            <div className="text-gray-600">최신 BS 기준: {r.sourceTrace.latestBsQuarter}</div>
                          </div>
                          <div>
                            <div className="font-semibold">공식 연간(운영값) vs 실험</div>
                            <div className="mt-1 text-gray-600">공식 영업이익 {won(r.annual.operatingIncome)} → TTM {won(r.ttmExperiment.operatingIncome)} ({r.comparison.operatingIncomeChangePct ?? "-"}%)</div>
                            <div className="text-gray-600">최신 유동자산 {won(r.ttmExperiment.latestCurrentAssets)} · 유동부채 {won(r.ttmExperiment.latestCurrentLiabilities)} · 유형자산 {won(r.ttmExperiment.latestPpe)} · 현금 {won(r.ttmExperiment.latestCash)} · 총부채 {won(r.ttmExperiment.latestTotalDebt)}</div>
                            <div className="text-gray-500 mt-1">상태: {r.qualityStatus}{r.ttmExperiment.excludeReason ? ` · 순위제외: ${r.ttmExperiment.excludeReason}` : ""}</div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 제외 사례 */}
      <div className="mt-6">
        <div className="font-semibold">TTM 공식 후보 제외 사례(공식 연간 순위는 유지)</div>
        <ul className="mt-1 text-xs text-gray-600">
          {fixture.excludedExamples.map((e) => (
            <li key={e.stockCode}>
              {e.companyName} <span className="text-gray-400">{e.stockCode}</span> — {e.qualityStatus} · 공식 종합순위 {num(e.officialCombinedRank)} (TTM 실험만 제외, 연간 마법공식 대상 유지)
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
