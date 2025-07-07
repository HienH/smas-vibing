/**
 * @fileoverview Custom render function with providers for testing.
 *
 * Provides a custom render function that includes all necessary providers.
 */

import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { SessionProvider } from 'next-auth/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { mockAuthData } from '@/mocks/next-auth'
import { ToastProvider } from '@/components/ui/toast'

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  session?: any
}

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
})

function AllTheProviders({
  children,
  session = mockAuthData.session
}: {
  children: React.ReactNode
  session?: any
}) {
  const queryClient = createTestQueryClient()

  return (
    <SessionProvider session={session}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </QueryClientProvider>
    </SessionProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { session, ...renderOptions } = options

  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders session={session}>
        {children}
      </AllTheProviders>
    ),
    ...renderOptions,
  })
}

export * from '@testing-library/react'
export { customRender } 