import { NextRequest, NextResponse } from "next/server";

const BACKEND = "https://swing-ai-production-342a.up.railway.app";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const res = await fetch(`${BACKEND}/api/sessions/${params.id}`);
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const res = await fetch(`${BACKEND}/api/sessions/${params.id}`, { method: "DELETE" });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
