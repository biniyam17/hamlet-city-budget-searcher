import { NextResponse } from "next/server";
import { supabase } from "@/utils/supabaseClient";
import { callExternalSearchApi } from "@/services/externalApiService";

export async function POST(req: Request) {
  try {
    const { session_id, content } = await req.json();
    if (!session_id || !content) {
      return NextResponse.json(
        { error: "session_id and content are required" },
        { status: 400 }
      );
    }

    // Create the user message
    const { data: message, error } = await supabase
      .from("messages")
      .insert({
        session_id,
        content,
        message_type: "user",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get the session's city to fetch docset_id
    const { data: session, error: sessionError } = await supabase
      .from("sessions")
      .select("city_id")
      .eq("id", session_id)
      .single();

    if (sessionError) {
      return NextResponse.json(
        { error: sessionError.message },
        { status: 500 }
      );
    }

    // Get the city's docset_id
    const { data: city, error: cityError } = await supabase
      .from("cities")
      .select("docset_id")
      .eq("id", session.city_id)
      .single();

    if (cityError) {
      return NextResponse.json({ error: cityError.message }, { status: 500 });
    }

    // Create pending service response record
    const { error: serviceResponseError } = await supabase
      .from("service_responses")
      .insert({
        session_id,
        query_text: content,
        status: "pending",
        created_at: new Date().toISOString(),
        metadata: {
          docset_id: city.docset_id,
        },
      });

    if (serviceResponseError) {
      return NextResponse.json(
        { error: serviceResponseError.message },
        { status: 500 }
      );
    }

    // Call external search API asynchronously
    callExternalSearchApi(city.docset_id, content, session_id);

    return NextResponse.json({ message });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Unknown error" },
      { status: 500 }
    );
  }
}
