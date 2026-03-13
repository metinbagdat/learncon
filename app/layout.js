'use client'
import { ToastProvider } from '@/components/Toast'
import { GlobalErrorSetup } from '@/components/GlobalErrorSetup'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body>
        <ToastProvider>
          <GlobalErrorSetup />
          <ErrorBoundary name="Root">
            {children}
          </ErrorBoundary>
        </ToastProvider>
      </body>
    </html>
  )
}
