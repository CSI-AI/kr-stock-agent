import HomeSectionCard from "@/components/home/home-section-card";

export default function PhaseStatusSection() {
  const items = [
    "기본 프로젝트 생성 완료",
    "핵심 타입 고정 완료",
    "더미 거래 입력 구조 추가 완료",
    "포트폴리오 계산 유틸 초안 완료",
    "점수 계산 기준 분리 완료",
    "추천 종목 총점 계산 구조 완료",
    "전일 대비 순위 비교 구조 완료",
    "신규 진입 / 이탈 자동 계산 완료",
    "전체 유니버스 / Top 추천 분리 완료",
    "다음 단계: 재무지표 입력 타입 분리",
  ];

  return (
    <HomeSectionCard eyebrow="Phase 진행 체크" title="현재 완료 상태">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-200"
          >
            {item}
          </div>
        ))}
      </div>
    </HomeSectionCard>
  );
}