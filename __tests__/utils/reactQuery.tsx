import type { ReactElement, ReactNode } from "react";
import {
  QueryClient,
  QueryClientProvider,
  type QueryClientConfig,
} from "@tanstack/react-query";
import { render, type RenderOptions } from "@testing-library/react";

type WrapperProps = { children: ReactNode };

export function createTestQueryClient(
  config?: QueryClientConfig
): QueryClient {
  const defaultQueryOptions = {
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    ...config?.defaultOptions?.queries,
  };

  const defaultMutationOptions = {
    retry: false,
    ...config?.defaultOptions?.mutations,
  };

  return new QueryClient({
    ...config,
    defaultOptions: {
      ...config?.defaultOptions,
      queries: defaultQueryOptions,
      mutations: defaultMutationOptions,
    },
  });
}

interface RenderWithQueryClientOptions extends RenderOptions {
  readonly queryClient?: QueryClient | undefined;
  readonly clientConfig?: QueryClientConfig | undefined;
  readonly wrapper?: React.ComponentType<WrapperProps> | undefined;
}

export function renderWithQueryClient(
  ui: ReactElement,
  options: RenderWithQueryClientOptions = {}
) {
  const { queryClient, clientConfig, wrapper: InnerWrapper, ...renderOptions } =
    options;
  const client = queryClient ?? createTestQueryClient(clientConfig);

  const Wrapper = ({ children }: WrapperProps) => (
    <QueryClientProvider client={client}>
      {InnerWrapper ? <InnerWrapper>{children}</InnerWrapper> : children}
    </QueryClientProvider>
  );

  const renderResult = render(ui, { wrapper: Wrapper, ...renderOptions });
  return { queryClient: client, ...renderResult };
}
