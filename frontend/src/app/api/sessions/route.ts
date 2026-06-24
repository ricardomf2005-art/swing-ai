import { NextRequest, NextResponse } from "next/server";

const BACKEND = "https://swing-ai-production-342a.up.railway.app";

export async function GET() {
  const res = await fetch(`${BACKEND}/api/sessions`);
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
