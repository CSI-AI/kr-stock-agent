import { NextResponse } from "next/server";
import { refreshRealFinancialUniverseSnapshot } from "@/lib/data/refresh-real-financial-universe-snapshot";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function handleRefresh() {
  try {
    const result = await refreshRealFinancialUniverseSnapshot();

    return NextResponse.json(
      {
        ok: true,
        ...result,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("[api/financial-universe-real/refresh] failed", error);

    const message =
      error instanceof Error && error.message.trim().length > 0
        ? error.message
        : "real snapshot refresh 중 오류가 발생했습니다.";

    return NextResponse.json(
      {
        ok: false,
        message,
      },
      {
        status: 500,
      }
    );
  }
}

export async function GET() {
  return handleRefresh();
}

export async function POST() {
  return handleRefresh();
}