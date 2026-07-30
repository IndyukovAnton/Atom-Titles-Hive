import { jsx as _jsx } from "react/jsx-runtime";
/* eslint-disable react-refresh/only-export-components */
import { useState } from 'react';
import { render, renderHook, } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PersonalizationProvider } from '../../contexts/PersonalizationContext';
// Fresh QueryClient per test mount: no retries, no stale caching, no failure noise.
function makeQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: { retry: false, staleTime: 0, gcTime: 0 },
            mutations: { retry: false },
        },
    });
}
const AllTheProviders = ({ children }) => {
    // Lazy init keeps the client stable across rerenders so queries don't restart
    // on every rerender of the wrapper.
    const [client] = useState(() => makeQueryClient());
    return (_jsx(QueryClientProvider, { client: client, children: _jsx(BrowserRouter, { children: _jsx(PersonalizationProvider, { children: children }) }) }));
};
const customRender = (ui, options) => render(ui, { wrapper: AllTheProviders, ...options });
function renderHookWithProviders(callback, options) {
    return renderHook(callback, { wrapper: AllTheProviders, ...options });
}
export * from '@testing-library/react';
export { customRender as render, renderHookWithProviders };
