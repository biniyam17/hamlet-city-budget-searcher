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
    .from("messages")
    .select("id, session_id, created_at, message_type, content")
    .eq("session_id", session_id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ messages: data });
}
