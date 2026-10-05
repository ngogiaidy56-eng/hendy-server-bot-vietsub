import { useState, useEffect, useCallback } from "react";

export function useEdgeRealtime(endpoint = "/api/state") {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const res = await fetch(endpoint);
    const data = await res.json();
    setState(data);
    setLoading(false);
  }, [endpoint]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { state, loading, refresh };
}
