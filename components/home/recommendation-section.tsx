import { rankedTopRecommendations } from "@/data/mock-dashboard";
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

export default function RecommendationSection() {
  const scoredStocks = rankedTopRecommendations;

  return (
    <HomeSectionCard eyebrow="오늘의 상위 추천" title="Top 추천 종목">
      <div className="flex items-center justify-end">
        <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
          추천 상위 {scoredStocks.length}종목
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {scoredStocks.map((stock) => (
          <article
            key={stock.code}
            className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs text-slate-400">{stock.code}</p>
                <h3 className="mt-1 text-xl font-semibold">
                  #{stock.rank} {stock.name}
                </h3>
              </div>

              <div className="flex flex-wrap gap-2">
                <div className="rounded-2xl border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-sm font-semibold text-sky-300">
                  총점 {stock.totalScore}
                </div>

                <div className="rounded-2xl border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-sm font-semibold text-violet-300">
                  변동 {renderRankChange(stock.rankChange)}
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-4">
              <div className="rounded-2xl bg-slate-900 p-3">
                <p className="text-xs text-slate-400">오늘 순위</p>
                <p className="mt-1 font-semibold">#{stock.rank}</p>
              </div>

              <div className="rounded-2xl bg-slate-900 p-3">
                <p className="text-xs text-slate-400">전일 순위</p>
                <p className="mt-1 font-semibold">
                  {stock.previousRank ? `#${stock.previousRank}` : "-"}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-900 p-3">
                <p className="text-xs text-slate-400">기본점수</p>
                <p className="mt-1 font-semibold">{stock.baseScore}</p>
              </div>

              <div className="rounded-2xl bg-slate-900 p-3">
                <p className="text-xs text-slate-400">뉴스시그널</p>
                <p className="mt-1 font-semibold">
                  {stock.scoreBreakdown.newsSignal >= 0 ? "+" : ""}
                  {stock.scoreBreakdown.newsSignal}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-900 p-3">
                <p className="text-xs text-slate-400">현재가</p>
                <p className="mt-1 font-semibold">
                  {formatNumber(stock.currentPrice)}원
                </p>
              </div>

              <div className="rounded-2xl bg-slate-900 p-3">
                <p className="text-xs text-slate-400">목표가</p>
                <p className="mt-1 font-semibold">
                  {formatNumber(stock.targetPrice)}원
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-900 p-3">
                <p className="text-xs text-slate-400">매수 구간</p>
                <p className="mt-1 font-semibold">
                  {formatNumber(stock.buyRange.min)} ~ {formatNumber(stock.buyRange.max)}원
                </p>
              </div>

              <div className="rounded-2xl bg-slate-900 p-3">
                <p className="text-xs text-slate-400">신규 진입 여부</p>
                <p className="mt-1 font-semibold">
                  {stock.isNewEntry ? "신규 진입" : "기존 유지"}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl bg-slate-900 p-4">
              <p className="text-sm font-semibold text-emerald-300">가설</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {stock.hypothesis}
              </p>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl bg-slate-900 p-3">
                <p className="text-xs text-slate-400">재무</p>
                <p className="mt-1 font-semibold">{stock.scoreBreakdown.financialQuality}</p>
              </div>
              <div className="rounded-2xl bg-slate-900 p-3">
                <p className="text-xs text-slate-400">성장</p>
                <p className="mt-1 font-semibold">{stock.scoreBreakdown.growth}</p>
              </div>
              <div className="rounded-2xl bg-slate-900 p-3">
                <p className="text-xs text-slate-400">밸류</p>
                <p className="mt-1 font-semibold">{stock.scoreBreakdown.value}</p>
              </div>
              <div className="rounded-2xl bg-slate-900 p-3">
                <p className="text-xs text-slate-400">산업</p>
                <p className="mt-1 font-semibold">{stock.scoreBreakdown.industryFit}</p>
              </div>
              <div className="rounded-2xl bg-slate-900 p-3">
                <p className="text-xs text-slate-400">시장지위</p>
                <p className="mt-1 font-semibold">{stock.scoreBreakdown.marketPosition}</p>
              </div>
              <div className="rounded-2xl bg-slate-900 p-3">
                <p className="text-xs text-slate-400">반복성</p>
                <p className="mt-1 font-semibold">{stock.scoreBreakdown.repeatability}</p>
              </div>
              <div className="rounded-2xl bg-slate-900 p-3">
                <p className="text-xs text-slate-400">주주환원</p>
                <p className="mt-1 font-semibold">{stock.scoreBreakdown.shareholderReturn}</p>
              </div>
              <div className="rounded-2xl bg-slate-900 p-3">
                <p className="text-xs text-slate-400">IR</p>
                <p className="mt-1 font-semibold">{stock.scoreBreakdown.irConsistency}</p>
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-slate-900 p-4">
                <p className="text-sm font-semibold text-slate-100">근거</p>
                <ul className="mt-2 space-y-2 text-sm text-slate-300">
                  {stock.reason.map((reason: string) => (
                    <li key={reason}>- {reason}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl bg-slate-900 p-4">
                <p className="text-sm font-semibold text-amber-300">리스크</p>
                <ul className="mt-2 space-y-2 text-sm text-slate-300">
                  {stock.risk.map((risk: string) => (
                    <li key={risk}>- {risk}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4">
              <p className="text-sm font-semibold text-rose-300">반증 조건</p>
              <p className="mt-2 text-sm leading-6 text-slate-200">
                {stock.reversalCondition}
              </p>
            </div>
          </article>
        ))}
      </div>
    </HomeSectionCard>
  );
}