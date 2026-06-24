import { NextRequest, NextResponse } from "next/server";

const BACKEND = "https://swing-ai-production-342a.up.railway.app";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const res = await fetch(`${BACKEND}/api/analyze`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: text }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
