"use client";

import { useState } from "react";

type ReviewCandidateButtonProps = {
  code: string;
  name: string;
  type: string;
};

export function ReviewCandidateButton({
  code,
  name,
  type,
}: ReviewCandidateButtonProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [message, setMessage] = useState("");

  async function postJson(url: string, body?: unknown) {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });

    const result = await response.json().catch(() => null);

    if (!response.ok || result?.ok === false) {
      throw new Error(result?.message || "요청 처리에 실패했습니다.");
    }

    return result;
  }

  async function handleClick() {
    if (!code || isRunning) {
      return;
    }

    sessionStorage.setItem("wababa_scroll_y", String(window.scrollY));

    setIsRunning(true);
    setMessage("저장중");

    try {
      await postJson("/api/wababa/review-candidate", {
        code,
        name,
        type,
      });

      setMessage("재계산중");

      await postJson("/api/wababa/run", {
        reason: "review-candidate",
        code,
        type,
      });

      setMessage("넘김");

      window.location.assign(`/strategy-lab?refresh=${Date.now()}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "넘기기 저장에 실패했습니다.";
      setMessage(errorMessage);
      setIsRunning(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!code || isRunning}
      title={name ? `${name} 검토 완료 후 넘기기` : "검토 완료 후 넘기기"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 34,
        minWidth: 58,
        borderRadius: 12,
        background: "#f8fafc",
        color: "#475569",
        border: "1px solid #e2e8f0",
        fontSize: 13,
        fontWeight: 950,
        cursor: !code || isRunning ? "not-allowed" : "pointer",
        opacity: !code || isRunning ? 0.65 : 1,
        padding: "0 10px",
        whiteSpace: "nowrap",
        wordBreak: "keep-all",
      }}
    >
      {message || "넘기기"}
    </button>
  );
}
