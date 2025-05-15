import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabaseClient";

export async function POST(req: Request) {
  try {
    const { city_id } = await req.json();
    if (!city_id) {
      return NextResponse.json(
        { error: "city_id is required" },
        { status: 400 }
      );
    }

    // Create session only
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .insert({ city_id, started_at: new Date().toISOString() })
      .select()
      .single();
    if (sessionError || !session) {
      return NextResponse.json(
        { error: sessionError?.message || "Failed to create session" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { status: "ok", session_id: session.id },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Unknown error" },
      { status: 500 }
    );
  }
}
