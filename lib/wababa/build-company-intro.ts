export function buildCompanyIntro(item: any): string {
  const name =
    item.name ||
    item.corpName ||
    item.stockName ||
    item.companyName ||
    "";

  const themes: string[] = item.themes || [];
  const evidence: string[] = item.evidence || [];

  const rawIntro =
    item.companyIntro ||
    item.businessSummary ||
    item.description ||
    "";

  // 1️⃣ 기존 소개가 괜찮으면 그대로 사용
  if (rawIntro && rawIntro.length > 12) {
    return rawIntro;
  }

  // 2️⃣ 테마 기반 생성
  if (themes.length > 0) {
    const theme = themes[0];

    if (theme.includes("반도체")) {
      return `${name}은 반도체 관련 핵심 부품/공정 기업으로 업황 회복 수혜가 기대됩니다.`;
    }

    if (theme.includes("방산")) {
      return `${name}은 방산 수출 확대 흐름에서 실적 성장 가능성이 있는 기업입니다.`;
    }

    if (theme.includes("2차전지")) {
      return `${name}은 2차전지 밸류체인 내 소재/부품 기업으로 수요 증가 수혜가 기대됩니다.`;
    }

    if (theme.includes("AI")) {
      return `${name}은 AI 산업 확장에 따라 수요 증가가 기대되는 구조에 있습니다.`;
    }

    return `${name}은 ${theme} 관련 산업에서 성장 흐름이 이어지는 기업입니다.`;
  }

  // 3️⃣ 뉴스 기반
  if (evidence.length > 0) {
    return evidence[0];
  }

  // 4️⃣ fallback
  return `${name}은 현재 업황과 실적 흐름을 함께 볼 필요가 있는 종목입니다.`;
}