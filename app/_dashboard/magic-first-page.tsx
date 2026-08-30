// magic-first-page.tsx — 공개 첫 화면 전용 표면 (WABABA-FIRST-PAGE-PERFORMANCE-HOLDINGS-UX-REFINE-R1)
//
// Founder 요구: 메인에 들어온 순간 **수익률**과 **수익률 그래프**가 한눈에 보여야 하고,
// 그 다음 무엇을 보유·매매했는지 이해한 뒤, 운영규칙과 검증자료로 내려갈 수 있어야 한다.
//
// 설계 원칙
//  - 기존 화면을 재설계하지 않는다. magic-official.tsx 의 파서·차트·헬퍼를 **그대로 재사용**한다.
//  - 데이터 계산을 하나도 바꾸지 않는다(public payload 읽기 전용). 새 chart 라이브러리 도입 없음.
//  - 개발자용 값(sequence·batchId·평가기준일)은 첫 인상에서 빼고 '운영 기록 검증'으로 모은다.
//  - 장기 백테스트 연구 결과는 이 화면에 노출하지 않는다(내부 연구 정본으로만 유지).
//  - 없는 것을 있는 것처럼 쓰지 않는다: 매도가 없으면 '최근 매도 없음' 을 그대로 표시한다.

import * as React from "react";
import {
  ACCENT,
  OMetric,
  benchmarkUsable,
  benchmarkMultiUsable,
  fmtDate,
  krw,
  parseMagicOfficialBenchmark,
  parseMagicOfficialBenchmarkMulti,
  parseMagicOfficialPortfolio,
  parseMagicOfficialSummary,
  parseMagicOfficialTradeDays,
  pct,
  tone,
} from "./magic-official";

type Rec = Record<string, unknown>;

// ① 성과 우선 Hero — 첫 인상. 누적수익률이 화면에서 가장 큰 요소다.
export function MagicPerformanceHero({ history }: { history: Rec }) {
  const summary = parseMagicOfficialSummary(history);
  if (!summary) return null;
  const bench = parseMagicOfficialBenchmark(history);
  const benchOk = benchmarkUsable(bench) && bench!.latest !== null;
  const benchName = bench?.benchmark ?? "KOSPI";
  const cum = summary.cumulativeReturn;
  // 메인 그래프에 그리는 지수와 **같은 목록**을 카드로도 보여준다. 그래프는
  // Fund/KOSPI/KOSDAQ 인데 요약만 KOSPI 하나면 두 영역의 benchmark 구성이
  // 어긋난다. 목록은 payload 의 displayKeys 가 정하므로 지수를 추가·교체해도
  // 이 컴포넌트는 그대로다(값 하드코딩 0).
  const multi = parseMagicOfficialBenchmarkMulti(history);
  const multiOk = benchmarkMultiUsable(multi);
  const shownBenchmarks = multiOk ? multi!.benchmarks : [];
  const signPct = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}`;

  return (
    <section
      style={{
        background: `linear-gradient(135deg, ${ACCENT.soft} 0%, #ffffff 62%)`,
        border: `1px solid ${ACCENT.border}`,
        borderTop: `3px solid ${ACCENT.primary}`,
        borderRadius: 16,
        padding: "18px 18px 16px",
        minWidth: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
        <h1 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: ACCENT.text, letterSpacing: "-0.01em" }}>
          와바바 마법공식 공개 모의장부
        </h1>
        {/* compliance — 수익률과 같은 영역에서 항상 보인다 */}
        <span style={{ fontSize: 11, fontWeight: 800, color: "#92400e", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 99, padding: "2px 9px" }}>
          가상운용 · 실제 투자 아님
        </span>
      </div>

      {/* 누적수익률 — 화면 최대 시각요소 */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: "#64748b" }}>누적수익률</span>
        <span style={{ fontSize: "clamp(38px, 11vw, 58px)", fontWeight: 900, lineHeight: 1.05, color: tone(cum), letterSpacing: "-0.02em" }}>
          {pct(cum)}
        </span>
      </div>
      <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, margin: "2px 0 12px" }}>
        {fmtDate(summary.officialStartDate)} 시작 · 기준일 {fmtDate(summary.dataDate)} 종가
      </div>

      {/* 벤치마크 / 초과 / 총자산 — 누적수익률 바로 아래 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8 }}>
        {shownBenchmarks.length > 0 ? (
          <>
            {/* 지수 누적수익률 — 그래프에 그리는 지수와 같은 목록·같은 순서 */}
            {shownBenchmarks.map((b) => (
              <OMetric key={b.key} label={`같은 기간 ${b.name}`}
                       value={pct(b.latestReturnPct)} color={tone(b.latestReturnPct)}
                       sub={`${fmtDate(multi!.baseDate)} = 0%`} />
            ))}
            {/* 초과성과 — 지수별로 하나씩. 어느 지수 대비인지 라벨에 명시한다 */}
            {shownBenchmarks.map((b) => (
              <OMetric key={`x-${b.key}`} label={`초과성과 (vs ${b.name})`}
                       value={`${signPct(b.excessPctPoint)}%p`}
                       color={tone(b.excessPctPoint)} sub={`펀드 − ${b.name}`} />
            ))}
          </>
        ) : (
          <>
            <OMetric
              label={`같은 기간 ${benchName}`}
              value={benchOk ? pct(bench!.latest!.benchmarkReturnPct) : "준비 중"}
              color={benchOk ? tone(bench!.latest!.benchmarkReturnPct) : undefined}
              sub={benchOk ? `${fmtDate(bench!.baseDate)} = 0%` : undefined}
            />
            <OMetric
              label="초과성과"
              value={benchOk ? `${signPct(bench!.latest!.excessReturnPctPoint)}%p` : "준비 중"}
              color={benchOk ? tone(bench!.latest!.excessReturnPctPoint) : undefined}
              sub={benchOk ? `펀드 − ${benchName}` : undefined}
            />
          </>
        )}
        <OMetric label="총자산" value={krw(summary.totalAsset)} sub="가상 운용자금" />
      </div>
    </section>
  );
}

// ② 현재 보유 / 최근 매수 / 최근 매도 — 그래프 다음 핵심 영역.
//    큰 테이블을 상단에 두지 않는다(요약 리스트 + 접힘 상세).
export function MagicHoldingsAndTrades({ history }: { history: Rec }) {
  const summary = parseMagicOfficialSummary(history);
  const holdings = parseMagicOfficialPortfolio(history).holdings;
  const days = parseMagicOfficialTradeDays(history);
  const latest = days[0];
  // 최근 매도 = 실제로 매도가 있었던 가장 최근 거래일. 없으면 거짓 placeholder 대신 사실을 쓴다.
  const lastSellDay = days.find((d) => d.sells.length > 0) ?? null;
  const topHoldings = [...holdings].sort((a, b) => (b.marketValue ?? 0) - (a.marketValue ?? 0));

  const card: React.CSSProperties = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "12px 13px", minWidth: 0 };
  const h3: React.CSSProperties = { fontSize: 13, fontWeight: 900, color: "#0f172a", margin: "0 0 8px" };
  const line: React.CSSProperties = { display: "flex", justifyContent: "space-between", gap: 8, fontSize: 12.5 };
  const nameCell: React.CSSProperties = { fontWeight: 800, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };

  return (
    <section style={{ background: "#fff", border: "1px solid #e2e8f0", borderTop: `3px solid ${ACCENT.primary}`, borderRadius: 14, padding: 16, minWidth: 0 }}>
      <div style={{ fontSize: 15, fontWeight: 900, color: "#0f172a", marginBottom: 3 }}>무엇을 보유하고, 무엇을 사고팔았나</div>
      <p style={{ margin: "0 0 12px", fontSize: 12, color: "#94a3b8" }}>
        기준일 {fmtDate(summary?.dataDate ?? null)} · 모든 수량은 모의장부 기준입니다.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(238px, 1fr))", gap: 10 }}>
        {/* 현재 보유 */}
        <div style={card}>
          <div style={h3}>현재 보유</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 24, fontWeight: 900, color: ACCENT.primary }}>{holdings.length}</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#64748b" }}>개 종목</span>
            <span style={{ fontSize: 11.5, color: "#94a3b8", fontWeight: 700 }}>· 누적 {summary?.openItemLotCount ?? 0} lot</span>
          </div>
          {topHoldings.length ? (
            <>
              <div style={{ display: "grid", gap: 5 }}>
                {topHoldings.slice(0, 5).map((h) => (
                  <div key={h.code} style={line}>
                    <span style={nameCell}>{h.name}</span>
                    <span style={{ flexShrink: 0, fontWeight: 800, color: h.returnRate !== null ? tone(h.returnRate) : "#64748b" }}>
                      {h.returnRate !== null ? pct(h.returnRate) : "-"}
                    </span>
                  </div>
                ))}
              </div>
              {topHoldings.length > 5 ? (
                <details style={{ marginTop: 8 }}>
                  <summary style={{ cursor: "pointer", fontSize: 11.5, fontWeight: 800, color: ACCENT.text }}>
                    나머지 {topHoldings.length - 5}종목 보기
                  </summary>
                  <div style={{ display: "grid", gap: 5, marginTop: 7 }}>
                    {topHoldings.slice(5).map((h) => (
                      <div key={h.code} style={line}>
                        <span style={{ ...nameCell, fontWeight: 700, color: "#334155" }}>{h.name}</span>
                        <span style={{ flexShrink: 0, fontWeight: 800, color: h.returnRate !== null ? tone(h.returnRate) : "#64748b" }}>
                          {h.returnRate !== null ? pct(h.returnRate) : "-"}
                        </span>
                      </div>
                    ))}
                  </div>
                </details>
              ) : null}
            </>
          ) : (
            <div style={{ fontSize: 12.5, color: "#94a3b8" }}>보유 종목 없음</div>
          )}
        </div>

        {/* 최근 매수 */}
        <div style={card}>
          <div style={h3}>최근 매수</div>
          {latest && latest.buys.length ? (
            <>
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 8 }}>
                {fmtDate(latest.date)} · {latest.buys.length} lot 매수
              </div>
              <div style={{ display: "grid", gap: 5 }}>
                {latest.buys.slice(0, 5).map((b) => (
                  <div key={b.tradeId || b.lotId} style={line}>
                    <span style={nameCell}>{b.name}</span>
                    <span style={{ flexShrink: 0, fontWeight: 700, color: "#64748b" }}>{b.rank !== null ? `${b.rank}위` : "-"}</span>
                  </div>
                ))}
              </div>
              {latest.buys.length > 5 ? (
                <div style={{ fontSize: 11.5, color: "#94a3b8", fontWeight: 700, marginTop: 7 }}>
                  외 {latest.buys.length - 5}종목 — 아래 매수 근거에서 전체 확인
                </div>
              ) : null}
            </>
          ) : (
            <div style={{ fontSize: 12.5, color: "#94a3b8" }}>최근 매수 없음</div>
          )}
        </div>

        {/* 최근 매도 */}
        <div style={card}>
          <div style={h3}>최근 매도</div>
          {lastSellDay ? (
            <>
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700, marginBottom: 8 }}>
                {fmtDate(lastSellDay.date)} · {lastSellDay.sells.length} lot 매도
              </div>
              <div style={{ display: "grid", gap: 5 }}>
                {lastSellDay.sells.slice(0, 5).map((s) => (
                  <div key={s.tradeId || s.lotId} style={line}>
                    <span style={nameCell}>{s.name}</span>
                    <span style={{ flexShrink: 0, fontWeight: 800, color: s.realizedReturn !== null ? tone(s.realizedReturn) : "#64748b" }}>
                      {s.realizedReturn !== null ? pct(s.realizedReturn) : "-"}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#334155" }}>최근 매도 없음</div>
              <div style={{ fontSize: 11.5, color: "#94a3b8", lineHeight: 1.55, marginTop: 6 }}>
                각 lot은 50실거래일을 채운 뒤 매도됩니다. 첫 매도 예정일이 아직 오지 않았습니다.
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

// ③ 운영 규칙 — 20~30초 안에 이해되게 짧게.
//    LEGACY_50D 를 '마법공식 원전 그 자체'나 '검증된 우월전략'으로 표현하지 않는다.
export function MagicHowItWorks() {
  const item: React.CSSProperties = { display: "flex", gap: 9, alignItems: "flex-start", fontSize: 12.5, color: "#334155", lineHeight: 1.55 };
  const dot: React.CSSProperties = { flexShrink: 0, width: 20, height: 20, borderRadius: 99, background: ACCENT.soft, border: `1px solid ${ACCENT.border}`, color: ACCENT.text, fontSize: 11, fontWeight: 900, display: "inline-flex", alignItems: "center", justifyContent: "center", marginTop: 1 };

  const steps = [
    "Magic Formula 계열 순위(싼 순위 + 잘버는 순위)로 종목을 고릅니다.",
    "실제 거래일마다 상위 10종목을 1 lot씩 가상매수합니다.",
    "매수는 lot 단위로 쌓입니다. 사람이 종목을 임의로 고르지 않습니다.",
    "각 lot은 50실거래일 동안 보유합니다.",
    "50실거래일이 지나면 가장 오래된 lot부터 순서대로(FIFO) 매도하고 재투자합니다.",
    "실제 주문은 내지 않습니다. 전부 가상 기록입니다.",
  ];

  return (
    <section style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 16, minWidth: 0 }}>
      <div style={{ fontSize: 15, fontWeight: 900, color: "#0f172a", marginBottom: 3 }}>어떻게 운영하나?</div>
      <p style={{ margin: "0 0 12px", fontSize: 12, color: "#94a3b8" }}>
        정해진 규칙만 반복합니다. 감이나 뉴스로 종목을 바꾸지 않습니다.
      </p>
      <div style={{ display: "grid", gap: 8 }}>
        {steps.map((s, i) => (
          <div key={i} style={item}>
            <span style={dot}>{i + 1}</span>
            <span>{s}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12, border: "1px dashed #e2e8f0", background: "#f8fafc", borderRadius: 10, padding: "10px 12px", fontSize: 11.5, color: "#64748b", lineHeight: 1.6 }}>
        이 운용 규칙(50실거래일 보유·FIFO 교체)은 와바바가 현재 <b>공개적으로 진행 중인 실험</b>입니다.
        조엘 그린블라트 원전의 규칙과 동일하지 않으며, 장기간 검증된 우월 전략이라고 주장하지 않습니다.
        결과는 이 페이지에서 매 거래일 그대로 공개됩니다.
      </div>
    </section>
  );
}

// ④ 운영 기록 검증 — 사람이 읽는 최신성 + 안전 지표 + 상세면 링크(존재하는 route 만).
export function MagicVerificationPanel({ history }: { history: Rec }) {
  const summary = parseMagicOfficialSummary(history);
  const days = parseMagicOfficialTradeDays(history);
  const bench = parseMagicOfficialBenchmark(history);
  const chartDays = days.filter((d) => d.totalAsset !== null);
  const chartLatest = chartDays.length ? chartDays[0].date : null;
  const tradeLatest = days.length ? days[0].date : null;
  const benchLatest = bench?.latest?.date ?? null;
  // 최신성 정합 — 장부 / 거래기록 / 그래프가 같은 날이어야 정상이다(stale 을 정상처럼 표시하지 않는다).
  const fresh = Boolean(summary?.dataDate && tradeLatest === summary.dataDate && chartLatest === summary.dataDate);

  const row: React.CSSProperties = { display: "flex", justifyContent: "space-between", gap: 10, padding: "7px 0", borderTop: "1px solid #eef2f7", fontSize: 12.5 };
  const first: React.CSSProperties = { ...row, borderTop: "none" };
  const lbl: React.CSSProperties = { color: "#64748b", fontWeight: 700 };
  const val: React.CSSProperties = { fontWeight: 800, color: "#0f172a", whiteSpace: "nowrap" };
  const link: React.CSSProperties = { fontSize: 12, fontWeight: 800, borderRadius: 9, padding: "7px 11px", textDecoration: "none" };

  return (
    <section style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 16, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 3 }}>
        <span style={{ fontSize: 15, fontWeight: 900, color: "#0f172a" }}>운영 기록 검증</span>
        <span
          style={{
            fontSize: 11, fontWeight: 800, borderRadius: 99, padding: "2px 8px",
            color: fresh ? ACCENT.text : "#92400e",
            background: fresh ? ACCENT.soft : "#fffbeb",
            border: `1px solid ${fresh ? ACCENT.border : "#fde68a"}`,
          }}
        >
          {fresh ? "장부·거래기록·그래프 모두 최신" : "최신성 확인 필요"}
        </span>
      </div>
      <p style={{ margin: "0 0 10px", fontSize: 12, color: "#94a3b8" }}>
        기록이 실제로 매 거래일 갱신되는지, 실제 주문이 없는지 직접 확인할 수 있습니다.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(228px, 1fr))", gap: "0 18px" }}>
        <div>
          <div style={first}><span style={lbl}>장부 최신일</span><span style={val}>{fmtDate(summary?.dataDate ?? null)}</span></div>
          <div style={row}><span style={lbl}>거래기록 최신일</span><span style={val}>{fmtDate(tradeLatest)}</span></div>
          <div style={row}><span style={lbl}>그래프 최신일</span><span style={val}>{fmtDate(chartLatest)}</span></div>
          <div style={row}><span style={lbl}>벤치마크 최신일</span><span style={val}>{fmtDate(benchLatest)}</span></div>
        </div>
        <div>
          <div style={first}><span style={lbl}>자동반영 회차</span><span style={val}>{summary?.officialSequence ?? "-"}회</span></div>
          <div style={row}><span style={lbl}>누적 매수 / 매도 lot</span><span style={val}>{summary?.totalBuyCount ?? 0} / {summary?.totalSellCount ?? 0}</span></div>
          <div style={row}><span style={lbl}>실제 주문</span><span style={{ ...val, color: ACCENT.primary }}>0건</span></div>
          <div style={row}><span style={lbl}>증권사 API 호출</span><span style={{ ...val, color: ACCENT.primary }}>0건</span></div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
        <a href="/performance" style={{ ...link, color: ACCENT.text, background: ACCENT.soft, border: `1px solid ${ACCENT.border}` }}>
          성과분석 · 전체 거래기록 →
        </a>
        <a href="/magic-formula/rankings" style={{ ...link, color: "#475569", background: "#f8fafc", border: "1px solid #e2e8f0" }}>
          순위검증 →
        </a>
      </div>

      <div style={{ fontSize: 11.5, color: "#94a3b8", lineHeight: 1.6, marginTop: 12 }}>
        가상운용(paper) 기록입니다. 실제 매매 주문을 내지 않으며 투자 권유가 아닙니다.
        과거 성과가 미래 수익을 보장하지 않습니다.
      </div>
    </section>
  );
}
