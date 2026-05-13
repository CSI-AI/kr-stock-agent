import fs from "fs/promises";
import path from "path";

import type { StockFinancialMetrics } from "@/types/financial";

const GITHUB_REAL_DATA_URL =
  "https://raw.githubusercontent.com/dunbar-link/kr-stock-agent-data/main/financial-universe-real.json";

const LOCAL_REAL_DATA_FILE_PATHS = [
  path.resolve(
    process.cwd(),
    "..",
    "kr-stock-agent-data-new",
    "financial-universe-real.json"
  ),
  path.resolve(
    process.cwd(),
    "..",
    "kr-stock-agent-data",
    "financial-universe-real.json"
  ),
];

export type RealRawItem = {
  symbol?: string;
  corpName?: string;
  marketName?: string;
  industryName?: string;
  price?: number | string | null;
  marketCap?: number | string | null;
  PER?: number | string | null;
  PBR?: number | string | null;
  ROE?: number | string | null;
  salesGrowth?: number | string | null;
  opIncomeGrowth?: number | string | null;
  debtRatio?: number | string | null;
  divYield?: number | string | null;
  opMargin?: number | string | null;
  netMargin?: number | string | null;
  salesCagr3Y?: number | string | null;
  EPSGrowth3Y?: number | string | null;
  updatedAt?: string;
  newsMomentumScore?: number | string | null;
  hypothesis?: string | null;
  evidence?: string[] | null;
  risk?: string[] | null;
};

export type RealUniverseResponse = {
  data?: RealRawItem[];
  meta?: {
    provider?: string;
    version?: number;
    count?: number;
    baseDate?: string;
    updatedAt?: string;
    pythonVersion?: string;
    pandasVersion?: string;
    mode?: string;
    enrichedCount?: number;
    upstreamSampleCount?: number;
    krxLoginConfigured?: boolean;
  };
};

export type LoadedRealUniverse = {
  payload: RealUniverseResponse;
  sourceType: "local-file" | "github-raw";
  localFilePath: string;
};

export type StrategyLabRealItem = {
  raw: RealRawItem;
  metrics: StockFinancialMetrics;
};

export type LoadedStrategyLabRealItems = LoadedRealUniverse & {
  items: StrategyLabRealItem[];
};

function toNullableNumber(
  value: number | string | null | undefined
): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const cleaned = String(value).trim().replaceAll(",", "");

  if (cleaned === "") {
    return null;
  }

  const numeric = Number(cleaned);
  return Number.isFinite(numeric) ? numeric : null;
}

function toRequiredNumber(
  value: number | string | null | undefined
): number {
  return toNullableNumber(value) ?? 0;
}

function toMarketType(value: string | undefined): "KOSPI" | "KOSDAQ" {
  return value === "KOSDAQ" ? "KOSDAQ" : "KOSPI";
}

export function mapRealRawItemToMetrics(
  item: RealRawItem
): StockFinancialMetrics {
  return {
    code: item.symbol ?? "",
    name: item.corpName ?? "",
    market: toMarketType(item.marketName),
    industry: item.industryName ?? "",

    currentPrice: toRequiredNumber(item.price),
    marketCapBillionKrw: toNullableNumber(item.marketCap),

    per: toNullableNumber(item.PER),
    pbr: toNullableNumber(item.PBR),
    roe: toNullableNumber(item.ROE),

    revenueGrowth: toNullableNumber(item.salesGrowth),
    operatingIncomeGrowth: toNullableNumber(item.opIncomeGrowth),

    debtRatio: toNullableNumber(item.debtRatio),
    dividendYield: toNullableNumber(item.divYield),

    operatingMargin: toNullableNumber(item.opMargin),
    netMargin: toNullableNumber(item.netMargin),

    revenueCagr3Y: toNullableNumber(item.salesCagr3Y),
    epsGrowth3Y: toNullableNumber(item.EPSGrowth3Y),

    latestUpdatedAt: item.updatedAt,
  };
}

async function tryReadRealUniverseFromPath(
  filePath: string
): Promise<RealUniverseResponse | null> {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    const parsed = JSON.parse(raw) as RealUniverseResponse;

    if (!parsed || !Array.isArray(parsed.data)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

async function readLocalRealUniverse(): Promise<{
  payload: RealUniverseResponse;
  filePath: string;
} | null> {
  for (const filePath of LOCAL_REAL_DATA_FILE_PATHS) {
    const parsed = await tryReadRealUniverseFromPath(filePath);

    if (parsed) {
      return {
        payload: parsed,
        filePath,
      };
    }
  }

  return null;
}

async function readRemoteRealUniverse(): Promise<RealUniverseResponse> {
  const response = await fetch(GITHUB_REAL_DATA_URL, {
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `외부 데이터 fetch 실패: ${response.status} ${response.statusText}`
    );
  }

  return (await response.json()) as RealUniverseResponse;
}

export async function loadStrategyLabRealUniverse(): Promise<LoadedRealUniverse> {
  const localLoaded = await readLocalRealUniverse();

  if (localLoaded) {
    return {
      payload: localLoaded.payload,
      sourceType: "local-file",
      localFilePath: localLoaded.filePath,
    };
  }

  const remotePayload = await readRemoteRealUniverse();

  return {
    payload: remotePayload,
    sourceType: "github-raw",
    localFilePath: LOCAL_REAL_DATA_FILE_PATHS[0],
  };
}

export async function loadStrategyLabRealItems(): Promise<LoadedStrategyLabRealItems> {
  const loaded = await loadStrategyLabRealUniverse();
  const rawItems = Array.isArray(loaded.payload.data) ? loaded.payload.data : [];

  const items = rawItems
    .map((raw) => ({
      raw,
      metrics: mapRealRawItemToMetrics(raw),
    }))
    .filter((item) => item.metrics.code && item.metrics.name);

  return {
    ...loaded,
    items,
  };
}