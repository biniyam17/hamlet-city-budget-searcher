import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabaseClient";

export async function GET() {
  // Fetch sessions joined with city name, ordered by started_at
  const { data: sessions, error } = await supabase
    .from("sessions")
    .select("id, city_id, started_at, cities(name)")
    .order("started_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Compute session number per city
  const citySessionCounts: Record<number, number> = {};
  const result = sessions.map((session: any) => {
    const cityId = session.city_id;
    if (!citySessionCounts[cityId]) citySessionCounts[cityId] = 1;
    else citySessionCounts[cityId] += 1;
    return {
      id: session.id,
      city_name: session.cities.name,
      session_number: citySessionCounts[cityId],
      started_at: session.started_at,
    };
  });

  // Sort by most recent (descending started_at)
  result.sort((a, b) => b.id - a.id);

  return NextResponse.json({ sessions: result });
}
