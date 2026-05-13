import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { NextResponse, type NextRequest } from "next/server";

const execFileAsync = promisify(execFile);

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DATA_ROOT_DIR = "C:\\work\\kr-stock-agent-data-new";
const BUILD_SCRIPT_PATH = path.join(DATA_ROOT_DIR, "scripts", "build_recommendation_history.py");
const STATE_PATH = path.join(DATA_ROOT_DIR, "wababa-auto-run-state.json");
const RECOMMENDATION_HISTORY_PATH = path.join(DATA_ROOT_DIR, "recommendation-history.json");

const MARKET_OPEN_RUN_HOUR = 8;
const MARKET_OPEN_RUN_MINUTE = 40;

type AutoRunState = {
  lastRunDate?: string;
  lastRunAt?: string;
  lastStatus?: string;
  lastMessage?: string;
};

type FundTradeResultShape = {
  status?: string;
  message?: string;
  orders?: unknown[];
  skipped?: unknown[];
};

type PortfolioSummaryShape = {
  positionCount?: number;
  totalAssetAmount?: number;
  totalProfitRate?: number | null;
};

type RecommendationHistoryShape = {
  generatedAt?: string;
  fundTradeResult?: FundTradeResultShape;
  aiFundTradeResult?: FundTradeResultShape;
  portfolioSummary?: PortfolioSummaryShape;
  aiPortfolioSummary?: PortfolioSummaryShape;
};

function getKstNow() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
}

function formatKstDate(date: Date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatKstDateTime(date: Date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

function isWeekday(date: Date) {
  const day = date.getDay();
  return day >= 1 && day <= 5;
}

function isAfterRunTime(date: Date) {
  const minutes = date.getHours() * 60 + date.getMinutes();
  return minutes >= MARKET_OPEN_RUN_HOUR * 60 + MARKET_OPEN_RUN_MINUTE;
}

function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T;
  } catch {
    return fallback;
  }
}

function writeJsonFile(filePath: string, value: unknown) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), "utf-8");
}

function writeState(state: AutoRunState) {
  writeJsonFile(STATE_PATH, state);
}

async function runDailyBuild() {
  await execFileAsync("python", [BUILD_SCRIPT_PATH], {
    cwd: DATA_ROOT_DIR,
    windowsHide: true,
    timeout: 1000 * 60 * 20,
    maxBuffer: 1024 * 1024 * 10,
  });
}

function getRecommendationHistory() {
  return readJsonFile<RecommendationHistoryShape>(RECOMMENDATION_HISTORY_PATH, {});
}

function countOrders(result: FundTradeResultShape | undefined) {
  return Array.isArray(result?.orders) ? result.orders.length : 0;
}

function getRunMeta() {
  const history = getRecommendationHistory();
  const wababaOrders = countOrders(history.fundTradeResult);
  const aiOrders = countOrders(history.aiFundTradeResult);
  const totalOrderCount = wababaOrders + aiOrders;

  return {
    generatedAt: typeof history.generatedAt === "string" ? history.generatedAt : "",

    fundTradeStatus: history.fundTradeResult?.status || "",
    fundTradeMessage: history.fundTradeResult?.message || "",
    fundOrderCount: wababaOrders,
    positionCount: Number(history.portfolioSummary?.positionCount || 0),
    totalAssetAmount: Number(history.portfolioSummary?.totalAssetAmount || 0),
    totalProfitRate:
      typeof history.portfolioSummary?.totalProfitRate === "number"
        ? history.portfolioSummary.totalProfitRate
        : null,

    aiFundTradeStatus: history.aiFundTradeResult?.status || "",
    aiFundTradeMessage: history.aiFundTradeResult?.message || "",
    aiFundOrderCount: aiOrders,
    aiPositionCount: Number(history.aiPortfolioSummary?.positionCount || 0),
    aiTotalAssetAmount: Number(history.aiPortfolioSummary?.totalAssetAmount || 0),
    aiTotalProfitRate:
      typeof history.aiPortfolioSummary?.totalProfitRate === "number"
        ? history.aiPortfolioSummary.totalProfitRate
        : null,

    totalOrderCount,
  };
}

async function checkAndRun(options?: { allowRerunToday?: boolean }) {
  const now = getKstNow();
  const today = formatKstDate(now);
  const state = readJsonFile<AutoRunState>(STATE_PATH, {});
  const allowRerunToday = Boolean(options?.allowRerunToday);

  if (!isWeekday(now)) {
    const nextState = {
      ...state,
      lastStatus: "MARKET_CLOSED",
      lastMessage: "주말은 자동 운용을 실행하지 않습니다.",
    };
    writeState(nextState);
    return { ok: true, ran: false, status: "MARKET_CLOSED", today, state: nextState, ...getRunMeta() };
  }

  if (!isAfterRunTime(now)) {
    const nextState = {
      ...state,
      lastStatus: "WAIT_RUN_TIME",
      lastMessage: "오전 8시 40분 이후 와바바펀드와 와바바AI펀드가 함께 자동 실행됩니다.",
    };
    writeState(nextState);
    return { ok: true, ran: false, status: "WAIT_RUN_TIME", today, state: nextState, ...getRunMeta() };
  }

  if (!allowRerunToday && state.lastRunDate === today && state.lastStatus === "DONE") {
    return {
      ok: true,
      ran: false,
      status: "ALREADY_DONE",
      today,
      message: "오늘 자동운용은 이미 실행되었습니다. 와바바펀드와 와바바AI펀드 모두 추가 매매하지 않습니다.",
      state,
      ...getRunMeta(),
    };
  }

  try {
    await runDailyBuild();
    const meta = getRunMeta();
    const nextState: AutoRunState = {
      lastRunDate: today,
      lastRunAt: formatKstDateTime(now),
      lastStatus: "DONE",
      lastMessage:
        meta.totalOrderCount > 0
          ? `자동운용 실행 완료 · 전체 체결 ${meta.totalOrderCount}건`
          : "자동운용 확인 완료 · 신규 체결 없음",
    };
    writeState(nextState);
    return { ok: true, ran: true, status: "DONE", today, state: nextState, ...meta };
  } catch (error) {
    const err = error as { message?: string; stderr?: string };
    const raw = err.stderr?.trim() || err.message || "자동 실행 실패";
    const message = raw.length > 500 ? raw.slice(-500) : raw;
    const nextState: AutoRunState = {
      ...state,
      lastStatus: "ERROR",
      lastRunAt: formatKstDateTime(now),
      lastMessage: message,
    };
    writeState(nextState);
    return { ok: false, ran: false, status: "ERROR", today, message, state: nextState, ...getRunMeta() };
  }
}

export async function GET() {
  return NextResponse.json(await checkAndRun({ allowRerunToday: false }));
}

export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("mode") || "safe";

  if (mode === "rerun-today") {
    return NextResponse.json(await checkAndRun({ allowRerunToday: true }));
  }

  return NextResponse.json(await checkAndRun({ allowRerunToday: false }));
}
