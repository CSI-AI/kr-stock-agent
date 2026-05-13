"use client";

import { useState } from "react";

type Props = {
  code: string;
};

async function postJson(url: string, code: string) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code }),
  });

  const result = await response.json().catch(() => null);

  if (!response.ok || !result?.ok) {
    throw new Error(result?.message || "요청 실패");
  }
}

export default function ReviewedActions({ code }: Props) {
  const [isWorking, setIsWorking] = useState(false);

  async function restore() {
    if (isWorking) return;
    setIsWorking(true);

    try {
      await postJson("/api/reviewed/restore", code);
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert("다시 보기 처리에 실패했습니다.");
      setIsWorking(false);
    }
  }

  async function remove() {
    if (isWorking) return;
    setIsWorking(true);

    try {
      await postJson("/api/reviewed/delete", code);
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert("삭제에 실패했습니다.");
      setIsWorking(false);
    }
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 6,
        marginTop: 7,
      }}
    >
      <button
        type="button"
        disabled={isWorking}
        onClick={restore}
        style={{
          minHeight: 28,
          borderRadius: 8,
          background: isWorking ? "#e5e7eb" : "#e0f2fe",
          color: isWorking ? "#94a3b8" : "#0369a1",
          border: "1px solid #7dd3fc",
          fontSize: 12,
          fontWeight: 950,
          cursor: isWorking ? "not-allowed" : "pointer",
        }}
      >
        다시 보기
      </button>

      <button
        type="button"
        disabled={isWorking}
        onClick={remove}
        style={{
          minHeight: 28,
          borderRadius: 8,
          background: isWorking ? "#e5e7eb" : "#fee2e2",
          color: isWorking ? "#94a3b8" : "#b91c1c",
          border: "1px solid #f87171",
          fontSize: 12,
          fontWeight: 950,
          cursor: isWorking ? "not-allowed" : "pointer",
        }}
      >
        삭제
      </button>
    </div>
  );
}
