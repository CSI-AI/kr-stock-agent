import { execFile } from "child_process";
import path from "path";
import { promisify } from "util";
import { NextResponse } from "next/server";

const execFileAsync = promisify(execFile);

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DATA_ROOT_DIR = "C:\\work\\kr-stock-agent-data-new";
const REFRESH_SCRIPT_PATH = path.join(
  DATA_ROOT_DIR,
  "scripts",
  "refresh_portfolio_prices.py",
);

export async function POST() {
  const startedAt = new Date().toISOString();

  try {
    const { stdout, stderr } = await execFileAsync(
      "python",
      [REFRESH_SCRIPT_PATH],
      {
        cwd: DATA_ROOT_DIR,
        windowsHide: true,
        timeout: 1000 * 60 * 5,
        maxBuffer: 1024 * 1024 * 10,
      },
    );

    // stdout 마지막 줄에서 JSON 결과 추출
    const lines = (stdout || "").split(/\r?\n/).filter(Boolean);
    let result: Record<string, unknown> | null = null;
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      if (line.startsWith("{")) {
        try {
          result = JSON.parse(line) as Record<string, unknown>;
          break;
        } catch {
          // 파싱 실패 시 다음 줄 시도
        }
      }
    }

    if (result && !result.ok) {
      return NextResponse.json(
        {
          ok: false,
          startedAt,
          error: result.error ?? "스크립트 실패",
          stdout: stdout.slice(-2000),
          stderr: (stderr ?? "").slice(-500),
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      startedAt,
      ...(result ?? {}),
      stdout: stdout.slice(-2000),
      stderr: (stderr ?? "").slice(-500),
    });
  } catch (error) {
    const err = error as { message?: string; stderr?: string; code?: string };
    const message = err.message ?? "실행 오류";
    const stderrText = (err.stderr ?? "").slice(-1000);
    return NextResponse.json(
      {
        ok: false,
        startedAt,
        error: message.slice(-500),
        stderr: stderrText,
      },
      { status: 500 },
    );
  }
}
