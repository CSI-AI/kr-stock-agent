"use client";

export default function ReviewedActions({ code }: { code: string }) {
  async function restore() {
    await fetch("/api/reviewed/restore", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
    location.reload();
  }

  async function remove() {
    await fetch("/api/reviewed/delete", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
    location.reload();
  }

  return (
    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
      <button
        onClick={restore}
        style={{
          flex: 1,
          background: "#e0f2fe",
          border: "1px solid #7dd3fc",
          borderRadius: 8,
          padding: "6px 0",
          fontWeight: 900,
          cursor: "pointer",
        }}
      >
        다시 보기
      </button>

      <button
        onClick={remove}
        style={{
          flex: 1,
          background: "#fee2e2",
          border: "1px solid #f87171",
          borderRadius: 8,
          padding: "6px 0",
          fontWeight: 900,
          cursor: "pointer",
        }}
      >
        삭제
      </button>
    </div>
  );
}