import {
  previousScoringUniverse,
  todayScoringUniverse,
} from "@/data/mock-scoring";
import { calculateRankingDiff } from "@/utils/scoring/ranking-engine";

const rankingDiff = calculateRankingDiff({
  todayUniverse: todayScoringUniverse,
  previousUniverse: previousScoringUniverse,
  topN: 5,
});

export const rankedTopRecommendations = rankingDiff.todayTop;
export const rankedUniverse = rankingDiff.todayUniverseRanked;
export const recommendationCutoffRank = rankingDiff.recommendationCutoffRank;

export const newEntries: string[] = rankingDiff.newEntries.map((item) => item.name);

export const removedEntries: string[] = rankingDiff.removedEntries.map(
  (item) => item.name
);

export const sellWatchList: Array<{
  name: string;
  decision: string;
  hypothesis: string;
  reason: string[];
  risk: string[];
  reversalCondition: string;
}> = [
  {
    name: "2차전지예시주",
    decision: "일부매도",
    hypothesis: "밸류에이션 부담이 커져 일부 차익 실현이 유효할 수 있다.",
    reason: ["단기 급등 이후 기대치 선반영", "실적 대비 밸류 부담 확대"],
    risk: ["추가 상승 가능성", "섹터 수급 재유입 가능성"],
    reversalCondition: "실적 상향이 본격화되면 매도 가설 약화",
  },
];