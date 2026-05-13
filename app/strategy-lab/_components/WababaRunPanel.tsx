"use client";

import { useState } from "react";

type RunState = "idle" | "running" | "success" | "error";

export function WababaRunPanel() {
  const [state, setState] = useState<RunState>("idle");
  const [message, setMessage] = useState("");

  async function handleRun() {
    if (state === "running") return;

    setState("running");
    setMessage("계산 중...");

    try {
      const response = await fetch("/api/wababa/run", {
        method: "POST",
      });

      const data = (await response.json()) as {
        ok?: boolean;
        message?: string;
      };

      if (!response.ok || !data.ok) {
        setState("error");
        setMessage(data.message || "실패");
        return;
      }

      setState("success");
      setMessage("완료");

      window.setTimeout(() => {
        window.location.reload();
      }, 700);
    } catch {
      setState("error");
      setMessage("실패");
    }
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap",
      }}
    >
      <button
        type="button"
        onClick={handleRun}
        disabled={state === "running"}
        style={{
          border: 0,
          borderRadius: 10,
          background: state === "running" ? "#94a3b8" : "#020617",
          color: "#ffffff",
          fontWeight: 950,
          padding: "9px 12px",
          cursor: state === "running" ? "wait" : "pointer",
          whiteSpace: "nowrap",
        }}
      >
        {state === "running" ? "계산 중" : "오늘 데이터 생성"}
      </button>

      <button
        type="button"
        onClick={handleRun}
        disabled={state === "running"}
        style={{
          border: 0,
          borderRadius: 10,
          background: state === "running" ? "#93c5fd" : "#2563eb",
          color: "#ffffff",
          fontWeight: 950,
          padding: "9px 12px",
          cursor: state === "running" ? "wait" : "pointer",
          whiteSpace: "nowrap",
        }}
      >
        {state === "running" ? "재계산 중" : "와바바 재계산"}
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
