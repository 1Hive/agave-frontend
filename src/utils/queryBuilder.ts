import { useQuery, UseQueryOptions } from "react-query";
import { useWeb3React } from "@web3-react/core";
import { Web3Provider } from "@ethersproject/providers";
import { ErrorCode } from "@ethersproject/logger";
import React from "react";
import { ChainAddresses } from "./contracts/contractAddresses/internalAddresses";
import { getChainAddresses } from "./chainAddresses";

export type ChainId = number;
export type Account = string;
export type ContractAddress = string;

export interface QueryHook<
  TData,
  TKey extends readonly unknown[],
  TArgs extends unknown[],
  TResult = TData
> {
  (this: void, ...params: TArgs): QueryHookResult<TResult, TKey>;
  buildKey: (
    this: void,
    chainId: ChainId | undefined,
    address: string | undefined,
    ...args: TArgs
  ) => [ChainId | undefined, string | undefined, ...TKey];
  invoke: (
    this: void,
    hookParams: QueryHookParams<TKey>,
    ...args: TArgs
  ) => Promise<TData | undefined>;
  mapper?: ((input: TData) => TResult) | undefined;
}

export interface QueryHookParams<TKey extends readonly unknown[]> {
  account: string;
  chainId: number;
  library: Web3Provider;
  key: TKey;
}

export interface QueryHookResult<TData, TKey extends readonly unknown[]> {
  data: TData | undefined;
  error: unknown | undefined;
  key: readonly [ChainId | undefined, Account | undefined, ...TKey];
}

export function buildQueryHook<
  TData,
  TKey extends readonly unknown[],
  TArgs extends unknown[],
  TResult = TData
>(
  invoke: (
    this: void,
    hookParams: QueryHookParams<TKey>,
    ...args: TArgs
  ) => Promise<TData | undefined>,
  buildKey: (this: void, ...args: TArgs) => TKey,
  buildInitialData?: ((this: void) => TData | undefined) | undefined,
  optionOverrides?: UseQueryOptions<
    TData | undefined,
    unknown,
    TData,
    readonly [number | undefined, string | undefined, ...TKey]
  >,
  mapper?: ((input: TData) => TResult) | undefined
): QueryHook<TData, TKey, TArgs, TResult> {
  function useBuiltQueryHook(...params: TArgs) {
    const { account, library, chainId } = useWeb3React<Web3Provider>();
    const queryKey = React.useMemo(
      () =>
        [
          chainId ?? undefined,
          account ?? undefined,
          ...buildKey(...params),
        ] as const,
      // eslint-disable-next-line
      [chainId, account, library, ...params]
    );

    const queryOpts: UseQueryOptions<
      TData | undefined,
      unknown,
      TData,
      typeof queryKey
    > = React.useMemo(
      () => ({
        enabled: chainId !== undefined && account !== undefined && library !== undefined,
        initialData: buildInitialData?.(),
        staleTime: optionOverrides?.staleTime ?? 1 * 60 * 1000,
        retry: (failureCount, err) => {
          if (failureCount > 3) {
            return false;
          }
          const code = (err as Error & { code?: ErrorCode }).code;
          if (code !== undefined) {
            switch (code) {
              case ErrorCode.NETWORK_ERROR:
              case ErrorCode.TIMEOUT:
                return true;
              case ErrorCode.NUMERIC_FAULT:
              default:
                return false;
            }
          }
          return true;
        },
        ...(optionOverrides ?? {}),
      }),
      [chainId, account, library] // buildInitialData is provided when declaring the hook type, not per call
    );

    const { data, error } = useQuery(
      queryKey,
      async (ctx): Promise<TData | undefined> => {
        const [chainId, account, ...innerKey] = ctx.queryKey;
        if (!account || !chainId || !library) {
          return undefined;
        }
        return await invoke(
          {
            account,
            chainId: chainId as number,
            library,
            // HACK: Any Cast to fix unexpected type error
            key: innerKey as any,
          },
          ...params
        );
      },
      queryOpts
    );
    const mappedData = React.useMemo(() => {
      if (data !== undefined && mapper !== undefined) {
        return mapper(data);
      } else {
        // This trick works because TResult must extend TData for TData
        // to be undefined or returnable if it reaches this branch
        //
        // Still... This should be redesigned to have more-sound types,
        // as this may trick the compiler, but it can be broken through
        // clever misuse of conflicting types. Those scenarios can't
        // happen by accident though, as they would require an any-cast.
        return data as TResult extends TData ? TResult : undefined;
      }
    }, [data]);
    return { data: mappedData, error, key: queryKey };
  }
  useBuiltQueryHook.buildKey = (
    chainId: ChainId | undefined,
    address: string | undefined,
    ...args: TArgs
  ): [ChainId | undefined, string | undefined, ...TKey] => [
    chainId,
    address,
    ...buildKey(...args),
  ];
  useBuiltQueryHook.invoke = invoke;
  const bound: QueryHook<TData, TKey, TArgs, TResult> = useBuiltQueryHook;
  return bound;
}

// Given a tuple type, strips `U` from the types in each slot
type ExcludeTuple<T, U> = T extends unknown[]
  ? { [K in keyof T]: Exclude<T[K], U> }
  : never;
// Given a tuple type, strips `undefined` from all slots
type AllDefined<T> = ExcludeTuple<T, undefined>;
type AllOrUndefined<T> = T extends unknown[]
  ? { [K in keyof T]: T[K] | undefined }
  : never;

export interface DefinedParamQueryHook<
  TData,
  TKey extends readonly unknown[],
  TArgs extends unknown[],
  TResult = TData
> extends QueryHook<TData, TKey, AllOrUndefined<TArgs>, TResult> {
  (...params: AllOrUndefined<TArgs>): QueryHookResult<TData, TKey>;
  invokeWhenDefined: (
    this: void,
    hookParams: QueryHookParams<TKey>,
    ...args: AllDefined<TArgs>
  ) => Promise<TData | undefined>;
}

export function buildQueryHookWhenParamsDefined<
  TData,
  TKey extends readonly unknown[],
  TArgs extends unknown[],
  TResult = TData
>(
  invokeWhenDefined: (
    hookParams: QueryHookParams<TKey>,
    ...args: AllDefined<TArgs>
  ) => Promise<TData>,
  buildKey: (...args: AllOrUndefined<TArgs>) => TKey,
  buildInitialData?: (() => TData | undefined) | undefined,
  optionOverrides?: UseQueryOptions<
    TData | undefined,
    unknown,
    TData,
    readonly [number | undefined, string | undefined, ...TKey]
  >,
  mapper?: ((input: TData) => TResult) | undefined
): DefinedParamQueryHook<TData, TKey, TArgs, TResult> {
  const newHook = buildQueryHook<TData, TKey, AllOrUndefined<TArgs>, TResult>(
    (hookParams, ...args: AllOrUndefined<TArgs>) =>
      args.every(a => a !== undefined)
        ? invokeWhenDefined(hookParams, ...(args as AllDefined<TArgs>))
        : Promise.resolve(undefined),
    buildKey,
    buildInitialData,
    optionOverrides,
    mapper
  );
  (
    newHook as DefinedParamQueryHook<TData, TKey, TArgs, TResult>
  ).invokeWhenDefined = invokeWhenDefined;
  return newHook as DefinedParamQueryHook<TData, TKey, TArgs, TResult>;
}

export interface ContractQueryHookParams<TKey extends readonly unknown[]>
  extends QueryHookParams<TKey> {
  chainAddrs: ChainAddresses;
}

export interface DefinedParamContractQueryHook<
  TData,
  TKey extends readonly unknown[],
  TArgs extends unknown[],
  TResult = TData
> extends QueryHook<TData, TKey, AllOrUndefined<TArgs>, TResult> {
  (...params: AllOrUndefined<TArgs>): QueryHookResult<TData, TKey>;
  invokeWhenDefined: (
    this: void,
    hookParams: ContractQueryHookParams<TKey>,
    ...args: AllDefined<TArgs>
  ) => Promise<TData>;
}

export function buildQueryHookWhenParamsDefinedChainAddrs<
  TData,
  TKey extends readonly unknown[],
  TArgs extends unknown[],
  TResult = TData
>(
  invokeWhenDefined: (
    hookParams: ContractQueryHookParams<TKey>,
    ...args: AllDefined<TArgs>
  ) => Promise<TData>,
  buildKey: (...args: AllOrUndefined<TArgs>) => TKey,
  buildInitialData?: (() => TData | undefined) | undefined,
  optionOverrides?: UseQueryOptions<
    TData | undefined,
    unknown,
    TData,
    readonly [number | undefined, string | undefined, ...TKey]
  >,
  mapper?: ((input: TData) => TResult) | undefined
): DefinedParamContractQueryHook<TData, TKey, TArgs, TResult> {
  const newHook = buildQueryHook<TData, TKey, AllOrUndefined<TArgs>, TResult>(
    (hookParams: QueryHookParams<TKey>, ...args: AllOrUndefined<TArgs>) => {
      const chainAddrs =
        hookParams.chainId !== undefined
          ? getChainAddresses(hookParams.chainId)
          : undefined;
      return chainAddrs !== undefined && args.every(a => a !== undefined)
        ? invokeWhenDefined(
            { ...hookParams, chainAddrs },
            ...(args as AllDefined<TArgs>)
          )
        : Promise.resolve(undefined);
    },
    buildKey,
    buildInitialData,
    optionOverrides,
    mapper
  );
  (
    newHook as DefinedParamContractQueryHook<TData, TKey, TArgs, TResult>
  ).invokeWhenDefined = invokeWhenDefined;
  return newHook as DefinedParamContractQueryHook<TData, TKey, TArgs, TResult>;
}
