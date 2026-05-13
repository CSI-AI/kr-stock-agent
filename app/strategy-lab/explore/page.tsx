import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

type Candidate = Record<string, unknown>;

type ExplorePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readRecommendationHistory() {
  try {
    const historyPath = path.join(
      "C:\\work\\kr-stock-agent-data-new",
      "recommendation-history.json"
    );

    return JSON.parse(fs.readFileSync(historyPath, "utf-8"));
  } catch {
    return null;
  }
}

function getObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function getCandidatesByType(history: unknown, type: string): Candidate[] {
  const source = getObject(history);
  const groups = getObject(source.exploreGroups);
  const groupItems = groups[type];

  if (Array.isArray(groupItems)) {
    return groupItems.filter((item): item is Candidate => !!item && typeof item === "object");
  }

  const items = source.exploreCandidates;
  if (!Array.isArray(items)) return [];

  return items
    .filter((item): item is Candidate => !!item && typeof item === "object")
    .filter((item) => getString(item.exploreGroup) === type);
}

function getString(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}


function formatShortDateText(value: unknown): string {
  const text = getString(value);
  if (!text) return "-";

  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}:\d{2})(?::\d{2})?)?/);

  if (!match) return text.replaceAll("-", ".");

  const year = match[1].slice(2);
  const date = `${year}.${match[2]}.${match[3]}`;
  const time = match[4] ? ` ${match[4]}` : "";

  return `${date}${time}`;
}

function getNumber(value: unknown): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return numeric;
}

function formatNumber(value: unknown, digits = 0): string {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "-";

  return new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: digits,
  }).format(numeric);
}

function formatPercent(value: unknown): string {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "-";
  return `${formatNumber(numeric, 1)}%`;
}

function getName(item: Candidate): string {
  return (
    getString(item.name) ||
    getString(item.corpName) ||
    getString(item.stockName) ||
    getString(item.companyName) ||
    "-"
  );
}

function getCode(item: Candidate): string {
  return getString(item.code) || getString(item.symbol) || getString(item.stockCode);
}

function getType(item: Candidate): string {
  return getString(item.exploreType) || getString(item.wababaType) || "기타";
}

function getTypeColor(type: string) {
  if (type === "종합") {
    return {
      bg: "#eff6ff",
      color: "#2563eb",
      border: "#bfdbfe",
    };
  }

  if (type === "안정형") {
    return {
      bg: "#ecfdf5",
      color: "#047857",
      border: "#bbf7d0",
    };
  }

  if (type === "성장형") {
    return {
      bg: "#faf5ff",
      color: "#7e22ce",
      border: "#d8b4fe",
    };
  }

  if (type === "기회형") {
    return {
      bg: "#fff7ed",
      color: "#ea580c",
      border: "#fed7aa",
    };
  }

  return {
    bg: "#eff6ff",
    color: "#2563eb",
    border: "#bfdbfe",
  };
}

function getStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

function getSummary(item: Candidate): string {
  return (
    getString(item.companySummary) ||
    getString(item.investmentThesis) ||
    getString(item.rankReason) ||
    "실적과 밸류에이션을 함께 통과한 탐색 후보"
  );
}

function getReason(item: Candidate): string {
  const points = getStringArray(item.investmentPoints);
  if (points.length > 0) return points[0];

  return getString(item.evidenceSummary) || "재무 기준과 가격 매력을 함께 확인한 후보";
}

function makeHref(type: string, page: number): string {
  const params = new URLSearchParams();
  params.set("type", type);
  params.set("page", String(page));
  return `/strategy-lab/explore?${params.toString()}`;
}

function normalizeType(value: string): string {
  if (["total", "stable", "growth", "opportunity"].includes(value)) return value;
  return "total";
}

function typeLabel(type: string): string {
  if (type === "stable") return "안정형";
  if (type === "growth") return "성장형";
  if (type === "opportunity") return "기회형";
  return "종합";
}

function pageTitle(type: string): string {
  if (type === "stable") return "안정형 BEST 비슷한 종목 10개";
  if (type === "growth") return "성장형 BEST 비슷한 종목 10개";
  if (type === "opportunity") return "기회형 BEST 비슷한 종목 10개";
  return "종합 BEST 비슷한 종목 10개";
}

function CandidateCard({ item }: { item: Candidate }) {
  const type = getType(item);
  const color = getTypeColor(type);

  return (
    <article
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 18,
        padding: 16,
        display: "grid",
        gridTemplateColumns: "1fr 250px",
        gap: 16,
        alignItems: "stretch",
      }}
    >
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 10,
          }}
        >
          <span
            style={{
              borderRadius: 999,
              background: color.bg,
              color: color.color,
              border: `1px solid ${color.border}`,
              padding: "5px 9px",
              fontSize: 12,
              fontWeight: 950,
            }}
          >
            {type}
          </span>

          {item.isMainPick ? (
            <span
              style={{
                borderRadius: 999,
                background: "#020617",
                color: "#ffffff",
                padding: "5px 9px",
                fontSize: 12,
                fontWeight: 950,
              }}
            >
              BEST 포함
            </span>
          ) : null}

          <span
            style={{
              color: "#64748b",
              fontSize: 12,
              fontWeight: 900,
            }}
          >
            #{formatNumber(item.rank)}
          </span>
        </div>

        <h2
          style={{
            margin: 0,
            color: "#020617",
            fontSize: 26,
            fontWeight: 950,
            lineHeight: 1.1,
          }}
        >
          {getName(item)}
          {getCode(item) ? (
            <span
              style={{
                color: "#64748b",
                fontSize: 15,
                fontWeight: 900,
                marginLeft: 8,
              }}
            >
              {getCode(item)}
            </span>
          ) : null}
        </h2>

        <p
          style={{
            margin: "12px 0 8px",
            color: "#111827",
            fontSize: 17,
            fontWeight: 950,
            lineHeight: 1.35,
          }}
        >
          {getSummary(item)}
        </p>

        <p
          style={{
            margin: 0,
            color: "#334155",
            fontSize: 14,
            fontWeight: 850,
            lineHeight: 1.45,
          }}
        >
          {getReason(item)}
        </p>
      </div>

      <div
        style={{
          background: "#f8fafc",
          border: "1px solid #e5e7eb",
          borderRadius: 14,
          padding: 12,
          display: "grid",
          gap: 8,
        }}
      >
        <Metric label="총점" value={formatNumber(item.score, 1)} />
        <Metric label="ROE" value={formatPercent(item.roe)} />
        <Metric label="PER" value={formatNumber(item.per, 1)} />
        <Metric label="PBR" value={formatNumber(item.pbr, 1)} />
      </div>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 10,
        padding: "7px 9px",
      }}
    >
      <span style={{ color: "#64748b", fontSize: 12, fontWeight: 900 }}>{label}</span>
      <span style={{ color: "#020617", fontSize: 16, fontWeight: 950 }}>{value}</span>
    </div>
  );
}

export default async function StrategyLabExplorePage({ searchParams }: ExplorePageProps) {
  const params = await searchParams;
  const currentType = normalizeType(
    typeof params?.type === "string" ? params.type : "all"
  );
  const rawPage = typeof params?.page === "string" ? Number(params.page) : 1;
  const currentPage = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;

  const history = readRecommendationHistory();
  const source = getObject(history);
  const filtered = getCandidatesByType(history, currentType);

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const pageItems = filtered.slice(startIndex, startIndex + pageSize);

  const filters = ["total", "stable", "growth", "opportunity"];

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#020617",
        padding: 16,
        fontFamily: "Arial, sans-serif",
        boxSizing: "border-box",
      }}
    >
      <section
        style={{
          background: "linear-gradient(135deg, #172554 0%, #020617 70%)",
          border: "1px solid #1e3a8a",
          borderRadius: 20,
          padding: 18,
          marginBottom: 14,
          display: "flex",
          justifyContent: "space-between",
          gap: 14,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <div>
          <a
            href="/strategy-lab"
            style={{
              color: "#93c5fd",
              fontSize: 13,
              fontWeight: 900,
              textDecoration: "none",
            }}
          >
            ← BEST 화면으로
          </a>

          <h1
            style={{
              color: "#ffffff",
              fontSize: 30,
              fontWeight: 950,
              margin: "8px 0 0",
              lineHeight: 1.1,
            }}
          >
            {pageTitle(currentType)}
          </h1>

          <p
            style={{
              color: "#cbd5e1",
              fontSize: 13,
              fontWeight: 800,
              margin: "8px 0 0",
            }}
          >
            기준일 {formatShortDateText(source.baseDate)} · 생성 {formatShortDateText(source.generatedAt)}
          </p>
        </div>

        <div
          style={{
            background: "#ffffff",
            borderRadius: 14,
            padding: "10px 12px",
            minWidth: 190,
          }}
        >
          <div style={{ color: "#64748b", fontSize: 12, fontWeight: 900 }}>
            현재 목록
          </div>
          <div style={{ color: "#020617", fontSize: 20, fontWeight: 950 }}>
            {typeLabel(currentType)} {formatNumber(filtered.length)}개
          </div>
        </div>
      </section>

      <section
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 14,
        }}
      >
        {filters.map((filter) => {
          const active = filter === currentType;

          return (
            <a
              key={filter}
              href={makeHref(filter, 1)}
              style={{
                borderRadius: 999,
                background: active ? "#2563eb" : "#ffffff",
                color: active ? "#ffffff" : "#1e293b",
                padding: "9px 13px",
                fontSize: 13,
                fontWeight: 950,
                textDecoration: "none",
              }}
            >
              {typeLabel(filter)}
            </a>
          );
        })}
      </section>

      <section
        style={{
          display: "grid",
          gap: 10,
        }}
      >
        {pageItems.length > 0 ? (
          pageItems.map((item) => (
            <CandidateCard key={`${getCode(item)}-${getString(item.exploreType)}`} item={item} />
          ))
        ) : (
          <div
            style={{
              background: "#ffffff",
              borderRadius: 18,
              padding: 24,
              color: "#64748b",
              fontSize: 16,
              fontWeight: 900,
            }}
          >
            표시할 후보가 없습니다. 먼저 오늘 데이터 생성을 실행해 주세요.
          </div>
        )}
      </section>

      <section
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 10,
          marginTop: 16,
        }}
      >
        <a
          href={makeHref(currentType, Math.max(1, safePage - 1))}
          style={{
            borderRadius: 12,
            background: safePage <= 1 ? "#334155" : "#ffffff",
            color: safePage <= 1 ? "#94a3b8" : "#020617",
            padding: "10px 14px",
            fontSize: 13,
            fontWeight: 950,
            textDecoration: "none",
            pointerEvents: safePage <= 1 ? "none" : "auto",
          }}
        >
          이전
        </a>

        <div
          style={{
            color: "#ffffff",
            fontSize: 14,
            fontWeight: 950,
          }}
        >
          {safePage} / {totalPages}
        </div>

        <a
          href={makeHref(currentType, Math.min(totalPages, safePage + 1))}
          style={{
            borderRadius: 12,
            background: safePage >= totalPages ? "#334155" : "#ffffff",
            color: safePage >= totalPages ? "#94a3b8" : "#020617",
            padding: "10px 14px",
            fontSize: 13,
            fontWeight: 950,
            textDecoration: "none",
            pointerEvents: safePage >= totalPages ? "none" : "auto",
          }}
        >
          다음
        </a>
      </section>
    </main>
  );
}
