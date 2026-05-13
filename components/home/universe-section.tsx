import { rankedUniverse, recommendationCutoffRank } from "@/data/mock-dashboard";
import { formatNumber } from "@/components/home/home-format";
import HomeSectionCard from "@/components/home/home-section-card";

function renderRankChange(rankChange: number | null) {
  if (rankChange === null) {
    return "NEW";
  }

  if (rankChange > 0) {
    return `▲ ${rankChange}`;
  }

  if (rankChange < 0) {
    return `▼ ${Math.abs(rankChange)}`;
  }

  return "-";
}

export default function UniverseSection() {
  return (
    <HomeSectionCard eyebrow="전체 유니버스" title="Universe Ranking">
      <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-300">
        상위 {recommendationCutoffRank}위까지만 추천 영역에 노출된다.
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-3">
          <thead>
            <tr className="text-left text-sm text-slate-400">
              <th className="px-4">구분</th>
              <th className="px-4">오늘 순위</th>
              <th className="px-4">전일 순위</th>
              <th className="px-4">변동</th>
              <th className="px-4">종목명</th>
              <th className="px-4">코드</th>
              <th className="px-4">총점</th>
              <th className="px-4">기본점수</th>
              <th className="px-4">뉴스</th>
              <th className="px-4">현재가</th>
            </tr>
          </thead>

          <tbody>
            {rankedUniverse.map((item) => {
              const isRecommended = item.rank <= recommendationCutoffRank;

              return (
                <tr key={item.code} className="rounded-2xl bg-slate-950/70">
                  <td className="rounded-l-2xl px-4 py-4">
                    <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs">
                      {isRecommended ? "추천" : "비추천"}
                    </span>
                  </td>
                  <td className="px-4 py-4">#{item.rank}</td>
                  <td className="px-4 py-4">
                    {item.previousRank ? `#${item.previousRank}` : "-"}
                  </td>
                  <td className="px-4 py-4">{renderRankChange(item.rankChange)}</td>
                  <td className="px-4 py-4 font-medium">{item.name}</td>
                  <td className="px-4 py-4 text-slate-300">{item.code}</td>
                  <td className="px-4 py-4">{item.totalScore}</td>
                  <td className="px-4 py-4">{item.baseScore}</td>
                  <td className="px-4 py-4">
                    {item.scoreBreakdown.newsSignal >= 0 ? "+" : ""}
                    {item.scoreBreakdown.newsSignal}
                  </td>
                  <td className="rounded-r-2xl px-4 py-4">
                    {formatNumber(item.currentPrice)}원
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </HomeSectionCard>
  );
}