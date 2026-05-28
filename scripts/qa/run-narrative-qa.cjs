// Phase 37-A3 — narrative QA 실행기
// recommendation-history.json의 종목들에 대해 narrative QA를 돌려
// reports/narrative-qa/ 아래에 4개 리포트를 생성한다.
// ranking/scoring/narrative 생성 로직 변경 없음.

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..", "..");
const BUILD_DIR = path.join(ROOT, ".qa-build");
const REPORT_DIR = path.join(ROOT, "reports", "narrative-qa");

function ensureCompiled() {
  // narrative + hold + hold-risk + portfolio-state + portfolio-drift + qa
  const files = [
    path.join("lib", "wababa", "build-sector-durability-narrative.ts"),
    path.join("lib", "wababa", "build-hold-narrative.ts"),
    path.join("lib", "wababa", "build-hold-risk-narrative.ts"),
    path.join("lib", "wababa", "build-portfolio-state.ts"),
    path.join("lib", "wababa", "build-portfolio-drift.ts"),
    path.join("lib", "wababa", "build-portfolio-action.ts"),
    path.join("lib", "wababa", "snapshot", "portfolio-snapshot.ts"),
    path.join("lib", "wababa", "qa", "narrative-qa.ts"),
  ];

  const cmd = [
    "npx",
    "tsc",
    ...files.map((f) => `"${f}"`),
    "--outDir",
    `"${BUILD_DIR}"`,
    "--rootDir",
    `"${ROOT}"`,
    "--module",
    "commonjs",
    "--target",
    "es2020",
    "--moduleResolution",
    "node",
    "--esModuleInterop",
    "--skipLibCheck",
  ].join(" ");

  execSync(cmd, { cwd: ROOT, stdio: "inherit" });
}

function collectPicks() {
  const raw = JSON.parse(
    fs.readFileSync(path.join(ROOT, "public", "data", "recommendation-history.json"), "utf8")
  );

  const wababaPicks = Array.isArray(raw.wababaPicks) ? raw.wababaPicks : [];
  const explore = [];

  if (raw.exploreGroups && typeof raw.exploreGroups === "object") {
    for (const value of Object.values(raw.exploreGroups)) {
      if (Array.isArray(value)) {
        explore.push(...value);
      }
    }
  }

  return [...wababaPicks, ...explore];
}

function collectHoldings() {
  // portfolio.positions + aiPortfolio.positions를 보유 종목 universe로 사용한다.
  // 각 position은 code/name/buyPrice/quantity만 가지므로 wababaPicks·exploreGroups에서
  // 메타데이터를 lookup해 hold narrative 입력을 합성한다.
  const raw = JSON.parse(
    fs.readFileSync(path.join(ROOT, "public", "data", "recommendation-history.json"), "utf8")
  );

  const positions = [];

  if (raw.portfolio && Array.isArray(raw.portfolio.positions)) {
    positions.push(...raw.portfolio.positions);
  }

  if (raw.aiPortfolio && Array.isArray(raw.aiPortfolio.positions)) {
    positions.push(...raw.aiPortfolio.positions);
  }

  const metadataPool = collectPicks();
  const byCode = new Map();
  for (const p of metadataPool) {
    const key = p.code || p.symbol;
    if (key && !byCode.has(key)) {
      byCode.set(key, p);
    }
  }

  return positions.map((pos) => {
    const code = pos.code || pos.symbol;
    const meta = (code && byCode.get(code)) || {};
    return {
      ...meta,
      // position 본인 필드가 메타 위에 덮어쓰기
      code: code || meta.code,
      name: pos.name || meta.name || meta.corpName,
      buyPrice: pos.buyPrice,
      quantity: pos.quantity,
    };
  });
}

function collectFundPortfolios() {
  // 펀드별 portfolio state 분석용 입력. wababa/ai 두 펀드 각각.
  const raw = JSON.parse(
    fs.readFileSync(path.join(ROOT, "public", "data", "recommendation-history.json"), "utf8")
  );
  const metadataPool = collectPicks();
  const byCode = new Map();
  for (const p of metadataPool) {
    const key = p.code || p.symbol;
    if (key && !byCode.has(key)) byCode.set(key, p);
  }

  const buildHoldings = (positions) =>
    positions.map((pos) => {
      const code = pos.code || pos.symbol;
      const meta = (code && byCode.get(code)) || {};
      return {
        ...meta,
        code: code || meta.code,
        name: pos.name || meta.name || meta.corpName,
      };
    });

  const wababaPortfolio = raw.portfolio || {};
  const aiPortfolio = raw.aiPortfolio || {};

  const wababaCash = Number(wababaPortfolio.cash) || 0;
  const wababaInitial = Number(wababaPortfolio.initialCapital) || 0;
  const wababaCashRate = wababaInitial > 0 ? (wababaCash / wababaInitial) * 100 : 0;

  const aiCash = Number(aiPortfolio.cash) || 0;
  const aiInitial = Number(aiPortfolio.initialCapital) || 0;
  const aiCashRate = aiInitial > 0 ? (aiCash / aiInitial) * 100 : 0;

  return [
    {
      fundKey: "wababa",
      holdings: buildHoldings(Array.isArray(wababaPortfolio.positions) ? wababaPortfolio.positions : []),
      cashRatePercent: wababaCashRate,
    },
    {
      fundKey: "ai",
      holdings: buildHoldings(Array.isArray(aiPortfolio.positions) ? aiPortfolio.positions : []),
      cashRatePercent: aiCashRate,
    },
  ];
}

function toInput(p) {
  return {
    industryName: p.industryName,
    name: p.name || p.corpName || p.stockName,
    code: p.code || p.symbol,
    symbol: p.symbol,
    corpName: p.corpName,
    hypothesis: p.hypothesis,
    sectorDurabilityLabel: p.sectorDurabilityLabel,
    industryTailwind: p.industryTailwind,
    longTermHoldView: p.longTermHoldView,
    growthSignalTags: p.growthSignalTags,
    coreCatalyst: p.coreCatalyst,
    growthStory: p.growthStory,
    themes: p.themes,
  };
}

function toHoldInput(p) {
  return {
    industryName: p.industryName,
    name: p.name || p.corpName || p.stockName,
    code: p.code || p.symbol,
    symbol: p.symbol,
    corpName: p.corpName,
    longTermHoldView: p.longTermHoldView,
    growthDurabilityLabel: p.growthDurabilityLabel,
    growthConsistencyLabel: p.growthConsistencyLabel,
    sectorDurabilityLabel: p.sectorDurabilityLabel,
    growthSignalTags: p.growthSignalTags,
    coreCatalyst: p.coreCatalyst,
    growthStory: p.growthStory,
    investmentThesis: p.investmentThesis,
    industryTailwind: p.industryTailwind,
    hypothesis: p.hypothesis,
    salesGrowth: p.salesGrowth,
    operatingProfitGrowth: p.operatingProfitGrowth,
    per: p.per ?? p.PER,
    pbr: p.pbr ?? p.PBR,
    roe: p.roe ?? p.ROE,
    opMargin: p.opMargin,
  };
}

function toHoldRiskInput(p) {
  // Hold narrative와 동일 메타를 사용하되, risk 분류용 필드 별도 강조.
  return {
    industryName: p.industryName,
    name: p.name || p.corpName || p.stockName,
    code: p.code || p.symbol,
    symbol: p.symbol,
    corpName: p.corpName,
    per: p.per ?? p.PER,
    pbr: p.pbr ?? p.PBR,
    roe: p.roe ?? p.ROE,
    opMargin: p.opMargin,
    salesGrowth: p.salesGrowth,
    operatingProfitGrowth: p.operatingProfitGrowth,
    sectorDurabilityLabel: p.sectorDurabilityLabel,
    growthDurabilityLabel: p.growthDurabilityLabel,
    growthConsistencyLabel: p.growthConsistencyLabel,
    longTermHoldView: p.longTermHoldView,
    industryTailwind: p.industryTailwind,
    growthSignalTags: p.growthSignalTags,
    coreCatalyst: p.coreCatalyst,
  };
}

function mkdirp(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeJson(file, payload) {
  fs.writeFileSync(file, JSON.stringify(payload, null, 2), "utf8");
}

function writeText(file, text) {
  fs.writeFileSync(file, text, "utf8");
}

function buildSummaryMd(summary, results) {
  const lines = [];
  lines.push("# Narrative QA Summary");
  lines.push("");
  lines.push(`- 분석 종목 수: **${summary.total}**`);
  lines.push(
    `- Fallback 비율: **${summary.fallbackCount}/${summary.total} (${summary.fallbackPercent}%)**`
  );
  lines.push(`- 평균 길이: ${summary.avgLength}자 (최대 ${summary.maxLength}자)`);
  lines.push(`- 평균 quality score: **${summary.avgQualityScore} / 100**`);
  lines.push("");
  lines.push("## Issue counts");

  for (const [code, count] of Object.entries(summary.issueCounts)) {
    lines.push(`- ${code}: ${count}`);
  }

  lines.push("");
  lines.push("## Duplicate clusters (ending tail 30자, ≥3회)");

  if (summary.duplicateClusters.length === 0) {
    lines.push("- 없음");
  } else {
    for (const cluster of summary.duplicateClusters) {
      lines.push(
        `- ${cluster.count}회: ...${cluster.endingTail}`
      );
      const memberPreview = cluster.members
        .slice(0, 5)
        .map((m) => `${m.name}(${m.code})`)
        .join(", ");
      lines.push(`  - 멤버 일부: ${memberPreview}`);
    }
  }

  lines.push("");
  lines.push("## Top issue cases (qualityScore 낮은 상위 10)");
  const sortedByScore = [...results].sort(
    (a, b) => a.qualityScore - b.qualityScore
  );
  const topIssues = sortedByScore.filter((r) => r.issues.length > 0).slice(0, 10);

  if (topIssues.length === 0) {
    lines.push("- 검출된 issue 종목 없음 (모두 100점)");
  } else {
    for (const r of topIssues) {
      lines.push(
        `- **${r.name}(${r.code})** [${r.industryName}] · score ${r.qualityScore}`
      );
      lines.push(`  - narrative: ${r.narrative}`);
      for (const issue of r.issues) {
        lines.push(`  - issue [${issue.code}]: ${issue.message}`);
      }
    }
  }

  return lines.join("\n") + "\n";
}

function main() {
  console.log("[qa] compiling narrative + qa modules...");
  ensureCompiled();

  console.log("[qa] loading recommendation-history.json picks...");
  const picks = collectPicks();
  console.log(`[qa] total picks: ${picks.length}`);

  const narrModPath = path.join(
    BUILD_DIR,
    "lib",
    "wababa",
    "build-sector-durability-narrative.js"
  );
  const qaModPath = path.join(
    BUILD_DIR,
    "lib",
    "wababa",
    "qa",
    "narrative-qa.js"
  );

  if (!fs.existsSync(narrModPath) || !fs.existsSync(qaModPath)) {
    throw new Error(
      `Compile output missing: ${narrModPath} / ${qaModPath}. Check tsc.`
    );
  }

  // narrative module은 qa module 안에서 require하는데, 컴파일 출력은
  // alias "@/..."가 그대로라 직접 require 실패. require hook으로 alias 해석.
  const Module = require("module");
  const originalResolve = Module._resolveFilename;
  Module._resolveFilename = function (request, parent, ...rest) {
    if (typeof request === "string" && request.startsWith("@/")) {
      const rewritten = path.join(BUILD_DIR, request.slice(2)) + ".js";
      return originalResolve.call(this, rewritten, parent, ...rest);
    }
    return originalResolve.call(this, request, parent, ...rest);
  };

  const qa = require(qaModPath);
  const {
    analyzeNarrative,
    summarizeCorpus,
    analyzeHoldNarrative,
    summarizeHoldCorpus,
    analyzeHoldRiskNarrative,
    summarizeHoldRiskCorpus,
    analyzePortfolioState,
    analyzePortfolioDrift,
    analyzePortfolioAction,
  } = qa;

  // Phase 37-A12 — snapshot loader 모듈 (server-side fs read-only)
  const snapModPath = path.join(
    BUILD_DIR,
    "lib",
    "wababa",
    "snapshot",
    "portfolio-snapshot.js"
  );
  const snap = fs.existsSync(snapModPath) ? require(snapModPath) : null;
  const allSnapshots = snap ? snap.loadPortfolioSnapshots() : [];
  if (snap) {
    const desc = snap.describeSnapshotState();
    console.log(
      `[qa] snapshot: file=${desc.resolvedPath || "(none)"} total=${desc.total} byFund=${JSON.stringify(desc.byFund)}`
    );
  } else {
    console.log("[qa] snapshot loader module not available — skip.");
  }

  const results = picks.map((p) => analyzeNarrative(toInput(p)));
  const summary = summarizeCorpus(results);

  // Hold narrative QA
  const holdings = collectHoldings();
  console.log(`[qa] holdings (portfolio.positions + aiPortfolio.positions): ${holdings.length}`);
  const holdResults = holdings.map((p) => analyzeHoldNarrative(toHoldInput(p)));
  const holdSummary = summarizeHoldCorpus(holdResults);

  // Hold Risk narrative QA (Phase 37-A6)
  const riskResults = holdings.map((p) =>
    analyzeHoldRiskNarrative(toHoldRiskInput(p))
  );
  const riskSummary = summarizeHoldRiskCorpus(riskResults);

  // Portfolio State QA (Phase 37-A8)
  const fundPortfolios = collectFundPortfolios();
  const portfolioStateResults = fundPortfolios.map((f) =>
    analyzePortfolioState(f)
  );

  // Portfolio Drift QA (Phase 37-A9 + A12). previous를 snapshot에서 자동 lookup.
  // snapshot이 없거나 previous가 없으면 DATA_LIMITED fallback 자연 발생.
  const fundDriftInputs = fundPortfolios.map((f) => {
    const holdings = f.holdings || [];
    const total = holdings.length;
    const longHoldCount = holdings.filter((h) => {
      const longView = h.longTermHoldView || "";
      const dur = h.growthDurabilityLabel || "";
      return longView.includes("장기보유") || dur.includes("장기보유");
    }).length;
    const cycleCount = holdings.filter((h) =>
      (h.sectorDurabilityLabel || "").includes("회복 사이클")
    ).length;
    const valCount = holdings.filter(
      (h) => typeof h.per === "number" && h.per > 25
    ).length;

    const currentDate = new Date().toISOString().slice(0, 10);
    let previousInput = null;
    if (snap) {
      const prevSnap = snap.getPreviousPortfolioSnapshot({
        fundKey: f.fundKey,
        currentDate,
        snapshots: allSnapshots,
      });
      previousInput = snap.snapshotToDriftSnapshot(prevSnap);
    }

    return {
      fundKey: f.fundKey,
      current: {
        date: currentDate,
        longHoldRatio: total > 0 ? longHoldCount / total : 0,
        cycleRatio: total > 0 ? cycleCount / total : 0,
        valuationStretchedRatio: total > 0 ? valCount / total : 0,
        cashRatePercent: f.cashRatePercent,
        totalPositions: total,
      },
      previous: previousInput,
    };
  });
  const portfolioDriftResults = fundDriftInputs.map((d) =>
    analyzePortfolioDrift(d)
  );

  // Phase 37-A12 — Drift 시뮬레이션 (가짜 previous로 IMPROVING/STABLE/WATCH 검증).
  // 실 데이터 대상이 아니라 룰 정상 작동 확인용. report에 별도 필드로 산출.
  const simulationFund = fundPortfolios[0] || { fundKey: "wababa", holdings: [], cashRatePercent: 0 };
  const simBase = fundDriftInputs[0]
    ? fundDriftInputs[0].current
    : {
        date: "sim-current",
        longHoldRatio: 0.5,
        cycleRatio: 0.5,
        valuationStretchedRatio: 0.0,
        cashRatePercent: 50,
        totalPositions: 5,
      };

  const simScenarios = [
    {
      label: "IMPROVING",
      previous: {
        date: "sim-prev",
        longHoldRatio: Math.max(0, (simBase.longHoldRatio || 0) - 0.2),
        cycleRatio: simBase.cycleRatio || 0,
        valuationStretchedRatio: simBase.valuationStretchedRatio || 0,
        cashRatePercent: simBase.cashRatePercent || 0,
        totalPositions: simBase.totalPositions || 0,
      },
    },
    {
      label: "STABLE",
      previous: {
        date: "sim-prev",
        longHoldRatio: simBase.longHoldRatio || 0,
        cycleRatio: simBase.cycleRatio || 0,
        valuationStretchedRatio: simBase.valuationStretchedRatio || 0,
        cashRatePercent: simBase.cashRatePercent || 0,
        totalPositions: simBase.totalPositions || 0,
      },
    },
    {
      label: "WATCH",
      previous: {
        date: "sim-prev",
        longHoldRatio: simBase.longHoldRatio || 0,
        cycleRatio: Math.max(0, (simBase.cycleRatio || 0) - 0.2),
        valuationStretchedRatio: simBase.valuationStretchedRatio || 0,
        cashRatePercent: simBase.cashRatePercent || 0,
        totalPositions: simBase.totalPositions || 0,
      },
    },
  ];
  const simulationResults = simScenarios.map((sc) =>
    analyzePortfolioDrift({
      fundKey: `sim-${sc.label}`,
      current: simBase,
      previous: sc.previous,
    })
  );

  // Portfolio Action QA (Phase 37-A10). drift direction을 받아 운영 모드 산출.
  const portfolioActionResults = fundPortfolios.map((f, i) => {
    const drift = portfolioDriftResults[i];
    return analyzePortfolioAction({
      fundKey: f.fundKey,
      holdings: f.holdings,
      cashRatePercent: f.cashRatePercent,
      driftDirection: drift ? drift.driftDirection : undefined,
      totalPositions: (f.holdings || []).length,
    });
  });

  mkdirp(REPORT_DIR);

  // mismatch
  const mismatch = results
    .filter((r) =>
      r.issues.some((i) => i.code === "INDUSTRY_MISMATCH")
    )
    .map((r) => ({
      code: r.code,
      name: r.name,
      industryName: r.industryName,
      narrative: r.narrative,
      expected: r.expectedBucketFromIndustry,
      picked: r.pickedBucket,
    }));
  writeJson(
    path.join(REPORT_DIR, "mismatch-report.json"),
    { count: mismatch.length, items: mismatch }
  );

  // duplicate
  writeJson(
    path.join(REPORT_DIR, "duplicate-report.json"),
    {
      clusterCount: summary.duplicateClusters.length,
      clusters: summary.duplicateClusters,
    }
  );

  // fallback
  const fallbackItems = results
    .filter((r) => r.isFallback)
    .map((r) => ({
      code: r.code,
      name: r.name,
      industryName: r.industryName,
      length: r.length,
      narrative: r.narrative,
      issues: r.issues.map((i) => i.code),
    }));
  writeJson(
    path.join(REPORT_DIR, "fallback-report.json"),
    {
      total: results.length,
      fallbackCount: summary.fallbackCount,
      fallbackPercent: summary.fallbackPercent,
      items: fallbackItems,
    }
  );

  // summary md
  writeText(
    path.join(REPORT_DIR, "narrative-summary.md"),
    buildSummaryMd(summary, results)
  );

  // full result dump (debug용)
  writeJson(path.join(REPORT_DIR, "all-results.json"), results);

  // Hold narrative reports
  writeJson(path.join(REPORT_DIR, "hold-report.json"), {
    total: holdSummary.total,
    stateCounts: holdSummary.stateCounts,
    avgLength: holdSummary.avgLength,
    maxLength: holdSummary.maxLength,
    avgQualityScore: holdSummary.avgQualityScore,
    issueCounts: holdSummary.issueCounts,
    duplicateClusters: holdSummary.duplicateClusters,
    items: holdResults.map((r) => ({
      code: r.code,
      name: r.name,
      industryName: r.industryName,
      state: r.state,
      length: r.length,
      qualityScore: r.qualityScore,
      narrative: r.narrative,
      issues: r.issues.map((i) => i.code),
    })),
  });

  // Hold Risk narrative reports (Phase 37-A6)
  writeJson(path.join(REPORT_DIR, "hold-risk-report.json"), {
    total: riskSummary.total,
    stateCounts: riskSummary.stateCounts,
    avgLength: riskSummary.avgLength,
    maxLength: riskSummary.maxLength,
    avgQualityScore: riskSummary.avgQualityScore,
    issueCounts: riskSummary.issueCounts,
    duplicateClusters: riskSummary.duplicateClusters,
    items: riskResults.map((r) => ({
      code: r.code,
      name: r.name,
      industryName: r.industryName,
      state: r.state,
      length: r.length,
      qualityScore: r.qualityScore,
      narrative: r.narrative,
      issues: r.issues.map((i) => i.code),
    })),
  });

  // Portfolio State reports (Phase 37-A8)
  writeJson(path.join(REPORT_DIR, "portfolio-state-report.json"), {
    funds: portfolioStateResults.map((r) => ({
      fundKey: r.fundKey,
      state: r.state,
      title: r.title,
      narrative: r.narrative,
      healthLevel: r.healthLevel,
      tags: r.tags,
      length: r.length,
      qualityScore: r.qualityScore,
      issues: r.issues.map((i) => ({ code: i.code, message: i.message })),
    })),
    avgQualityScore:
      portfolioStateResults.length > 0
        ? Number(
            (
              portfolioStateResults.reduce((s, r) => s + r.qualityScore, 0) /
              portfolioStateResults.length
            ).toFixed(1)
          )
        : 0,
  });

  // Portfolio Drift reports (Phase 37-A9 + A12)
  writeJson(path.join(REPORT_DIR, "portfolio-drift-report.json"), {
    snapshotState: snap ? snap.describeSnapshotState() : null,
    funds: portfolioDriftResults.map((r, i) => ({
      fundKey: r.fundKey,
      driftDirection: r.driftDirection,
      driftTitle: r.driftTitle,
      driftNarrative: r.driftNarrative,
      driftTags: r.driftTags,
      length: r.length,
      qualityScore: r.qualityScore,
      previousDate:
        fundDriftInputs[i] && fundDriftInputs[i].previous
          ? fundDriftInputs[i].previous.date
          : null,
      issues: r.issues.map((i) => ({ code: i.code, message: i.message })),
    })),
    avgQualityScore:
      portfolioDriftResults.length > 0
        ? Number(
            (
              portfolioDriftResults.reduce((s, r) => s + r.qualityScore, 0) /
              portfolioDriftResults.length
            ).toFixed(1)
          )
        : 0,
    simulation: simulationResults.map((r) => ({
      fundKey: r.fundKey,
      expected: r.fundKey.replace("sim-", ""),
      driftDirection: r.driftDirection,
      driftTitle: r.driftTitle,
      driftNarrative: r.driftNarrative,
      driftTags: r.driftTags,
      qualityScore: r.qualityScore,
      issues: r.issues.length,
    })),
  });

  // Portfolio Action reports (Phase 37-A10)
  writeJson(path.join(REPORT_DIR, "portfolio-action-report.json"), {
    funds: portfolioActionResults.map((r) => ({
      fundKey: r.fundKey,
      actionMode: r.actionMode,
      actionTitle: r.actionTitle,
      actionNarrative: r.actionNarrative,
      actionTags: r.actionTags,
      length: r.length,
      qualityScore: r.qualityScore,
      issues: r.issues.map((i) => ({ code: i.code, message: i.message })),
    })),
    avgQualityScore:
      portfolioActionResults.length > 0
        ? Number(
            (
              portfolioActionResults.reduce((s, r) => s + r.qualityScore, 0) /
              portfolioActionResults.length
            ).toFixed(1)
          )
        : 0,
  });

  console.log("[qa] done. report dir:", REPORT_DIR);
  console.log(
    `[qa] BUY: total=${summary.total}, fallback=${summary.fallbackPercent}%, avgScore=${summary.avgQualityScore}, dupClusters=${summary.duplicateClusters.length}`
  );
  console.log(
    `[qa] HOLD: total=${holdSummary.total}, avgScore=${holdSummary.avgQualityScore}, dupClusters=${holdSummary.duplicateClusters.length}, states=${JSON.stringify(holdSummary.stateCounts)}`
  );
  console.log(
    `[qa] RISK: total=${riskSummary.total}, avgScore=${riskSummary.avgQualityScore}, dupClusters=${riskSummary.duplicateClusters.length}, states=${JSON.stringify(riskSummary.stateCounts)}`
  );
  console.log(
    `[qa] PORTFOLIO: funds=${portfolioStateResults.length}, states=${portfolioStateResults.map((r) => r.fundKey + ':' + r.state).join(', ')}`
  );
  console.log(
    `[qa] DRIFT: funds=${portfolioDriftResults.length}, dirs=${portfolioDriftResults.map((r) => r.fundKey + ':' + r.driftDirection).join(', ')}`
  );
  console.log(
    `[qa] DRIFT SIM: ${simulationResults.map((r) => r.fundKey + '->' + r.driftDirection).join(', ')}`
  );
  console.log(
    `[qa] ACTION: funds=${portfolioActionResults.length}, modes=${portfolioActionResults.map((r) => r.fundKey + ':' + r.actionMode).join(', ')}`
  );
}

try {
  main();
} catch (err) {
  console.error("[qa] failed:", err.message);
  process.exitCode = 1;
}
