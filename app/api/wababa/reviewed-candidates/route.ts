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

function normalizeReviewedItems(payload: ReviewedPayload): ReviewedCandidate[] {
  if (!Array.isArray(payload.reviewedItems)) {
    return [];
  }

  return payload.reviewedItems.filter(
    (item): item is ReviewedCandidate =>
      !!item &&
      typeof item === "object" &&
      typeof item.code === "string" &&
      item.code.trim().length > 0,
  );
}

export async function GET() {
  const payload = await readReviewedPayload();
  const reviewedItems = normalizeReviewedItems(payload);

  const reviewedCodes = Array.isArray(payload.reviewedCodes)
    ? payload.reviewedCodes.map((value) => normalizeText(value)).filter(Boolean)
    : reviewedItems.map((item) => item.code);

  return NextResponse.json({
    ok: true,
    reviewedCodes,
    reviewedItems,
    reviewedCount: reviewedCodes.length,
  });
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const code = normalizeText(body?.code);

    if (!code) {
      await writeReviewedPayload({
        reviewedCodes: [],
        reviewedItems: [],
      });

      return NextResponse.json({
        ok: true,
        mode: "all",
        reviewedCount: 0,
      });
    }

    const current = await readReviewedPayload();
    const reviewedItems = normalizeReviewedItems(current);

    const nextItems = reviewedItems.filter((item) => item.code !== code);
    const nextCodes = nextItems.map((item) => item.code);

    await writeReviewedPayload({
      reviewedCodes: nextCodes,
      reviewedItems: nextItems,
    });

    return NextResponse.json({
      ok: true,
      mode: "one",
      code,
      reviewedCount: nextCodes.length,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "넘긴 종목 초기화에 실패했습니다.";

    return NextResponse.json(
      {
        ok: false,
        message,
      },
      { status: 500 },
    );
  }
}
