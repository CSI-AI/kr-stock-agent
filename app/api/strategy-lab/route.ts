import { NextResponse } from "next/server";
import { runStrategyEngine } from "@/lib/strategy/strategy-engine";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const result = await runStrategyEngine();

    return NextResponse.json(
      {
        ok: true,
        result,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("[api/strategy-lab] failed to run strategy engine", error);

    const message =
      error instanceof Error && error.message.trim().length > 0
        ? error.message
        : "전략 엔진 실행 중 알 수 없는 오류가 발생했습니다.";

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