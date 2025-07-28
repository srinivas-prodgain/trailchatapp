import { UseQueryOptions, UseInfiniteQueryOptions } from "@tanstack/react-query";
import { TApiPromise, TApiSuccess, TApiError, TPaginationResponse } from "./shared";

// Re-export shared API types
export type { TApiPromise, TApiSuccess, TApiError };

export type TQueryOpts<TData = unknown> = Omit<
    UseQueryOptions<TData, Error>,
    'queryKey' | 'queryFn'
>;

export type TInfiniteQueryOpts<TData = unknown> = Omit<
    UseInfiniteQueryOptions<TData, Error>,
    'queryKey' | 'queryFn' | 'getNextPageParam' | 'initialPageParam'
>;
