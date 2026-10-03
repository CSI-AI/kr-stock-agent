const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const deps = path.resolve(__dirname, '../../node_modules');
const ts = require(path.join(deps, 'typescript'));
const React = require(path.join(deps, 'react'));
const { renderToStaticMarkup } = require(path.join(deps, 'react-dom/server'));
const sourcePath = path.resolve(__dirname, '../../app/_dashboard/magic-official.tsx');
const compiled = ts.transpileModule(fs.readFileSync(sourcePath, 'utf8'), {
  fileName: sourcePath,
  compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  reportDiagnostics: true,
});
assert.equal(compiled.diagnostics?.length ?? 0, 0);
const mod = new Module(sourcePath, module);
mod.filename = sourcePath;
mod.paths = [deps];
mod._compile(compiled.outputText, sourcePath);
const base = { magicOfficialSummary: {
  officialStartDate: '2026-06-17', dataDate: '2026-10-02', officialSequence: 74,
  initialCapital: 500000000, totalAsset: 535760087, cumulativeReturn: 7.15,
  actualExecution: false, naturalPaperFrom: '2026-09-30',
}, magicOfficialPortfolio: { holdings: [] }, magicOfficialTradeDays: [
  { date: '2026-10-02', runStatus: 'COMPLETED', officialSequence: 74, notActualExecution: false, buys: [], sells: [] },
] };
const official = renderToStaticMarkup(React.createElement(mod.exports.MagicOfficialCard, { history: base }));
assert.ok(official.includes('공식 운용'));
assert.ok(official.includes('누적수익률 (기초 5억원 대비)'));
assert.ok(official.includes('연환산 수익률 (참고)') && official.includes('1년 미만'));
const virtual = structuredClone(base);
virtual.magicOfficialSummary.naturalPaperFrom = null;
virtual.magicOfficialTradeDays[0].notActualExecution = true;
const virtualHtml = renderToStaticMarkup(React.createElement(mod.exports.MagicOfficialCard, { history: virtual }));
assert.ok(virtualHtml.includes('별도 규칙 재생 가상장부'));
assert.ok(virtualHtml.includes('과거 실제 운용성과가 아니며'));
const reconstructed = structuredClone(base);
reconstructed.magicReconstructionMeta = { actualExecution: false };
reconstructed.magicReconstructedSummary = { ...base.magicOfficialSummary, officialSequence: 75 };
reconstructed.magicReconstructedPortfolio = base.magicOfficialPortfolio;
reconstructed.magicReconstructedTradeDays = base.magicOfficialTradeDays;
const reconstructedHtml = renderToStaticMarkup(React.createElement(mod.exports.MagicOfficialCard, { history: reconstructed }));
assert.ok(reconstructedHtml.includes('별도 복구 가상장부'));
const annual = mod.exports.magicAnnualizedReturn({ officialStartDate: '2026-06-17',
  dataDate: '2027-06-17', initialCapital: 500000000, totalAsset: 550000000 });
assert.equal(annual.days, 365);
assert.ok(Math.abs(annual.value - 10) < 1e-8);
assert.equal(mod.exports.magicAnnualizedReturn({ officialStartDate: '2026-06-17',
  dataDate: '2026-06-17', initialCapital: 500000000, totalAsset: 550000000 }).value, null);
const published = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../public/data/recommendation-history.json'), 'utf8'));
const publishedCard = renderToStaticMarkup(React.createElement(mod.exports.MagicOfficialCard, { history: published }));
const publishedStrip = renderToStaticMarkup(React.createElement(mod.exports.MagicStatusStrip, { history: published }));
assert.ok(publishedCard.includes('누적수익률 (기초 5억원 대비)'));
assert.ok(publishedStrip.includes('연환산 수익률 (참고)'));
assert.ok(publishedStrip.includes('장부 기준일 2026.10.02'));
console.log('PASS return metrics SSR, virtual identity, and 365-day formula');
