import { NextResponse } from "next/server";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DATA_ROOT = "C:\\work\\kr-stock-agent-data-new";

function loadEnvFile(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) return {};

  const raw = fs.readFileSync(filePath, "utf-8");
  const result: Record<string, string> = {};

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) continue;

    const equalIndex = trimmed.indexOf("=");
    if (equalIndex < 0) continue;

    const key = trimmed.slice(0, equalIndex).trim();
    const value = trimmed
      .slice(equalIndex + 1)
      .trim()
      .replace(/^["']|["']$/g, "");

    if (key) result[key] = value;
  }

  return result;
}

function buildPythonEnv() {
  return {
    ...process.env,
    ...loadEnvFile(path.join(DATA_ROOT, ".env")),
    ...loadEnvFile(path.join(DATA_ROOT, ".env.local")),
    PYTHONUTF8: "1",
    PYTHONIOENCODING: "utf-8",
  };
}

function cleanMessage(text: string) {
  const value = text.trim();

  if (!value) return "";

  return value.slice(-2500);
}

function runPython(scriptName: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn("python", [`scripts\\${scriptName}`], {
      cwd: DATA_ROOT,
      env: buildPythonEnv(),
      shell: false,
      windowsHide: true,
    });

    let output = "";
    let errorOutput = "";

    child.stdout.on("data", (data) => {
      output += data.toString("utf-8");
    });

    child.stderr.on("data", (data) => {
      errorOutput += data.toString("utf-8");
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve(output);
        return;
      }

      reject(
        new Error(
          cleanMessage(errorOutput) ||
            cleanMessage(output) ||
            `Python 실행 실패: ${code}`
        )
      );
    });
  });
}

export async function POST() {
  try {
    const output = await runPython("build_recommendation_history.py");

    return NextResponse.json({
      ok: true,
      message: "와바바 빠른 재계산 완료",
      output,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "빠른 재계산 실패",
      },
      { status: 500 }
    );
  }
}