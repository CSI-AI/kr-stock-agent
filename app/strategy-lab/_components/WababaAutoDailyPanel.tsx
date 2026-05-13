"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const AUTO_ENABLED_KEY = "wababa-auto-trading-enabled";
const POLL_INTERVAL_MS = 10 * 60 * 1000;

type AutoDailyResponse = {
  ok?: boolean;
  ran?: boolean;
  status?: string;
  today?: string;
  generatedAt?: string;
  message?: string;

  fundTradeStatus?: string;
  fundTradeMessage?: string;
  fundOrderCount?: number;
  positionCount?: number;
  totalAssetAmount?: number;
  totalProfitRate?: number | null;

  aiFundTradeStatus?: string;
  aiFundTradeMessage?: string;
  aiFundOrderCount?: number;
  aiPositionCount?: number;
  aiTotalAssetAmount?: number;
  aiTotalProfitRate?: number | null;

  totalOrderCount?: number;
  state?: {
    lastRunDate?: string;
    lastRunAt?: string;
    lastStatus?: string;
    lastMessage?: string;
  };
};

function getStatusLabel(data: AutoDailyResponse | null, loading: boolean) {
  if (loading && !data) return "자동 확인 중";
  const status = data?.status || data?.state?.lastStatus || "READY";
  if (status === "DONE") return "두 펀드 자동운용 완료";
  if (status === "ALREADY_DONE") return "오늘 이미 실행됨";
  if (status === "WAIT_RUN_TIME") return "8:40 이후 자동 실행";
  if (status === "MARKET_CLOSED") return "휴장일 자동 대기";
  if (status === "ERROR") return "자동 실행 오류";
  return "자동운용 대기";
}

function getStatusColor(data: AutoDailyResponse | null) {
  const status = data?.status || data?.state?.lastStatus || "READY";
  if (status === "ERROR") return { border: "#fecaca", text: "#dc2626", bg: "#fef2f2" };
  if (status === "DONE" || status === "ALREADY_DONE") return { border: "#bbf7d0", text: "#047857", bg: "#f0fdf4" };
  return { border: "#bfdbfe", text: "#1d4ed8", bg: "#eff6ff" };
}

function formatRate(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) return "-";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function getErrorDetail(data: AutoDailyResponse | null): string {
  if (data?.status !== "ERROR") return "";
  const raw = data.message || data.state?.lastMessage || "";
  return raw.length > 300 ? raw.slice(-300) : raw;
}

function getSubText(data: AutoDailyResponse | null, autoEnabled: boolean) {
  if (!data) {
    return autoEnabled
      ? "서버와 이 화면이 켜져 있으면 10분마다 확인. 개장일 08:40 이후 두 펀드가 하루 1회 자동운용."
      : "자동운용 OFF 상태입니다. 수동 실행 또는 자동운용 ON 후 화면을 유지하세요.";
  }

  const wababaOrderText = typeof data.fundOrderCount === "number" ? `와바바 ${data.fundOrderCount}건` : "와바바 확인";
  const aiOrderText = typeof data.aiFundOrderCount === "number" ? `AI ${data.aiFundOrderCount}건` : "AI 확인";
  const wababaPositionText = typeof data.positionCount === "number" ? `와바바 보유 ${data.positionCount}` : "";
  const aiPositionText = typeof data.aiPositionCount === "number" ? `AI 보유 ${data.aiPositionCount}` : "";
  const timeText = data.state?.lastRunAt || data.generatedAt || data.today || "";
  const message = data.message || data.state?.lastMessage || data.fundTradeMessage || data.aiFundTradeMessage || "";

  return [
    "두 펀드 모두 하루 1회 자동운용",
    wababaOrderText,
    aiOrderText,
    wababaPositionText,
    aiPositionText,
    message,
    timeText,
  ]
    .filter(Boolean)
    .join(" · ");
}

function FundMiniStatus({
  title,
  orders,
  positions,
  rate,
}: {
  title: string;
  orders?: number;
  positions?: number;
  rate?: number | null;
}) {
  return (
    <div
      style={{
        border: "1px solid rgba(148, 163, 184, 0.35)",
        background: "rgba(255,255,255,0.72)",
        borderRadius: 12,
        padding: "7px 9px",
        minWidth: 118,
      }}
    >
      <div style={{ color: "#0f172a", fontSize: 11, fontWeight: 950 }}>{title}</div>
      <div style={{ marginTop: 3, color: "#64748b", fontSize: 10, fontWeight: 850 }}>
        체결 {orders ?? 0} · 보유 {positions ?? 0}
      </div>
      <div style={{ marginTop: 2, color: "#334155", fontSize: 10, fontWeight: 900 }}>
        수익률 {formatRate(rate)}
      </div>
    </div>
  );
}

export function WababaAutoDailyPanel() {
  const [data, setData] = useState<AutoDailyResponse | null>(null);
  const [loading, setLoading] = useState(false);
  // 기본값 OFF — 사용자가 명시적으로 ON을 눌러야 자동 실행됨
  const [autoEnabled, setAutoEnabled] = useState(false);
  const [priceRefreshMsg, setPriceRefreshMsg] = useState("");

  const timerRef = useRef<number | null>(null);
  // 동시 중복 호출 방지용 ref
  const busyRef = useRef(false);

  // checkAutoDaily 최신 버전을 항상 ref로 유지 (useEffect 내 stale closure 방지)
  const checkAutoDailyRef = useRef<(() => Promise<void>) | null>(null);

  // localStorage에서 ON/OFF 초기값 읽기
  useEffect(() => {
    try {
      if (localStorage.getItem(AUTO_ENABLED_KEY) === "true") {
        setAutoEnabled(true);
      }
    } catch {
      // localStorage 접근 불가 환경 무시
    }
  }, []);

  async function callPriceRefresh() {
    setPriceRefreshMsg("현재가 갱신 중…");
    try {
      const res = await fetch("/api/portfolio-price-refresh", { method: "POST" });
      const result = (await res.json()) as { ok?: boolean };
      setPriceRefreshMsg(result.ok ? "현재가 갱신 완료" : "현재가 갱신 실패");
    } catch {
      setPriceRefreshMsg("현재가 갱신 오류");
    }
    window.setTimeout(() => setPriceRefreshMsg(""), 5000);
  }

  async function checkAutoDaily() {
    if (busyRef.current) return;
    busyRef.current = true;
    setLoading(true);
    try {
      const response = await fetch("/api/wababa-auto-daily", {
        method: "GET",
        cache: "no-store",
      });
      const json = (await response.json()) as AutoDailyResponse;
      setData(json);
      // GET이 실제 스크립트를 실행했으면(ran=true) 가격 갱신도 연이어 실행
      if (json.ran === true) {
        void callPriceRefresh();
      }
    } catch (error) {
      setData({
        ok: false,
        status: "ERROR",
        message: error instanceof Error ? error.message : "자동 확인 실패",
      });
    } finally {
      busyRef.current = false;
      setLoading(false);
    }
  }

  // ref를 항상 최신 함수로 갱신
  checkAutoDailyRef.current = checkAutoDaily;

  // autoEnabled 변경 시 폴링 interval 재설정
  useEffect(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (autoEnabled) {
      // ON → 즉시 한 번 확인 후 10분마다 반복
      void checkAutoDailyRef.current?.();
      timerRef.current = window.setInterval(
        () => void checkAutoDailyRef.current?.(),
        POLL_INTERVAL_MS,
      );
    }
    // OFF → interval 없음 (자동 실행 안 함)

    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [autoEnabled]);

  function toggleAutoEnabled() {
    const next = !autoEnabled;
    try {
      localStorage.setItem(AUTO_ENABLED_KEY, String(next));
    } catch {
      // localStorage 접근 불가 환경 무시
    }
    setAutoEnabled(next);
    if (!next) setPriceRefreshMsg("");
  }

  // 수동 실행 — ON/OFF 무관하게 항상 POST 직접 호출
  async function handleManualRun() {
    if (busyRef.current) return;
    busyRef.current = true;
    setLoading(true);
    try {
      const response = await fetch("/api/wababa-auto-daily", {
        method: "POST",
        cache: "no-store",
      });
      const json = (await response.json()) as AutoDailyResponse;
      setData(json);
      if (json.ok && json.ran) {
        void callPriceRefresh();
      }
    } catch (error) {
      setData({
        ok: false,
        status: "ERROR",
        message: error instanceof Error ? error.message : "수동 실행 실패",
      });
    } finally {
      busyRef.current = false;
      setLoading(false);
    }
  }

  const color = useMemo(() => getStatusColor(data), [data]);
  const label = getStatusLabel(data, loading);
  const subText = getSubText(data, autoEnabled);
  const alreadyDone =
    data?.status === "ALREADY_DONE" ||
    (data?.state?.lastStatus === "DONE" && data?.state?.lastRunDate === data?.today);
  const isError = data?.status === "ERROR";
  const errorDetail = getErrorDetail(data);

  return (
    <section
      style={{
        marginBottom: 10,
        background: color.bg,
        border: `1px solid ${color.border}`,
        borderRadius: 16,
        padding: "10px 12px",
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) auto",
        gap: 10,
        alignItems: "start",
      }}
    >
      {/* 왼쪽: 상태 영역 */}
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <div style={{ color: color.text, fontSize: 13, fontWeight: 950 }}>
            서버 자동 운용 · {label}
          </div>
          {/* 자동운용 ON/OFF 뱃지 */}
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              borderRadius: 999,
              padding: "2px 9px",
              fontSize: 11,
              fontWeight: 950,
              background: autoEnabled ? "#dcfce7" : "#f1f5f9",
              color: autoEnabled ? "#166534" : "#64748b",
              border: `1px solid ${autoEnabled ? "#86efac" : "#cbd5e1"}`,
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ fontSize: 9 }}>{autoEnabled ? "●" : "○"}</span>
            {autoEnabled ? "자동운용 ON" : "자동운용 OFF"}
          </span>
        </div>

        <div style={{ marginTop: 3, color: "#64748b", fontSize: 11, fontWeight: 850, lineHeight: 1.45 }}>
          {subText}
        </div>

        {isError && errorDetail && (
          <div
            style={{
              marginTop: 6,
              padding: "5px 8px",
              background: "#fff1f2",
              border: "1px solid #fecaca",
              borderRadius: 8,
              color: "#b91c1c",
              fontSize: 10,
              fontWeight: 700,
              lineHeight: 1.5,
              wordBreak: "break-all",
              overflowWrap: "break-word",
            }}
          >
            실행 실패 · {errorDetail}
          </div>
        )}

        {priceRefreshMsg && (
          <div style={{ marginTop: 4, color: "#0d9488", fontSize: 11, fontWeight: 900 }}>
            ↻ {priceRefreshMsg}
          </div>
        )}

        <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <FundMiniStatus
            title="와바바펀드"
            orders={data?.fundOrderCount}
            positions={data?.positionCount}
            rate={data?.totalProfitRate}
          />
          <FundMiniStatus
            title="와바바AI펀드"
            orders={data?.aiFundOrderCount}
            positions={data?.aiPositionCount}
            rate={data?.aiTotalProfitRate}
          />
        </div>
      </div>

      {/* 오른쪽: 버튼 영역 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
        {/* ON/OFF 토글 버튼 */}
        <button
          type="button"
          onClick={toggleAutoEnabled}
          style={{
            height: 32,
            borderRadius: 999,
            border: `1px solid ${autoEnabled ? "#86efac" : "#cbd5e1"}`,
            background: autoEnabled ? "#f0fdf4" : "#f8fafc",
            color: autoEnabled ? "#166534" : "#64748b",
            padding: "0 12px",
            fontSize: 12,
            fontWeight: 950,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {autoEnabled ? "● 자동운용 ON" : "○ 자동운용 OFF"}
        </button>

        {/* 수동 실행 버튼 — ON/OFF 무관하게 항상 사용 가능 */}
        <button
          type="button"
          onClick={handleManualRun}
          disabled={loading || alreadyDone}
          style={{
            height: 32,
            borderRadius: 999,
            border: `1px solid ${color.border}`,
            background: alreadyDone ? "#f8fafc" : "#ffffff",
            color: alreadyDone ? "#94a3b8" : color.text,
            padding: "0 12px",
            fontSize: 12,
            fontWeight: 950,
            cursor: loading ? "wait" : alreadyDone ? "not-allowed" : "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {loading ? "확인 중" : alreadyDone ? "오늘 실행 완료" : "두 펀드 실행"}
        </button>
      </div>
    </section>
  );
}
