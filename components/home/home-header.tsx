export default function HomeHeader() {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-sm">
      <p className="text-sm font-medium text-emerald-400">
        국내주식 가치성장 투자운영 에이전트
      </p>

      <h1 className="mt-3 text-3xl font-bold tracking-tight">
        Phase 1 더미 데이터 기반 운영 화면
      </h1>

      <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
        이 프로젝트의 핵심은 좋은 종목 추천 그 자체가 아니라,
        지속적인 투자 판단을 돕는 시스템을 만드는 것이다.
        지금 단계는 실제 API 연동 전이며,
        더미 데이터로 전체 구조와 화면 흐름을 먼저 고정한다.
      </p>
    </section>
  );
}