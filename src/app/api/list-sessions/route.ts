import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabaseClient";

interface City {
  name: string;
}

interface Session {
  id: number;
  city_id: number;
  started_at: string;
  cities: City;
}

export async function GET() {
  // Fetch sessions joined with city name, ordered by started_at
  const { data: sessions, error } = await supabase
    .from("sessions")
    .select("id, city_id, started_at, cities(name)")
    .order("started_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Map sessions to include session number as the ID
  const result = (sessions as unknown as Session[]).map((session) => ({
    id: session.id,
    city_name: session.cities.name,
    session_number: session.id, // Use session ID directly as session number
    started_at: session.started_at,
  }));

  // Sort by most recent (descending started_at)
  result.sort((a, b) => b.id - a.id);

  return NextResponse.json({ sessions: result });
}
