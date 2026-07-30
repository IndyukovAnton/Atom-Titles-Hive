/* eslint-disable react-refresh/only-export-components */
import { useState, type ReactElement } from 'react';
import {
  render,
  renderHook,
  type RenderOptions,
  type RenderHookOptions,
} from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PersonalizationProvider } from '../../contexts/PersonalizationContext';

interface AllTheProvidersProps {
  children: React.ReactNode;
}

// Fresh QueryClient per test mount: no retries, no stale caching, no failure noise.
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

const AllTheProviders = ({ children }: AllTheProvidersProps) => {
  // Lazy init keeps the client stable across rerenders so queries don't restart
  // on every rerender of the wrapper.
  const [client] = useState(() => makeQueryClient());
  return (
    <QueryClientProvider client={client}>
      <BrowserRouter>
        {/* Реальный провайдер вместо моков: компоненты, использующие
            usePersonalization (AddMediaModal, HomePage и др.), иначе падают
            с "must be used within PersonalizationProvider". */}
        <PersonalizationProvider>{children}</PersonalizationProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

function renderHookWithProviders<TResult, TProps>(
  callback: (props: TProps) => TResult,
  options?: Omit<RenderHookOptions<TProps>, 'wrapper'>,
) {
  return renderHook(callback, { wrapper: AllTheProviders, ...options });
}

export * from '@testing-library/react';
export { customRender as render, renderHookWithProviders };
