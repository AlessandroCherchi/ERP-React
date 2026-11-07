import type { ReactNode } from 'react';
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { queryClient as defaultClient } from '../lib/queryClient';
import { ToastProvider } from '../components/ui/Toast';
import { ConfirmProvider } from '../components/ui/Confirm';

/** Provider globali dell'app — condivisi da main.tsx e dai test. */
export function AppProviders({ children, client = defaultClient }: { children: ReactNode; client?: QueryClient }) {
    return (
        <QueryClientProvider client={client}>
            <ToastProvider>
                <ConfirmProvider>{children}</ConfirmProvider>
            </ToastProvider>
        </QueryClientProvider>
    );
}
