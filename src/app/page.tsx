"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import Link from "next/link";

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

  const enabledCities = ["spokane", "tulsa", "honolulu"];

  useEffect(() => {
    const fetchCities = async () => {
      setLoadingCities(true);
      try {
        const res = await fetch("/api/fetch-cities");
        const data = await res.json();
        if (data.cities && data.cities.length > 0) {
          setCities(data.cities);
          const firstEnabledCity = data.cities.find((city: City) =>
            enabledCities.includes(city.name.toLowerCase())
          );
          setSelectedCity(firstEnabledCity?.name || data.cities[0].name);
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
        <div
          className="flex-1 w-full max-w-3xl mx-auto"
          style={{ flexBasis: "90%" }}
        >
          {/* Navigation */}
          <div className="flex justify-end mb-8">
            <Link
              href="/insights"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white text-brand-primary rounded-lg border-2 border-brand-primary/20 hover:bg-brand-primary/5 transition-colors shadow-sm"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
              View Insights
            </Link>
          </div>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-2 h-12">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Ask a question about ${
                  selectedCity ? toCamelCase(selectedCity) : "the city"
                }...`}
                className="flex-1 h-full p-3 border-2 border-brand-primary/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-secondary bg-white shadow-sm placeholder:text-brand-primary/50 text-base"
              />
              <div className="relative inline-block h-full">
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  disabled={loadingCities}
                  className="appearance-none pr-8 p-3 h-full border-2 border-brand-primary/30 rounded-lg bg-white shadow-sm min-w-[140px] focus:outline-none focus:ring-2 focus:ring-brand-secondary text-base"
                >
                  {loadingCities ? (
                    <option>Loading…</option>
                  ) : (
                    [...cities]
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((c) => {
                        const isEnabled = enabledCities.includes(
                          c.name.toLowerCase()
                        );
                        return (
                          <option
                            key={c.id}
                            value={c.name}
                            disabled={!isEnabled}
                            className={!isEnabled ? "text-gray-400" : ""}
                          >
                            {toCamelCase(c.name)}
                            {!isEnabled && " (Coming Soon)"}
                          </option>
                        );
                      })
                  )}
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-brand-primary/70 text-xs leading-none">
                  ▼
                </span>
              </div>

              <button
                type="submit"
                className="px-6 py-3 h-full bg-brand-primary border-2 border-brand-primary/30 rounded-lg shadow-md hover:shadow-lg hover:bg-brand-primary/90 focus:outline-none focus:ring-2 focus:ring-brand-secondary transition-colors font-semibold text-lg flex items-center justify-center"
                disabled={
                  submitting ||
                  loadingCities ||
                  !selectedCity ||
                  !searchQuery.trim() ||
                  !enabledCities.includes(selectedCity.toLowerCase())
                }
              >
                {submitting ? "Searching..." : "Search"}
              </button>
            </div>
          </form>

          {/* Example queries */}
          <div className="mt-8 space-y-2 p-4 bg-brand-secondary/5 rounded-lg border border-brand-primary/10">
            <p className="text-sm text-brand-primary/70 font-medium">
              Try asking:
            </p>
            {exampleQueries.map((query, index) => (
              <button
                key={index}
                onClick={() => setSearchQuery(query)}
                className="block w-full text-left p-2 text-sm text-brand-primary hover:bg-brand-secondary/10 hover:underline decoration-brand-primary/30 rounded transition-colors"
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
        <div className="pt-4 mt-auto w-full max-w-3xl mx-auto">
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
