import { promises as fs } from "fs";
import path from "path";
import {
  loadRemoteJsonFinancialUniverseFromUrl,
  type RemoteUniverseLoadSuccess,
} from "@/lib/data/real-financial-universe-source";

export type RefreshRealFinancialUniverseResult = {
  filePath: string;
  upstreamUrl: string;
  provider: string;
  writtenCount: number;
  rawCount: number;
  normalizedCount: number;
  skippedCount: number;
  updatedAt: string;
};

const SNAPSHOT_FILE_PATH = path.join(
  process.cwd(),
  "data",
  "financial-universe-real.json"
);

function resolveBaseUrl(): string {
  const explicitBaseUrl =
    process.env.APP_BASE_URL ?? process.env.NEXT_PUBLIC_APP_BASE_URL;

  if (explicitBaseUrl && explicitBaseUrl.trim().length > 0) {
    return explicitBaseUrl.trim().replace(/\/$/, "");
  }

  return "http://localhost:3001";
}

function resolveUpstreamUrl(): string {
  const githubRawUrl = process.env.FINANCIAL_UNIVERSE_RAW_URL;

  if (githubRawUrl && githubRawUrl.trim().length > 0) {
    return githubRawUrl.trim();
  }

  const explicitUpstreamUrl =
    process.env.FINANCIAL_UNIVERSE_REAL_UPSTREAM_JSON_URL;

  if (explicitUpstreamUrl && explicitUpstreamUrl.trim().length > 0) {
    return explicitUpstreamUrl.trim();
  }

  return `${resolveBaseUrl()}/api/financial-universe-upstream-sample`;
}

function buildSnapshotPayload(loadResult: RemoteUniverseLoadSuccess) {
  const updatedAt = new Date().toISOString();

  const items = loadResult.items.map((item) => ({
    stockCode: item.code,
    companyName: item.name,
    marketType: item.market,
    sector: item.industry,
    closePrice: item.currentPrice,
    marketCapBillionKrw: item.marketCapBillionKrw ?? null,
    per: item.per ?? null,
    pbr: item.pbr ?? null,
    roe: item.roe ?? null,
    salesGrowth: item.revenueGrowth ?? null,
    opIncomeGrowth: item.operatingIncomeGrowth ?? null,
    debtRatio: item.debtRatio ?? null,
    divYield: item.dividendYield ?? null,
    opMargin: item.operatingMargin ?? null,
    netMargin: item.netMargin ?? null,
    salesCagr3Y: item.revenueCagr3Y ?? null,
    EPSGrowth3Y: item.epsGrowth3Y ?? null,
    updatedAt: item.latestUpdatedAt ?? null,
  }));

  return {
    payload: {
      items,
      meta: {
        provider: "refresh-real-financial-universe-snapshot",
        version: 2,
        count: items.length,
        updatedAt,
        upstreamUrl: loadResult.sourceUrl,
        rawCount: loadResult.rawCount,
        normalizedCount: loadResult.normalizedCount,
        skippedCount: loadResult.skippedCount,
      },
    },
    updatedAt,
  };
}

export async function refreshRealFinancialUniverseSnapshot(): Promise<RefreshRealFinancialUniverseResult> {
  const upstreamUrl = resolveUpstreamUrl();
  const loadResult = await loadRemoteJsonFinancialUniverseFromUrl(upstreamUrl);
  const { payload, updatedAt } = buildSnapshotPayload(loadResult);

  await fs.mkdir(path.dirname(SNAPSHOT_FILE_PATH), { recursive: true });
  await fs.writeFile(
    SNAPSHOT_FILE_PATH,
    JSON.stringify(payload, null, 2),
    "utf-8"
  );

  return {
    filePath: SNAPSHOT_FILE_PATH,
    upstreamUrl,
    provider: "refresh-real-financial-universe-snapshot",
    writtenCount: payload.items.length,
    rawCount: loadResult.rawCount,
    normalizedCount: loadResult.normalizedCount,
    skippedCount: loadResult.skippedCount,
    updatedAt,
  };
}