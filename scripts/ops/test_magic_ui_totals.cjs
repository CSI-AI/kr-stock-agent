const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');

// Offline SSR against the repository's current UI; no data or network writes.
const deps = 'C:/work/kr-stock-agent/node_modules';
const ts = require(path.join(deps, 'typescript'));
const React = require(path.join(deps, 'react'));
const { renderToStaticMarkup } = require(path.join(deps, 'react-dom/server'));
function load(relative, imports = {}) {
  const filename = path.resolve(__dirname, '../..', relative);
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    fileName: filename,
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    reportDiagnostics: true,
  });
  assert.equal(compiled.diagnostics?.length ?? 0, 0, `${relative} parse`);
  const mod = new Module(filename, module);
  mod.filename = filename;
  mod.paths = [deps];
  const originalRequire = mod.require.bind(mod);
  mod.require = (id) => imports[id] ?? originalRequire(id);
  mod._compile(compiled.outputText, filename);
  return mod.exports;
}
const official = load('app/_dashboard/magic-official.tsx');
const home = load('app/_dashboard/magic-first-page.tsx', { './magic-official': official });
for (const relative of ['app/page.tsx', 'app/settings/page.tsx', 'app/performance/page.tsx']) {
  const filename = path.resolve(__dirname, '../..', relative);
  assert.equal(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    fileName: filename, compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS },
    reportDiagnostics: true,
  }).diagnostics?.length ?? 0, 0, `${relative} parse`);
}
const history = {
  magicOfficialSummary: { officialStartDate: '2026-06-17', officialSequence: 74, dataDate: '2026-10-02', openItemLotCount: 2 },
  magicOfficialPortfolio: { holdings: [
    { code: '000001', name: '보유A', totalInvested: 1000, marketValue: 1100, unrealizedProfit: 100, returnRate: 10 },
    { code: '000002', name: '보유B', totalInvested: 2000, marketValue: 1900, unrealizedProfit: -100, returnRate: -5 },
  ] },
  magicOfficialTradeDays: [
    { date: '2026-10-02', buys: [], sells: [] },
    { date: '2026-10-01', buys: [
      { tradeId: 'b1', code: '000003', name: '매수A', amount: 400 },
      { tradeId: 'b2', code: '000004', name: '매수B', amount: 600 },
    ], sells: [
      { tradeId: 's1', code: '000005', name: '매도A', amount: 300, realizedProfit: 30 },
      { tradeId: 's2', code: '000006', name: '매도B', amount: 700, realizedProfit: -10 },
    ] },
  ],
};
const dashboard = renderToStaticMarkup(React.createElement(home.MagicHoldingsAndTrades, { history }));
const performance = renderToStaticMarkup(React.createElement(official.MagicOfficialCard, { history }));
for (const name of ['보유A', '보유B', '매수A', '매수B', '매도A', '매도B']) assert.ok(dashboard.includes(name), name);
for (const label of ['투자금액 합계', '평가금액 합계', '매수금액 합계', '매도금액 합계']) assert.ok(dashboard.includes(label), label);
for (const label of ['보유 종목 합계', '매수금액 합계', '매도금액·실현손익 합계']) assert.ok(performance.includes(label), label);
assert.ok(performance.includes('3,000원') && performance.includes('+20원'), 'holdings/sale totals');
const missing = structuredClone(history);
missing.magicOfficialPortfolio.holdings[0].marketValue = null;
const missingHtml = renderToStaticMarkup(React.createElement(official.MagicOfficialCard, { history: missing }));
assert.match(missingHtml, /보유 종목 합계<\/th><td[^>]*>3,000원<\/td><td[^>]*>-<\/td>/, 'missing valuation remains unknown');
const dashboardSource = fs.readFileSync(path.resolve(__dirname, '../../app/page.tsx'), 'utf8');
const settingsSource = fs.readFileSync(path.resolve(__dirname, '../../app/settings/page.tsx'), 'utf8');
assert.ok(!dashboardSource.includes('<MagicHowItWorks') && !dashboardSource.includes('<MagicNumberBoard'));
assert.ok(settingsSource.includes('<MagicHowItWorks') && settingsSource.includes('<MagicFormulaExplainer'));
const publishedPath = path.resolve(__dirname, '../../public/data/recommendation-history.json');
const published = JSON.parse(fs.readFileSync(publishedPath, 'utf8'));
const publishedHoldings = official.parseMagicOfficialPortfolio(published).holdings;
const publishedDays = official.parseMagicOfficialTradeDays(published);
const publishedHome = renderToStaticMarkup(React.createElement(home.MagicHoldingsAndTrades, { history: published }));
const publishedPerformance = renderToStaticMarkup(React.createElement(official.MagicOfficialCard, { history: published }));
const escaped = (name) => renderToStaticMarkup(React.createElement('span', null, name)).slice(6, -7);
for (const holding of publishedHoldings) assert.ok(publishedHome.includes(escaped(holding.name)), `published holding ${holding.code}`);
for (const buy of publishedDays.find((day) => day.buys.length)?.buys ?? []) assert.ok(publishedHome.includes(escaped(buy.name)), `published buy ${buy.code}`);
for (const sell of publishedDays.find((day) => day.sells.length)?.sells ?? []) assert.ok(publishedHome.includes(escaped(sell.name)), `published sell ${sell.code}`);
assert.ok(publishedPerformance.includes('보유 종목 합계'), 'published holdings footer');
console.log('PASS UI complete lists, column totals, missing-data guard, route layout');
