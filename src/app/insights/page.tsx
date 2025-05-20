"use client";
import MainLayout from "@/components/layout/MainLayout";
import Link from "next/link";
import { useEffect } from "react";
import BackButton from "@/components/BackButton";

interface InsightCard {
  graphIds: string[];
}

const insights: InsightCard[] = [
  {
    graphIds: ["fbRcz"],
  },
  {
    graphIds: ["Dunzl"],
  },
  {
    graphIds: ["UKdYj"],
  },
  {
    graphIds: ["rsvrf"],
  },
];

export default function Insights() {
  useEffect(() => {
    // Load Datawrapper scripts
    insights.forEach((insight) => {
      insight.graphIds.forEach((graphId) => {
        const script = document.createElement("script");
        script.src = `https://datawrapper.dwcdn.net/${graphId}/embed.js`;
        script.defer = true;
        script.charset = "utf-8";
        script.setAttribute("data-target", `#datawrapper-vis-${graphId}`);
        document.body.appendChild(script);
      });
    });

    // Cleanup function
    return () => {
      // Remove scripts when component unmounts
      document
        .querySelectorAll('script[src*="datawrapper.dwcdn.net"]')
        .forEach((script) => {
          script.remove();
        });
    };
  }, []); // Empty dependency array means this runs once on mount

  return (
    <MainLayout>
      <div className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-brand-primary">Insights</h1>
            <BackButton />
          </div>

          {/* Insights Grid */}
          <div className="grid grid-cols-1 gap-8 mb-24">
            {insights.map((insight, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-sm border border-brand-primary/10 overflow-hidden mb-8 last:mb-12"
              >
                <div className="p-6 pb-8">
                  {insight.graphIds.length > 0 ? (
                    <div className="space-y-12">
                      {insight.graphIds.map((graphId) => (
                        <div
                          key={graphId}
                          className="min-h-[400px] bg-gray-50 rounded-lg"
                          id={`datawrapper-vis-${graphId}`}
                        >
                          <noscript>
                            <img
                              src={`https://datawrapper.dwcdn.net/${graphId}/full.png`}
                              alt="Data visualization"
                            />
                          </noscript>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="min-h-[400px] bg-gray-50 rounded-lg flex items-center justify-center">
                      <p className="text-gray-400">Visualization coming soon</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
