import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TradeInput as BackendTradeInput } from "../backend";
import type { Analytics, Trade, TradeInput } from "../backend.d";
import { useActor } from "./useActor";

// ---- Trades ----

export function useGetTrades() {
  const { actor, isFetching } = useActor();
  return useQuery<Trade[]>({
    queryKey: ["trades"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTrades();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetTradeById(id: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Trade | null>({
    queryKey: ["trade", id],
    queryFn: async () => {
      if (!actor || !id) return null;
      return actor.getTradeById(id);
    },
    enabled: !!actor && !isFetching && !!id,
  });
}

export function useGetAnalytics() {
  const { actor, isFetching } = useActor();
  return useQuery<Analytics>({
    queryKey: ["analytics"],
    queryFn: async () => {
      if (!actor) {
        return {
          totalTrades: 0n,
          wins: 0n,
          losses: 0n,
          breakEvens: 0n,
          winRate: 0,
          avgRR: 0,
          avgRMultiple: 0,
          totalNetR: 0,
          profitFactor: 0,
          expectancy: 0,
          followedRulesPercent: 0,
          exitedEarlyPercent: 0,
          movedStopLossPercent: 0,
        } as Analytics;
      }
      return actor.getAnalytics();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetUniqueTags() {
  const { actor, isFetching } = useActor();
  return useQuery<string[]>({
    queryKey: ["tags"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getUniqueTags();
    },
    enabled: !!actor && !isFetching,
  });
}

// ---- Mutations ----

export function useCreateTrade() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: TradeInput) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.createTrade(input as unknown as BackendTradeInput);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });
}

export function useUpdateTrade() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: TradeInput }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.updateTrade(id, input as unknown as BackendTradeInput);
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      queryClient.invalidateQueries({ queryKey: ["trade", vars.id] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });
}

export function useDeleteTrade() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.deleteTrade(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });
}
