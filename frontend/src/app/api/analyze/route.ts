import { NextRequest, NextResponse } from "next/server";

const BACKEND = "https://swing-ai-production-342a.up.railway.app";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const res = await fetch(`${BACKEND}/api/analyze`, {
    method: "POST",
    body: formData,
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
