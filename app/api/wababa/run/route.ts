import { execFile } from "child_process";
import { NextResponse } from "next/server";
import path from "path";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

const DATA_ROOT = "C:\\work\\kr-stock-agent-data-new";
const SCRIPT_PATH = path.join(DATA_ROOT, "scripts", "build_recommendation_history.py");

type RunResult = {
  ok: boolean;
  message: string;
  stdout?: string;
  stderr?: string;
};

export async function POST() {
  try {
    const result = await execFileAsync("python", [SCRIPT_PATH], {
      cwd: DATA_ROOT,
      windowsHide: true,
      timeout: 1000 * 60 * 10,
      maxBuffer: 1024 * 1024 * 10,
    });

    const response: RunResult = {
      ok: true,
      message: "와바바 재계산이 완료되었습니다.",
      stdout: result.stdout,
      stderr: result.stderr,
    };

    return NextResponse.json(response);
  } catch (error) {
    const err = error as {
      message?: string;
      stdout?: string;
      stderr?: string;
    };

    const response: RunResult = {
      ok: false,
      message: err.message || "와바바 재계산 중 오류가 발생했습니다.",
      stdout: err.stdout,
      stderr: err.stderr,
    };

    return NextResponse.json(response, { status: 500 });
  }
}
