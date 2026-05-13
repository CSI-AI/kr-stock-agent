import { newEntries, recommendationCutoffRank, removedEntries } from "@/data/mock-dashboard";
import HomeSectionCard from "@/components/home/home-section-card";

export default function ChangeSection() {
  return (
    <HomeSectionCard eyebrow="변동 사항" title="신규 / 이탈 종목">
      <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-300">
        현재 추천 컷라인: 상위 {recommendationCutoffRank}위
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-slate-950/70 p-4">
          <p className="text-sm font-semibold text-emerald-300">신규 진입</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            {newEntries.length > 0 ? (
              newEntries.map((item) => <li key={item}>- {item}</li>)
            ) : (
              <li>- 없음</li>
            )}
          </ul>
        </div>

        <div className="rounded-2xl bg-slate-950/70 p-4">
          <p className="text-sm font-semibold text-rose-300">이탈 종목</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            {removedEntries.length > 0 ? (
              removedEntries.map((item) => <li key={item}>- {item}</li>)
            ) : (
              <li>- 없음</li>
            )}
          </ul>
        </div>
      </div>
    </HomeSectionCard>
  );
}