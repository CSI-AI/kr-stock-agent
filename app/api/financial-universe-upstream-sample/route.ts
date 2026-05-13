import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SAMPLE_FILE_PATH = path.join(
  process.cwd(),
  "data",
  "financial-universe-upstream-sample.json"
);

export async function GET() {
  try {
    const raw = await fs.readFile(SAMPLE_FILE_PATH, "utf-8");
    const parsed = JSON.parse(raw) as unknown;

    return NextResponse.json(parsed, {
      status: 200,
    });
  } catch (error) {
    console.error("[api/financial-universe-upstream-sample] failed", error);

    const message =
      error instanceof Error && error.message.trim().length > 0
        ? error.message
        : "upstream sample 파일을 읽지 못했습니다.";

    return NextResponse.json(
      {
        ok: false,
        message,
        filePath: SAMPLE_FILE_PATH,
      },
      {
        status: 500,
      }
    );
  }
}