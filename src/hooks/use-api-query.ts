import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export function useApiQuery<T>(key: string[], endpoint: string, enabled = true) {
  return useQuery<T>({
    queryKey: key,
    queryFn: () => apiFetch<T>(endpoint),
    enabled,
    retry: 1,
  });
}
