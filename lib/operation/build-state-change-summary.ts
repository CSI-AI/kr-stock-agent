import type { DailyReport } from "./build-daily-report";

export type StateChangeItemWithReason = {
  code: string;
  name: string;
  reason: string;
};

export type StateChangeSummary = {
  newTop10: StateChangeItemWithReason[];
  droppedTop10: StateChangeItemWithReason[];
  newBuySignals: StateChangeItemWithReason[];
  removedBuySignals: StateChangeItemWithReason[];
  newSellCandidates: StateChangeItemWithReason[];
  resolvedSellCandidates: StateChangeItemWithReason[];
};

function toMap(list: { code: string; name: string }[]) {
  const map = new Map<string, string>();

  list.forEach((item) => {
    map.set(item.code, item.name);
  });

  return map;
}

function findRecommendationReason(code: string, report: DailyReport): string {
  const item = report.todayRecommendations.find(
    (recommendation) => recommendation.code === code
  );

  if (!item) {
    return "이전 판단 근거 데이터가 없습니다.";
  }

  if (item.decisionReason?.trim()) {
    return item.decisionReason;
  }

  if (item.hypothesis?.trim()) {
    return item.hypothesis;
  }

  return "판단 근거가 충분히 기록되지 않았습니다.";
}

export function buildStateChangeSummary(
  prev: DailyReport | null,
  current: DailyReport
): StateChangeSummary {
  if (!prev) {
    return {
      newTop10: current.todayRecommendations.map((item) => ({
        code: item.code,
        name: item.name,
        reason: item.decisionReason,
      })),
      droppedTop10: [],
      newBuySignals: current.todayRecommendations
        .filter((item) => item.decision === "BUY")
        .map((item) => ({
          code: item.code,
          name: item.name,
          reason: item.decisionReason,
        })),
      removedBuySignals: [],
      newSellCandidates: current.sellCandidates.map((item) => ({
        code: item.code,
        name: item.name,
        reason: "새로운 매도 후보로 진입했습니다.",
      })),
      resolvedSellCandidates: [],
    };
  }

  const prevTop = toMap(prev.todayRecommendations);
  const currTop = toMap(current.todayRecommendations);

  const newTop10 = current.todayRecommendations
    .filter((item) => !prevTop.has(item.code))
    .map((item) => ({
      code: item.code,
      name: item.name,
      reason: item.decisionReason,
    }));

  const droppedTop10 = prev.todayRecommendations
    .filter((item) => !currTop.has(item.code))
    .map((item) => ({
      code: item.code,
      name: item.name,
      reason: findRecommendationReason(item.code, prev),
    }));

  const prevBuy = toMap(
    prev.todayRecommendations.filter((item) => item.decision === "BUY")
  );
  const currBuy = toMap(
    current.todayRecommendations.filter((item) => item.decision === "BUY")
  );

  const newBuySignals = current.todayRecommendations
    .filter((item) => item.decision === "BUY" && !prevBuy.has(item.code))
    .map((item) => ({
      code: item.code,
      name: item.name,
      reason: item.decisionReason,
    }));

  const removedBuySignals = prev.todayRecommendations
    .filter((item) => item.decision === "BUY" && !currBuy.has(item.code))
    .map((item) => ({
      code: item.code,
      name: item.name,
      reason: findRecommendationReason(item.code, prev),
    }));

  const prevSell = toMap(prev.sellCandidates);
  const currSell = toMap(current.sellCandidates);

  const newSellCandidates = current.sellCandidates
    .filter((item) => !prevSell.has(item.code))
    .map((item) => ({
      code: item.code,
      name: item.name,
      reason: "새로운 매도 후보로 진입했습니다.",
    }));

  const resolvedSellCandidates = prev.sellCandidates
    .filter((item) => !currSell.has(item.code))
    .map((item) => ({
      code: item.code,
      name: item.name,
      reason: "매도 후보에서 해제되었습니다.",
    }));

  return {
    newTop10,
    droppedTop10,
    newBuySignals,
    removedBuySignals,
    newSellCandidates,
    resolvedSellCandidates,
  };
}