import './globals.css'
import ThemeProvider from '@/components/shared/theme-provider'
import StoreProvider from '@/components/shared/store-provider'
import AppShell from '@/components/layout/app-shell'

export const metadata = {
  title: 'MarketLens — Financial Research & Paper Trading',
  description: 'A frontend financial research and simulated paper-trading workspace.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">
        <StoreProvider>
          <ThemeProvider>
            <AppShell>{children}</AppShell>
          </ThemeProvider>
        </StoreProvider>
      </body>
    </html>
  )
}
