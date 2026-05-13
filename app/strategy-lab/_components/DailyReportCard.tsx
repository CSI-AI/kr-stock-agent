import type {
  DailyReport,
  DailyReportBridgeItem,
} from "@/lib/operation/build-daily-report";
import {
  formatCurrency,
  getGradeBadgeClass,
  getHoldingDecisionBadgeClass,
} from "../_utils/strategy-lab-display-utils";

type DailyReportCardProps = {
  dailyReport: DailyReport;
};

function renderBridgeList(
  title: string,
  description: string,
  items: DailyReportBridgeItem[],
  emptyMessage: string
) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-sm font-bold text-slate-900">{title}</div>
      <div className="mt-1 text-xs leading-5 text-slate-500">{description}</div>

      <div className="mt-3 space-y-3">
        {items.length > 0 ? (
          items.map((item) => (
            <div key={item.code} className="rounded-xl bg-white p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-slate-900">{item.name}</div>
                  <div className="mt-1 text-xs text-slate-500">{item.code}</div>
                </div>

                <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700">
                  {item.label}
                </span>
              </div>

              <div className="mt-2 text-sm text-slate-700">{item.detail}</div>
            </div>
          ))
        ) : (
          <div className="rounded-xl bg-white p-3 text-sm text-slate-500">
            {emptyMessage}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DailyReportCard({
  dailyReport,
}: DailyReportCardProps) {
  const finalDecision = dailyReport.finalDecisionSummary;

  return (
    <div className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Daily Report 검증</h2>
          <p className="mt-1 text-sm text-slate-500">
            엔진 결과를 실제 운용 판단 흐름으로 변환한 결과입니다.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            BUY {dailyReport.actionSummary.buy}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            HOLD {dailyReport.actionSummary.hold}
          </span>
          <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
            SELL {dailyReport.actionSummary.sell}
          </span>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-900 bg-slate-900 p-5 text-white">
        <div className="text-sm font-semibold text-slate-300">
          오늘 최종 판단 요약
        </div>

        <div className="mt-2 text-2xl font-bold">{finalDecision.stance}</div>

        <div className="mt-2 text-base leading-7 text-slate-100">
          {finalDecision.headline}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <div className="rounded-xl bg-slate-800 p-3">
            <div className="text-xs text-slate-400">핵심 초점</div>
            <div className="mt-1 text-sm font-semibold text-white">
              {finalDecision.primaryFocus}
            </div>
          </div>

          <div className="rounded-xl bg-slate-800 p-3">
            <div className="text-xs text-slate-400">현금 비중</div>
            <div className="mt-1 text-sm font-semibold text-white">
              {finalDecision.cashRatioPercent.toFixed(1)}%
            </div>
          </div>

          <div className="rounded-xl bg-slate-800 p-3">
            <div className="text-xs text-slate-400">추천 BUY</div>
            <div className="mt-1 text-sm font-semibold text-white">
              {finalDecision.recommendationBuyCount}건
            </div>
          </div>

          <div className="rounded-xl bg-slate-800 p-3">
            <div className="text-xs text-slate-400">긴급 매도</div>
            <div className="mt-1 text-sm font-semibold text-white">
              {finalDecision.urgentSellCount}건
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-slate-800 p-4">
          <div className="text-sm font-bold text-white">오늘 우선 실행</div>
          <div className="mt-3 space-y-2">
            {finalDecision.topPriorityActions.map((action, index) => (
              <div
                key={`priority-action-${index}`}
                className="rounded-xl bg-slate-900/70 px-3 py-3 text-sm leading-6 text-slate-200"
              >
                {index + 1}. {action}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-5">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs text-slate-500">오늘의 추천</div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {dailyReport.todayRecommendations.length}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs text-slate-500">신규 진입</div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {dailyReport.top10Changes.newEntries.length}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs text-slate-500">탈락 종목</div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {dailyReport.top10Changes.dropped.length}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs text-slate-500">보유 상태</div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {dailyReport.holdingsStatus.length}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs text-slate-500">매도 필요 종목</div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {
              dailyReport.sellCandidates.filter(
                (item) =>
                  item.targetAction === "전량매도" ||
                  item.targetAction === "일부매도"
              ).length
            }
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        {renderBridgeList(
          "운영 연결 1 · 추천 → 보유 연결",
          "오늘 추천이 기존 보유와 어떻게 이어지는지 바로 확인합니다.",
          dailyReport.portfolioBridge.recommendationToHolding,
          "추천과 보유를 직접 연결해 볼 항목이 없습니다."
        )}

        {renderBridgeList(
          "운영 연결 2 · 보유 위험 점검",
          "보유는 하고 있지만 신호가 약화되거나 관찰이 필요한 종목입니다.",
          dailyReport.portfolioBridge.holdingRiskLinks,
          "별도 위험 점검이 필요한 보유 종목이 없습니다."
        )}

        {renderBridgeList(
          "운영 연결 3 · 매도 실행 후보",
          "리스크 관리 차원에서 우선순위 높게 봐야 할 매도 후보입니다.",
          dailyReport.portfolioBridge.sellExecutionLinks,
          "즉시 실행이 필요한 매도 후보가 없습니다."
        )}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="text-sm font-bold text-emerald-900">
            [1] 오늘의 추천
          </div>
          <div className="mt-3 space-y-3">
            {dailyReport.todayRecommendations.map((item) => (
              <div key={item.code} className="rounded-xl bg-white p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-900">
                      {item.recommendationLabel} · {item.name}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {item.code} · {item.market} · {item.industry}
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-[11px] font-semibold ${getGradeBadgeClass(
                      item.grade
                    )}`}
                  >
                    {item.grade}
                  </span>
                </div>

                <div className="mt-2 text-sm text-slate-700">
                  {item.hypothesis}
                </div>

                <div className="mt-2 text-xs text-slate-500">
                  근거 {item.evidence.join(" · ")}
                </div>

                <div className="mt-1 text-xs text-rose-600">
                  리스크 {item.risk.join(" · ")}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
          <div className="text-sm font-bold text-violet-900">
            [2] Top10 변화
          </div>

          <div className="mt-3">
            <div className="text-xs font-semibold text-violet-700">
              신규 진입
            </div>
            <div className="mt-2 space-y-2">
              {dailyReport.top10Changes.newEntries.length > 0 ? (
                dailyReport.top10Changes.newEntries.map((item) => (
                  <div key={item.code} className="rounded-xl bg-white p-3">
                    <div className="font-semibold text-slate-900">
                      {item.name}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {item.code} · 점수 {item.score.toFixed(2)} · 등급{" "}
                      {item.grade}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl bg-white p-3 text-sm text-slate-500">
                  신규 진입 종목이 없습니다.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4">
            <div className="text-xs font-semibold text-violet-700">
              탈락 종목
            </div>
            <div className="mt-2 space-y-2">
              {dailyReport.top10Changes.dropped.length > 0 ? (
                dailyReport.top10Changes.dropped.map((item) => (
                  <div key={item.code} className="rounded-xl bg-white p-3">
                    <div className="font-semibold text-slate-900">
                      {item.name}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {item.code} · 점수 {item.score.toFixed(2)} · 등급{" "}
                      {item.grade}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl bg-white p-3 text-sm text-slate-500">
                  탈락 종목이 없습니다.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <div className="text-sm font-bold text-rose-900">
            [5] 오늘의 액션 요약
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white p-3">
              <div className="text-xs text-slate-500">전체 BUY</div>
              <div className="mt-1 text-xl font-bold text-emerald-700">
                {dailyReport.actionSummary.buy}
              </div>
            </div>

            <div className="rounded-xl bg-white p-3">
              <div className="text-xs text-slate-500">전체 HOLD</div>
              <div className="mt-1 text-xl font-bold text-slate-900">
                {dailyReport.actionSummary.hold}
              </div>
            </div>

            <div className="rounded-xl bg-white p-3">
              <div className="text-xs text-slate-500">전체 SELL</div>
              <div className="mt-1 text-xl font-bold text-rose-700">
                {dailyReport.actionSummary.sell}
              </div>
            </div>

            <div className="rounded-xl bg-white p-3">
              <div className="text-xs text-slate-500">매도 후보 수</div>
              <div className="mt-1 text-xl font-bold text-rose-700">
                {dailyReport.actionSummary.sellCandidateCount}
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-white p-3 text-sm text-slate-700">
            추천 기준:
            <div className="mt-2 text-xs text-slate-500">
              BUY {dailyReport.actionSummary.recommendationBuy} · HOLD{" "}
              {dailyReport.actionSummary.recommendationHold} · SELL{" "}
              {dailyReport.actionSummary.recommendationSell}
            </div>
            <div className="mt-2 text-xs text-slate-500">
              보유 기준:
              추가매수 {dailyReport.actionSummary.holdingAddBuy} · 유지{" "}
              {dailyReport.actionSummary.holdingHold} · 일부매도{" "}
              {dailyReport.actionSummary.holdingPartialSell} · 전량매도{" "}
              {dailyReport.actionSummary.holdingFullSell} · 관찰강화{" "}
              {dailyReport.actionSummary.holdingWatch}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-sm font-bold text-slate-900">[3] 보유 종목 상태</div>

          <div className="mt-3 space-y-3">
            {dailyReport.holdingsStatus.map((item) => (
              <div key={item.code} className="rounded-xl bg-white p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-900">
                      {item.name}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {item.code} · 보유 {item.quantity.toLocaleString("ko-KR")}주
                      · 현재가 {formatCurrency(item.currentPrice)}
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-2 py-1 text-[11px] font-semibold ${getHoldingDecisionBadgeClass(
                      item.decision
                    )}`}
                  >
                    {item.decision}
                  </span>
                </div>

                <div className="mt-2 text-sm text-slate-700">
                  {item.hypothesis}
                </div>

                <div className="mt-2 text-xs text-slate-500">
                  엔진신호 {item.engineSignal}
                  {item.inTop10 && item.matchedTop10Rank
                    ? ` · Top10 ${item.matchedTop10Rank}위`
                    : " · Top10 제외"}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-sm font-bold text-slate-900">[4] 매도 필요 종목</div>

          <div className="mt-3 space-y-3">
            {dailyReport.sellCandidates.length > 0 ? (
              dailyReport.sellCandidates.map((item) => (
                <div key={item.code} className="rounded-xl bg-white p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-900">
                        {item.name}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {item.code} · 현재가 {formatCurrency(item.currentPrice)}
                      </div>
                    </div>

                    <span
                      className={`rounded-full px-2 py-1 text-[11px] font-semibold ${getHoldingDecisionBadgeClass(
                        item.targetAction
                      )}`}
                    >
                      {item.targetAction}
                    </span>
                  </div>

                  <div className="mt-2 text-sm text-slate-700">
                    {item.hypothesis}
                  </div>

                  <div className="mt-2 text-xs text-slate-500">
                    근거 {item.evidence.join(" · ")}
                  </div>

                  <div className="mt-1 text-xs text-rose-600">
                    리스크 {item.risk.join(" · ")}
                  </div>

                  <div className="mt-1 text-xs text-amber-700">
                    반전 조건 {item.reversalCondition}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl bg-white p-3 text-sm text-slate-500">
                매도 후보가 없습니다.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}