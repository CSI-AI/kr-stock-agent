// Phase 37-A12 — Portfolio Snapshot loader (read-only)
// data repo에 누적 저장된 portfolio-state-snapshots.json을 안전하게 읽는다.
// fs/throw 0 원칙. 결측·손상 시 null / [] 반환.
// ranking/scoring/자동매매 무영향. server-side only.

import fs from "fs";
import path from "path";

const DATA_ROOT_CANDIDATES = [
  "C:\\work\\kr-stock-agent-data-new",
  // 보조 후보 — 환경에 따라 보강 가능
];

const SNAPSHOT_RELATIVE_PATH = path.join("data", "portfolio-state-snapshots.json");

export type PortfolioSnapshot = {
  date: string;
  fundKey: string;
  cashRatio: number; // 0~100
  longHoldRatio: number; // 0~100
  cycleRatio: number; // 0~100
  valuationRatio: number; // 0~100
  healthLevel: string;
  portfolioState: string;
  actionMode: string;
  topTags: string[];
  holdingCount: number;
};

export type DriftSnapshotInput = {
  date?: string;
  longHoldRatio?: number; // 0~1
  cycleRatio?: number; // 0~1
  valuationStretchedRatio?: number; // 0~1
  cashRatePercent?: number; // 0~100 유지
  totalPositions?: number;
};

function isSnapshotShape(value: unknown): value is PortfolioSnapshot {
  if (!value || typeof value !== "object") return false;
  const o = value as Record<string, unknown>;
  return (
    typeof o.date === "string" &&
    typeof o.fundKey === "string" &&
    typeof o.cashRatio === "number" &&
    typeof o.longHoldRatio === "number" &&
    typeof o.cycleRatio === "number" &&
    typeof o.valuationRatio === "number"
  );
}

function tryReadJson(filePath: string): unknown {
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * snapshots 파일을 읽어 배열 반환. 결측/손상 시 빈 배열.
 * throw 금지.
 */
export function loadPortfolioSnapshots(): PortfolioSnapshot[] {
  for (const root of DATA_ROOT_CANDIDATES) {
    const candidate = path.join(root, SNAPSHOT_RELATIVE_PATH);
    const parsed = tryReadJson(candidate);
    if (!parsed || typeof parsed !== "object") continue;

    const wrapper = parsed as Record<string, unknown>;
    const list = wrapper.snapshots;
    if (!Array.isArray(list)) continue;

    return list.filter(isSnapshotShape);
  }
  return [];
}

/**
 * 가장 최근(latest) snapshot — fundKey 일치 + date desc 1번째.
 */
export function getLatestPortfolioSnapshot(
  fundKey: string,
  snapshots?: PortfolioSnapshot[]
): PortfolioSnapshot | null {
  const list = snapshots ?? loadPortfolioSnapshots();
  const matched = list.filter((s) => s.fundKey === fundKey);
  if (matched.length === 0) return null;
  matched.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return matched[0];
}

/**
 * previous snapshot 조회. currentDate가 있으면 그보다 이전 중 가장 가까운 것.
 * currentDate가 없으면 가장 최근의 두 번째 snapshot.
 * 일치 없으면 null.
 */
export function getPreviousPortfolioSnapshot(params: {
  fundKey: string;
  currentDate?: string;
  snapshots?: PortfolioSnapshot[];
}): PortfolioSnapshot | null {
  const { fundKey, currentDate, snapshots } = params;
  const list = snapshots ?? loadPortfolioSnapshots();
  const matched = list.filter((s) => s.fundKey === fundKey);
  if (matched.length === 0) return null;

  // 오름차순 정렬
  matched.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  if (currentDate) {
    const prior = matched.filter((s) => s.date < currentDate);
    return prior.length > 0 ? prior[prior.length - 1] : null;
  }

  if (matched.length < 2) return null;
  return matched[matched.length - 2];
}

/**
 * snapshot (0~100) → drift input (0~1, cashPercent는 0~100 유지) 변환.
 * 결측 필드는 그대로 undefined 전달.
 */
export function snapshotToDriftSnapshot(
  s: PortfolioSnapshot | null | undefined
): DriftSnapshotInput | null {
  if (!s || typeof s !== "object") return null;
  return {
    date: s.date,
    longHoldRatio:
      typeof s.longHoldRatio === "number" ? s.longHoldRatio / 100 : undefined,
    cycleRatio:
      typeof s.cycleRatio === "number" ? s.cycleRatio / 100 : undefined,
    valuationStretchedRatio:
      typeof s.valuationRatio === "number"
        ? s.valuationRatio / 100
        : undefined,
    cashRatePercent:
      typeof s.cashRatio === "number" ? s.cashRatio : undefined,
    totalPositions:
      typeof s.holdingCount === "number" ? s.holdingCount : undefined,
  };
}

/**
 * 디버그 출력용 — snapshot 파일 위치/개수/펀드별 카운트 요약.
 */
export function describeSnapshotState(): {
  resolvedPath: string | null;
  total: number;
  byFund: Record<string, number>;
} {
  for (const root of DATA_ROOT_CANDIDATES) {
    const candidate = path.join(root, SNAPSHOT_RELATIVE_PATH);
    if (!fs.existsSync(candidate)) continue;
    const all = loadPortfolioSnapshots();
    const byFund: Record<string, number> = {};
    for (const s of all) {
      byFund[s.fundKey] = (byFund[s.fundKey] || 0) + 1;
    }
    return { resolvedPath: candidate, total: all.length, byFund };
  }
  return { resolvedPath: null, total: 0, byFund: {} };
}
