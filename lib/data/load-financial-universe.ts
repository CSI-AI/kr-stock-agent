import {
  getFinancialUniverse,
  type FinancialUniverseLoadResult,
} from "@/lib/data/financial-universe-provider";

export async function loadFinancialUniverse(): Promise<FinancialUniverseLoadResult> {
  const result = await getFinancialUniverse();

  return {
    items: Array.isArray(result.items) ? result.items : [],
    source: result.source,
    requestedSource: result.requestedSource,
    usedFallback: result.usedFallback,
    message: result.message,
  };
}