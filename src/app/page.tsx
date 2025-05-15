"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";

interface City {
  id: number;
  name: string;
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [cities, setCities] = useState<City[]>([]);
  const [loadingCities, setLoadingCities] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [suggestedCity, setSuggestedCity] = useState("");
  const [suggestionSubmitted, setSuggestionSubmitted] = useState(false);
  const router = useRouter();

  const exampleQueries = [
    "What are the city's upcoming infrastructure projects?",
    "Where is the city planning to invest in affordable housing?",
    "Which neighborhoods are getting major redevelopment?",
  ];

  useEffect(() => {
    const fetchCities = async () => {
      setLoadingCities(true);
      try {
        const res = await fetch("/api/fetch-cities");
        const data = await res.json();
        if (data.cities && data.cities.length > 0) {
          setCities(data.cities);
          setSelectedCity(data.cities[0].name);
        } else {
          setError("No cities found.");
        }
      } catch {
        setError("Failed to fetch cities. Please try again later.");
      } finally {
        setLoadingCities(false);
      }
    };
    fetchCities();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);
    try {
      const city = cities.find((c) => c.name === selectedCity);
      if (!city) {
        setSubmitError("Please select a valid city.");
        setSubmitting(false);
        return;
      }
      // 1. Create session
      const res = await fetch("/api/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city_id: city.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.session_id) {
        setSubmitError(data.error || "Failed to create session.");
        setSubmitting(false);
        return;
      }
      // 2. Create message
      const msgRes = await fetch("/api/create-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: data.session_id,
          content: searchQuery,
        }),
      });
      const msgData = await msgRes.json();
      if (!msgRes.ok) {
        setSubmitError(msgData.error || "Failed to create message.");
        setSubmitting(false);
        return;
      }
      // 3. Redirect
      router.push(`/session/${data.session_id}`);
    } catch {
      setSubmitError("An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  function handleCitySuggestion(e: React.FormEvent) {
    e.preventDefault();
    if (!suggestedCity.trim()) return;
    setSuggestionSubmitted(true);
    setSuggestedCity("");
    setTimeout(() => setSuggestionSubmitted(false), 2000);
  }

  function toCamelCase(str: string) {
    return str.replace(
      /\w\S*/g,
      (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  }

  return (
    <MainLayout>
      <div className="flex flex-col min-h-screen p-8">
        {/* Search section */}
        <div className="flex-1 max-w-2xl mx-auto" style={{ flexBasis: "90%" }}>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Ask a question about ${
                  selectedCity ? toCamelCase(selectedCity) : "the city"
                }...`}
                className="flex-1 p-3 border-2 border-brand-primary/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary bg-white shadow-sm placeholder:text-brand-primary/50"
              />
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="p-3 border-2 border-brand-primary/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary bg-white shadow-sm min-w-[140px]"
                disabled={loadingCities}
              >
                {loadingCities ? (
                  <option>Loading...</option>
                ) : (
                  cities.map((city) => (
                    <option key={city.id} value={city.name}>
                      {toCamelCase(city.name)}
                    </option>
                  ))
                )}
              </select>
              <button
                type="submit"
                className="px-6 py-3 bg-brand-primary border-2 border-brand-primary/30 rounded-lg shadow-md hover:shadow-lg hover:bg-brand-primary/90 focus:outline-none focus:ring-2 focus:ring-brand-secondary transition-colors font-semibold text-lg"
                disabled={
                  submitting ||
                  loadingCities ||
                  !selectedCity ||
                  !searchQuery.trim()
                }
              >
                {submitting ? "Searching..." : "Search"}
              </button>
            </div>
          </form>

          {/* Example queries */}
          <div className="mt-8 space-y-2">
            <p className="text-sm text-brand-primary/70">Try asking:</p>
            {exampleQueries.map((query, index) => (
              <button
                key={index}
                onClick={() => setSearchQuery(query)}
                className="block w-full text-left p-2 text-sm text-brand-primary hover:bg-brand-secondary/10 rounded transition-colors"
              >
                {query}
              </button>
            ))}
          </div>

          {error && (
            <div className="mt-4 text-red-600 text-sm text-center">{error}</div>
          )}

          {submitError && (
            <div className="mt-4 text-red-600 text-sm text-center">
              {submitError}
            </div>
          )}
        </div>

        {/* City Suggestion Section - Always at bottom */}
        <div className="pt-4 mt-auto">
          <form onSubmit={handleCitySuggestion} className="max-w-2xl mx-auto">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={suggestedCity}
                onChange={(e) => setSuggestedCity(e.target.value)}
                placeholder="Don't see your city? Let us know..."
                className="flex-1 p-2 text-sm border border-brand-primary/20 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-secondary bg-white shadow-sm placeholder:text-brand-primary/50"
                disabled={suggestionSubmitted}
              />
              <button
                type="submit"
                className="px-4 py-2 text-sm bg-brand-secondary/80 hover:bg-brand-secondary border border-brand-secondary/30 rounded-lg shadow-sm hover:shadow focus:outline-none focus:ring-1 focus:ring-brand-secondary transition-colors"
                disabled={!suggestedCity.trim() || suggestionSubmitted}
              >
                Suggest
              </button>
            </div>
            <div
              style={{ minHeight: "1.5em" }}
              className="mt-2 text-xs text-left"
            >
              {suggestionSubmitted ? (
                <span className="text-green-600">
                  Thanks for the suggestion. Added!
                </span>
              ) : null}
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
}
