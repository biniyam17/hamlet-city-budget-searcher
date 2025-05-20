"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface MainLayoutProps {
  children: React.ReactNode;
}

interface SessionListItem {
  id: number;
  city_name: string;
  session_number: number;
}

function toCamelCase(str: string) {
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
}

function groupSessionsByDate(
  sessions: (SessionListItem & { started_at: string })[]
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const lastWeek = new Date(today);
  lastWeek.setDate(today.getDate() - 7);

  const groups: Record<string, (SessionListItem & { started_at: string })[]> = {
    Today: [],
    Yesterday: [],
    "Last Week": [],
  };

  sessions.forEach((session) => {
    const sessionDate = new Date(session.started_at);
    sessionDate.setHours(0, 0, 0, 0);
    if (sessionDate.getTime() >= today.getTime()) {
      groups["Today"].push(session);
    } else if (sessionDate.getTime() === yesterday.getTime()) {
      groups["Yesterday"].push(session);
    } else if (sessionDate > lastWeek && sessionDate < yesterday) {
      groups["Last Week"].push(session);
    }
  });
  return groups;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const [sessions, setSessions] = useState<
    (SessionListItem & { started_at: string })[]
  >([]);

  useEffect(() => {
    async function fetchSessions() {
      try {
        const res = await fetch("/api/list-sessions");
        const data = await res.json();
        // Assume backend will add started_at to each session
        setSessions(data.sessions || []);
      } catch {
        setSessions([]);
      }
    }
    fetchSessions();
  }, []);

  const grouped = groupSessionsByDate(sessions);

  return (
    <div className="min-h-screen bg-brand-background flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-brand-primary/10 flex flex-col h-screen sticky top-0">
        {/* Logo */}
        <Link
          href="/"
          className="p-4 border-b border-brand-primary/10 flex-shrink-0 flex items-center gap-3"
        >
          <Image
            src="/hamlet_logo_dark.svg"
            alt="Hamlet Logo"
            width={48}
            height={48}
            className="hover:opacity-80 transition-opacity"
            priority
          />
          <div className="flex flex-col">
            <span className="text-lg font-semibold text-brand-primary">
              City Searcher
            </span>
            <span className="text-xs text-gray-500">by Hamlet</span>
          </div>
        </Link>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto px-2 py-4">
          <div className="text-xs text-gray-400 px-2 mb-2">Sessions</div>
          {sessions.length === 0 ? (
            <div className="text-sm text-gray-400 px-2">No sessions</div>
          ) : (
            <div className="space-y-4">
              {Object.entries(grouped).map(([group, groupSessions]) =>
                groupSessions.length > 0 ? (
                  <div key={group}>
                    <div className="text-xs text-gray-400 px-2 mb-1">
                      {group}
                    </div>
                    <ul className="space-y-1">
                      {groupSessions.map((session) => {
                        const sessionPath = `/session/${session.id}`;
                        const isActive = pathname === sessionPath;
                        return (
                          <li key={session.id}>
                            <Link
                              href={sessionPath}
                              className={`block truncate px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                                isActive
                                  ? "bg-brand-primary/10 text-brand-primary font-semibold"
                                  : "hover:bg-brand-primary/5 text-gray-700"
                              }`}
                              title={`${toCamelCase(
                                session.city_name
                              )} - Session ${session.session_number}`}
                            >
                              {toCamelCase(session.city_name)} - Session{" "}
                              {session.session_number}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ) : null
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-y-auto h-screen">
        {children}
      </div>
    </div>
  );
}
