import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabaseClient";

export async function GET() {
  const { data, error } = await supabase.from("cities").select("id, name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ cities: data });
}
