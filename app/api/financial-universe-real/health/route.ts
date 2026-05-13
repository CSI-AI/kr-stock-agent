import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    source: "GitHub Raw",
    status: "connected",
    message: "external data pipeline active",
    timestamp: new Date().toISOString(),
  });
}