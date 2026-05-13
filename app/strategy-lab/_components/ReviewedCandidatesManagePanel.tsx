"use client";

type ReviewedCandidate = {
  code: string;
  name: string;
  type: string;
  reviewedAt: string;
};

type ReviewedCandidatesManagePanelProps = {
  reviewedItems: ReviewedCandidate[];
};

function formatDate(value: string): string {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const year = String(date.getFullYear()).slice(2);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");

  return `${year}.${month}.${day} ${hour}:${minute}`;
}

async function requestJson(url: string, options: RequestInit) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    cache: "no-store",
  });

  const result = await response.json().catch(() => null);

  if (!response.ok || result?.ok === false) {
    throw new Error(result?.message || "요청 처리에 실패했습니다.");
  }

  return result;
}

async function rerunAndGoHome() {
  await requestJson("/api/wababa/run", {
    method: "POST",
    body: JSON.stringify({
      reason: "reviewed-candidates-reset",
    }),
  });

  window.location.href = `/strategy-lab?refresh=${Date.now()}`;
}

export function ReviewedCandidatesManagePanel({
  reviewedItems,
}: ReviewedCandidatesManagePanelProps) {
  async function handleRestoreOne(item: ReviewedCandidate) {
    if (!item.code) {
      return;
    }

    const ok = window.confirm(`${item.name || item.code} 종목을 다시 후보에 포함할까요?`);

    if (!ok) {
      return;
    }

    await requestJson("/api/wababa/reviewed-candidates", {
      method: "DELETE",
      body: JSON.stringify({
        code: item.code,
      }),
    });

    await rerunAndGoHome();
  }

  async function handleResetAll() {
    const ok = window.confirm("넘긴 종목 전체를 초기화하고 다시 계산할까요?");

    if (!ok) {
      return;
    }

    await requestJson("/api/wababa/reviewed-candidates", {
      method: "DELETE",
      body: JSON.stringify({}),
    });

    await rerunAndGoHome();
  }

  return (
    <section
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 20,
        padding: 16,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          marginBottom: 14,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 950,
              color: "#020617",
            }}
          >
            넘긴 종목 {reviewedItems.length}
          </div>
          <div
            style={{
              marginTop: 4,
              fontSize: 13,
              fontWeight: 800,
              color: "#64748b",
            }}
          >
            다시 후보에 포함하거나 전체 초기화할 수 있습니다.
          </div>
        </div>

        <button
          type="button"
          onClick={handleResetAll}
          disabled={reviewedItems.length === 0}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 36,
            borderRadius: 12,
            border: "1px solid #fecaca",
            background: reviewedItems.length === 0 ? "#f8fafc" : "#fef2f2",
            color: reviewedItems.length === 0 ? "#94a3b8" : "#b91c1c",
            padding: "0 12px",
            fontSize: 13,
            fontWeight: 950,
            cursor: reviewedItems.length === 0 ? "not-allowed" : "pointer",
            whiteSpace: "nowrap",
          }}
        >
          전체 초기화
        </button>
      </div>

      {reviewedItems.length === 0 ? (
        <div
          style={{
            borderRadius: 16,
            background: "#f8fafc",
            border: "1px dashed #cbd5e1",
            padding: 20,
            color: "#64748b",
            fontSize: 15,
            fontWeight: 850,
            textAlign: "center",
          }}
        >
          아직 넘긴 종목이 없습니다.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {reviewedItems.map((item) => (
            <div
              key={`${item.code}-${item.reviewedAt}`}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: 10,
                alignItems: "center",
                borderRadius: 14,
                border: "1px solid #e5e7eb",
                background: "#f8fafc",
                padding: "10px 12px",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 950,
                    color: "#020617",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.name || item.code}
                  <span
                    style={{
                      marginLeft: 8,
                      color: "#64748b",
                      fontSize: 13,
                      fontWeight: 850,
                    }}
                  >
                    {item.code}
                  </span>
                </div>

                <div
                  style={{
                    marginTop: 4,
                    color: "#64748b",
                    fontSize: 12,
                    fontWeight: 800,
                  }}
                >
                  {item.type || "-"} · {formatDate(item.reviewedAt)}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleRestoreOne(item)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: 34,
                  borderRadius: 12,
                  border: "1px solid #bfdbfe",
                  background: "#eff6ff",
                  color: "#1d4ed8",
                  padding: "0 10px",
                  fontSize: 13,
                  fontWeight: 950,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                다시 보기
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
