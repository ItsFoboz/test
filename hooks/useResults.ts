"use client";

import { useState, useEffect, useCallback } from "react";
import type { MatchResult, ResultsPayload } from "@/app/api/results/route";

export type { MatchResult };

const POLL_INTERVAL = 2 * 60 * 1000; // 2 minutes

export interface UseResultsReturn {
  results: Record<string, Record<string, MatchResult>>; // groupId → bracketMatchId → result
  fetchedAt: string | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useResults(): UseResultsReturn {
  const [payload, setPayload] = useState<ResultsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch_ = useCallback(async () => {
    try {
      const res = await fetch("/api/results");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ResultsPayload = await res.json();
      setPayload(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch results");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch_();
    const id = setInterval(fetch_, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetch_]);

  // Reshape into a nested map for easy lookup
  const results: Record<string, Record<string, MatchResult>> = {};
  if (payload?.matches) {
    for (const m of payload.matches) {
      if (!results[m.groupId]) results[m.groupId] = {};
      results[m.groupId][m.bracketMatchId] = m;
    }
  }

  return { results, fetchedAt: payload?.fetchedAt ?? null, loading, error, refresh: fetch_ };
}
