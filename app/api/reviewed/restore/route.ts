import fs from "fs";

export const dynamic = "force-dynamic";

const DATA_PATH = "C:\\work\\kr-stock-agent-data-new\\reviewed-candidates.json";

type ReviewedData = {
  reviewedCodes?: unknown[];
  reviewedItems?: unknown[];
  updatedAt?: string;
};

function readData(): ReviewedData {
  try {
    const parsed = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as ReviewedData;
    }
  } catch {}

  return {};
}

function writeData(data: ReviewedData) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
}

function getCodeFromItem(item: unknown): string {
  if (!item || typeof item !== "object") return "";
  const code = (item as Record<string, unknown>).code;
  return typeof code === "string" ? code.trim() : "";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const code = typeof body?.code === "string" ? body.code.trim() : "";

    if (!code) {
      return Response.json({ ok: false, message: "code가 없습니다." }, { status: 400 });
    }

    const data = readData();

    data.reviewedCodes = Array.isArray(data.reviewedCodes)
      ? data.reviewedCodes.filter((value) => value !== code)
      : [];

    data.reviewedItems = Array.isArray(data.reviewedItems)
      ? data.reviewedItems.filter((item) => getCodeFromItem(item) !== code)
      : [];

    data.updatedAt = new Date().toISOString();

    writeData(data);

    return Response.json({ ok: true, code });
  } catch (error) {
    return Response.json(
      { ok: false, message: error instanceof Error ? error.message : "unknown error" },
      { status: 500 },
    );
  }
}
