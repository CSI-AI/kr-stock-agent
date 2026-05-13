import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const FILE_PATH = path.join(
  process.cwd(),
  "data",
  "financial-universe-real.json"
);

export async function GET() {
  try {
    const file = await fs.readFile(FILE_PATH, "utf-8");
    const json = JSON.parse(file);

    return NextResponse.json({
      ok: true,
      source: "snapshot",
      items: json.items || [],
      meta: json.meta || {},
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "snapshot read failed",
      },
      { status: 500 }
    );
  }
}