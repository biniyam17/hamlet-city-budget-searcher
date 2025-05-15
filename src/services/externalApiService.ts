interface SearchRequest {
  docset_id: string;
  query: string;
  session_id: number;
}

interface SearchResponse {
  query_id: string;
  result: string;
}

const API_BASE = process.env.FLASK_SERVER_URL!;

/**
 * Makes a request to the external search API
 * @param docsetId - The docset ID from the cities table
 * @param query - The user's search query
 * @param sessionId - The current session ID
 * @returns Promise with the search response
 */
export async function callExternalSearchApi(
  docsetId: string,
  query: string,
  sessionId: number
): Promise<SearchResponse> {
  try {
    const response = await fetch(`${API_BASE}/api/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        docset_id: docsetId,
        query,
        session_id: sessionId,
      } as SearchRequest),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error calling external search API:", error);
    throw error;
  }
}
