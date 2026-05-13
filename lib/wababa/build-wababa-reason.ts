export function buildWababaReason(item: any): string {
  const name =
    item.name ||
    item.corpName ||
    item.stockName ||
    item.companyName ||
    "";

  const themes: string[] = item.themes || [];
  const evidence: string[] = item.evidence || [];

  const intro =
    item.companyIntro ||
    item.businessSummary ||
    item.description ||
    "";

  // 1️⃣ 회사 소개 기반 → 메모 스타일 변환
  if (intro && intro.length > 10) {
    return intro
      .replace(/입니다/g, "")
      .replace(/입니다\./g, "")
      .replace(/\.$/, "")
      .replace(/,?\s*로[, ]/g, ", ")
      .trim();
  }

  // 2️⃣ 테마 기반
  if (themes.length > 0) {
    const theme = themes[0];

    if (theme.includes("반도체")) {
      return "반도체 업황 회복 구간, AI 수요 증가 수혜, 테스트/부품 수요 확대";
    }

    if (theme.includes("방산")) {
      return "방산 수출 확대, 중동/유럽 수주 증가, 해외 매출 성장 구간";
    }

    if (theme.includes("2차전지")) {
      return "전기차 수요 증가, 2차전지 소재 공급 확대, 밸류체인 수혜";
    }

    if (theme.includes("AI")) {
      return "AI 인프라 투자 확대, 데이터센터 수요 증가, 관련 산업 확장";
    }

    return `${theme} 관련 수요 증가, 업황 개선 흐름`;
  }

  // 3️⃣ 뉴스 기반
  if (evidence.length > 0) {
    return evidence[0]
      .replace(/입니다/g, "")
      .replace(/\.$/, "")
      .trim();
  }

  // 4️⃣ fallback
  return "업황 회복 가능성, 실적 개선 기대, 밸류에이션 부담 낮음";
}