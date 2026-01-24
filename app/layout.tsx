import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SyncView - AI-Powered Comparative Video Learning',
  description: 'Learn through multiple perspectives with AI-powered video comparison. Watch multiple YouTube videos intelligently interwoven into a single viewing experience.',
  keywords: ['video learning', 'youtube', 'AI', 'education', 'comparison', 'multiple perspectives'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <div className="min-h-screen flex flex-col">
          {children}
        </div>
      </body>
    </html>
  )
}
