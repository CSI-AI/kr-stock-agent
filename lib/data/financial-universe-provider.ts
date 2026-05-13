import { MOCK_FINANCIAL_UNIVERSE } from "@/lib/mock/mock-financial-universe";
import { loadRemoteJsonFinancialUniverse } from "@/lib/data/real-financial-universe-source";
import type { StockFinancialMetrics } from "@/types/financial";

export type FinancialUniverseSource = "mock" | "real";

export type FinancialUniverseLoadResult = {
  items: StockFinancialMetrics[];
  source: FinancialUniverseSource;
  requestedSource: FinancialUniverseSource;
  usedFallback: boolean;
  message: string;
};

function normalizeSource(value: string | undefined): FinancialUniverseSource {
  if (value === "real") {
    return "real";
  }

  return "mock";
}

function resolveRequestedSource(): FinancialUniverseSource {
  return normalizeSource(
    process.env.FINANCIAL_UNIVERSE_SOURCE ??
      process.env.NEXT_PUBLIC_FINANCIAL_UNIVERSE_SOURCE
  );
}

async function loadMockUniverse(
  requestedSource: FinancialUniverseSource = "mock"
): Promise<FinancialUniverseLoadResult> {
  return {
    items: MOCK_FINANCIAL_UNIVERSE,
    source: "mock",
    requestedSource,
    usedFallback: requestedSource === "real",
    message:
      requestedSource === "real"
        ? "real 데이터 연결에 실패하여 mock 데이터로 fallback 했습니다."
        : "mock 데이터를 불러왔습니다.",
  };
}

function buildFallbackMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return "알 수 없는 이유로 real 데이터 연결에 실패했습니다.";
}

async function loadRealUniverseOrFallback(): Promise<FinancialUniverseLoadResult> {
  try {
    const realResult = await loadRemoteJsonFinancialUniverse();

    return {
      items: Array.isArray(realResult.items) ? realResult.items : [],
      source: "real",
      requestedSource: "real",
      usedFallback: false,
      message:
        `real 데이터 연결 성공 · URL: ${realResult.sourceUrl} · ` +
        `원본 ${realResult.rawCount}건 중 정규화 ${realResult.normalizedCount}건 ` +
        `(제외 ${realResult.skippedCount}건)`,
    };
  } catch (error) {
    const fallback = await loadMockUniverse("real");

    return {
      ...fallback,
      message:
        "real 데이터 연결에 실패하여 mock 데이터로 fallback 했습니다. " +
        buildFallbackMessage(error),
    };
  }
}

export async function getFinancialUniverse(): Promise<FinancialUniverseLoadResult> {
  const requestedSource = resolveRequestedSource();

  if (requestedSource === "real") {
    return loadRealUniverseOrFallback();
  }

  return loadMockUniverse("mock");
}