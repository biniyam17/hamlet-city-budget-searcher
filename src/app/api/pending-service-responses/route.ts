import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabaseClient";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const session_id = searchParams.get("session_id");

  if (!session_id) {
    return NextResponse.json(
      { error: "session_id is required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("service_responses")
    .select("id")
    .eq("session_id", session_id)
    .eq("status", "pending");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ pending: data && data.length > 0 });
}
