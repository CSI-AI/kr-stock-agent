import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const DATA_ROOT = "C:\\work\\kr-stock-agent-data-new";
const REVIEWED_FILE_PATH = path.join(DATA_ROOT, "reviewed-candidates.json");

type ReviewedCandidate = {
  code: string;
  name: string;
  type: string;
  reviewedAt: string;
};

type ReviewedPayload = {
  reviewedCodes?: string[];
  reviewedItems?: ReviewedCandidate[];
};

function normalizeText(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

async function readReviewedPayload(): Promise<ReviewedPayload> {
  try {
    const raw = await fs.readFile(REVIEWED_FILE_PATH, "utf-8");
    const parsed = JSON.parse(raw);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    return parsed as ReviewedPayload;
  } catch {
    return {};
  }
}

async function writeReviewedPayload(payload: ReviewedPayload) {
  await fs.mkdir(DATA_ROOT, { recursive: true });
  await fs.writeFile(
    REVIEWED_FILE_PATH,
    JSON.stringify(payload, null, 2),
    "utf-8",
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const code = normalizeText(body?.code);
    const name = normalizeText(body?.name);
    const type = normalizeText(body?.type);

    if (!code) {
      return NextResponse.json(
        {
          ok: false,
          message: "종목코드가 없습니다.",
        },
        { status: 400 },
      );
    }

    const current = await readReviewedPayload();

    const reviewedCodes = Array.isArray(current.reviewedCodes)
      ? current.reviewedCodes
          .map((value) => normalizeText(value))
          .filter(Boolean)
      : [];

    const reviewedItems = Array.isArray(current.reviewedItems)
      ? current.reviewedItems.filter(
          (item): item is ReviewedCandidate =>
            !!item &&
            typeof item === "object" &&
            typeof item.code === "string",
        )
      : [];

    const nextCodes = Array.from(new Set([...reviewedCodes, code]));

    const filteredItems = reviewedItems.filter((item) => item.code !== code);

    const nextItems: ReviewedCandidate[] = [
      {
        code,
        name,
        type,
        reviewedAt: new Date().toISOString(),
      },
      ...filteredItems,
    ];

    const nextPayload: ReviewedPayload = {
      reviewedCodes: nextCodes,
      reviewedItems: nextItems,
    };

    await writeReviewedPayload(nextPayload);

    return NextResponse.json({
      ok: true,
      code,
      reviewedCount: nextCodes.length,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "검토 완료 저장에 실패했습니다.";

    return NextResponse.json(
      {
        ok: false,
        message,
      },
      { status: 500 },
    );
  }
}
