import fs from "fs";
import path from "path";
import ReviewedActions from "./_components/ReviewedActions";

export const dynamic = "force-dynamic";

const DATA_ROOT_DIR = "C:\\work\\kr-stock-agent-data-new";
const REVIEWED_CANDIDATES_PATH = path.join(DATA_ROOT_DIR, "reviewed-candidates.json");
const RECOMMENDATION_HISTORY_PATH = path.join(DATA_ROOT_DIR, "recommendation-history.json");

type ReviewedItem = {
  code: string;
  name: string;
  type?: string;
  skippedAt?: string;
};

type AnyRecord = Record<string, unknown>;

function getString(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

function formatDate(value: unknown): string {
  const text = getString(value);
  if (!text) return "-";

  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}:\d{2}))?/);
  if (!match) return text.replaceAll("-", ".");

  return `${match[1].slice(2)}.${match[2]}.${match[3]}${match[4] ? ` ${match[4]}` : ""}`;
}

function readJson(filePath: string): AnyRecord {
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as AnyRecord;
    }
  } catch {}

  return {};
}

function getCode(item: AnyRecord): string {
  return (
    getString(item.code) ||
    getString(item.stockCode) ||
    getString(item.symbol) ||
    getString(item.ticker)
  );
}

function getName(item: AnyRecord): string {
  return (
    getString(item.name) ||
    getString(item.stockName) ||
    getString(item.companyName) ||
    getString(item.corpName) ||
    getCode(item) ||
    "-"
  );
}

function getItemsFromHistory(history: AnyRecord): AnyRecord[] {
  const result: AnyRecord[] = [];
  const keys = [
    "finalBestPick",
    "wababaPicks",
    "exploreCandidates",
    "buyCandidates",
    "holdCandidates",
    "sellCandidates",
    "newWababaPicks",
    "continuedWababaPicks",
    "removedWababaPicks",
  ];

  for (const key of keys) {
    const value = history[key];

    if (Array.isArray(value)) {
      for (const item of value) {
        if (item && typeof item === "object") result.push(item as AnyRecord);
      }
    } else if (value && typeof value === "object") {
      result.push(value as AnyRecord);
    }
  }

  const exploreGroups = history.exploreGroups;
  if (exploreGroups && typeof exploreGroups === "object" && !Array.isArray(exploreGroups)) {
    for (const value of Object.values(exploreGroups as AnyRecord)) {
      if (!Array.isArray(value)) continue;
      for (const item of value) {
        if (item && typeof item === "object") result.push(item as AnyRecord);
      }
    }
  }

  return result;
}

function readReviewedItems(): ReviewedItem[] {
  const reviewed = readJson(REVIEWED_CANDIDATES_PATH);
  const history = readJson(RECOMMENDATION_HISTORY_PATH);
  const historyItems = getItemsFromHistory(history);

  const historyMap = new Map<string, AnyRecord>();
  for (const item of historyItems) {
    const code = getCode(item);
    if (code && !historyMap.has(code)) historyMap.set(code, item);
  }

  const explicitItems = Array.isArray(reviewed.reviewedItems) ? reviewed.reviewedItems : [];
  const items: ReviewedItem[] = [];
  const used = new Set<string>();

  for (const item of explicitItems) {
    if (!item || typeof item !== "object") continue;
    const record = item as AnyRecord;
    const code = getCode(record);
    if (!code || used.has(code)) continue;

    const historyItem = historyMap.get(code);
    const nameFromRecord = getName(record);

    items.push({
      code,
      name: nameFromRecord !== code ? nameFromRecord : historyItem ? getName(historyItem) : nameFromRecord,
      type: getString(record.type) || getString(historyItem?.wababaType),
      skippedAt: getString(record.skippedAt),
    });
    used.add(code);
  }

  const reviewedCodes = Array.isArray(reviewed.reviewedCodes) ? reviewed.reviewedCodes : [];
  for (const value of reviewedCodes) {
    const code = typeof value === "string" ? value.trim() : "";
    if (!code || used.has(code)) continue;

    const historyItem = historyMap.get(code);
    items.push({
      code,
      name: historyItem ? getName(historyItem) : code,
      type: getString(historyItem?.wababaType),
      skippedAt: "",
    });
    used.add(code);
  }

  return items;
}

function getTypeLabel(type: unknown): string {
  const text = getString(type);
  if (text === "total" || text === "종합") return "종합";
  if (text === "stable" || text === "안정형") return "안정";
  if (text === "growth" || text === "성장형") return "성장";
  if (text === "opportunity" || text === "기회형") return "기회";
  return text || "-";
}

function getTypeColor(type: unknown) {
  const label = getTypeLabel(type);
  if (label === "안정") return { bg: "#ecfdf5", color: "#047857", border: "#86efac" };
  if (label === "성장") return { bg: "#faf5ff", color: "#7e22ce", border: "#d8b4fe" };
  if (label === "기회") return { bg: "#fff7ed", color: "#ea580c", border: "#fdba74" };
  return { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" };
}

export default function ReviewedCandidatesPage() {
  const items = readReviewedItems();

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#020617",
        padding: 12,
        fontFamily: "Arial, sans-serif",
        boxSizing: "border-box",
      }}
    >
      <style>{`
        .reviewed-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 8px;
        }

        @media (min-width: 1300px) {
          .reviewed-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }
        }

        @media (max-width: 720px) {
          .reviewed-header {
            align-items: flex-start !important;
            flex-direction: column !important;
          }

          .reviewed-header a {
            width: 100%;
          }
        }
      `}</style>

      <section
        className="reviewed-header"
        style={{
          background: "linear-gradient(135deg, #172554 0%, #020617 70%)",
          border: "1px solid #1e3a8a",
          borderRadius: 16,
          padding: "12px 14px",
          marginBottom: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              color: "#ffffff",
              fontSize: 24,
              fontWeight: 950,
              lineHeight: 1.15,
            }}
          >
            넘긴 종목
          </h1>
          <div
            style={{
              marginTop: 4,
              color: "#bfdbfe",
              fontSize: 12,
              fontWeight: 850,
            }}
          >
            제외 목록 {items.length}개
          </div>
        </div>

        <a
          href="/strategy-lab"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            height: 32,
            borderRadius: 10,
            background: "#ffffff",
            color: "#172554",
            border: "1px solid #bfdbfe",
            padding: "0 12px",
            fontSize: 12,
            fontWeight: 950,
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          추천 화면으로
        </a>
      </section>

      {items.length === 0 ? (
        <section
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            padding: 18,
            color: "#334155",
            fontSize: 14,
            fontWeight: 850,
          }}
        >
          아직 넘긴 종목이 없습니다.
        </section>
      ) : (
        <section className="reviewed-grid">
          {items.map((item) => {
            const typeStyle = getTypeColor(item.type);

            return (
              <article
                key={item.code}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 14,
                  padding: 10,
                  boxShadow: "0 8px 16px rgba(15, 23, 42, 0.09)",
                  minHeight: 0,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 8,
                    marginBottom: 7,
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        color: "#020617",
                        fontSize: 18,
                        fontWeight: 950,
                        lineHeight: 1.15,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={item.name}
                    >
                      {item.name}
                    </div>
                    <div
                      style={{
                        color: "#64748b",
                        fontSize: 12,
                        fontWeight: 850,
                        marginTop: 2,
                      }}
                    >
                      {item.code}
                    </div>
                  </div>

                  <span
                    style={{
                      borderRadius: 999,
                      background: typeStyle.bg,
                      color: typeStyle.color,
                      border: `1px solid ${typeStyle.border}`,
                      padding: "5px 8px",
                      fontSize: 11,
                      fontWeight: 950,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {getTypeLabel(item.type)}
                  </span>
                </div>

                <div
                  style={{
                    borderTop: "1px solid #e5e7eb",
                    paddingTop: 7,
                    color: "#475569",
                    fontSize: 12,
                    fontWeight: 850,
                    lineHeight: 1.2,
                  }}
                >
                  {formatDate(item.skippedAt)}
                </div>

                <ReviewedActions code={item.code} />
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
