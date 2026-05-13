"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type RefreshState = "idle" | "running" | "success" | "error";

export function PriceRefreshButton() {
  const router = useRouter();
  const [state, setState] = useState<RefreshState>("idle");
  const [message, setMessage] = useState("");

  async function handleRefresh() {
    if (state === "running") return;

    setState("running");
    setMessage("조회 중...");

    try {
      const response = await fetch("/api/portfolio-price-refresh", {
        method: "POST",
      });

      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        wababaTotalProfitRate?: number;
        aiTotalProfitRate?: number;
      };

      if (!response.ok || !data.ok) {
        setState("error");
        setMessage(data.error ?? "갱신 실패");
        return;
      }

      setState("success");
      setMessage("갱신 완료");
      router.refresh();

      window.setTimeout(() => {
        setState("idle");
        setMessage("");
      }, 3000);
    } catch {
      setState("error");
      setMessage("네트워크 오류");
    }
  }

  const isRunning = state === "running";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <button
        type="button"
        onClick={handleRefresh}
        disabled={isRunning}
        style={{
          border: 0,
          borderRadius: 10,
          background: isRunning ? "#94a3b8" : "#0d9488",
          color: "#ffffff",
          fontWeight: 950,
          padding: "9px 12px",
          cursor: isRunning ? "wait" : "pointer",
          whiteSpace: "nowrap",
        }}
      >
        {isRunning ? "조회 중…" : "현재가 새로고침"}
      </button>

      {message ? (
        <span
          style={{
            color:
              state === "success"
                ? "#047857"
                : state === "error"
                  ? "#b91c1c"
                  : "#475569",
            fontSize: 13,
            fontWeight: 900,
            whiteSpace: "nowrap",
          }}
        >
          {message}
        </span>
      ) : null}
    </div>
  );
}
