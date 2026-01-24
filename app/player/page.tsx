'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { VideoTimeline, VideoTranscript, AIAnalysisResponse, VideoInfo } from '@/lib/types'
import { fetchVideoInfo } from '@/lib/youtube'
import ComparativePlayer from '@/components/ComparativePlayer'

function PlayerContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [timeline, setTimeline] = useState<VideoTimeline | null>(null)
  const [insights, setInsights] = useState<AIAnalysisResponse['insights'] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadingStatus, setLoadingStatus] = useState('Initializing...')
  const [error, setError] = useState<string | null>(null)

  const videoIds = searchParams.get('videos')?.split(',') || []
  const topic = searchParams.get('topic') || ''

  const initializePlayer = useCallback(async () => {
    if (videoIds.length < 2) {
      setError('At least 2 videos are required')
      setIsLoading(false)
      return
    }

    try {
      // Step 1: Fetch video info
      setLoadingStatus('Fetching video information...')
      const videoInfoPromises = videoIds.map(id => fetchVideoInfo(id))
      const videos = await Promise.all(videoInfoPromises)

      // Step 2: Fetch transcripts
      setLoadingStatus('Fetching video transcripts...')
      const transcriptPromises = videoIds.map(async (id) => {
        try {
          const response = await fetch(`/api/transcript?videoId=${id}`)
          if (response.ok) {
            return await response.json()
          }
          return { videoId: id, entries: [], fullText: '' }
        } catch {
          return { videoId: id, entries: [], fullText: '' }
        }
      })
      const transcripts: VideoTranscript[] = await Promise.all(transcriptPromises)

      // Step 3: Analyze with AI
      setLoadingStatus('AI is analyzing videos for alignment points...')
      const analysisResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoIds,
          topic,
          transcripts
        })
      })

      if (!analysisResponse.ok) {
        throw new Error('Failed to analyze videos')
      }

      const analysisResult: AIAnalysisResponse = await analysisResponse.json()

      // Update video info with fetched data
      analysisResult.timeline.videos = analysisResult.timeline.videos.map((v, i) => ({
        ...v,
        title: videos[i]?.title || v.title,
        channelName: videos[i]?.channelName || v.channelName
      }))

      setTimeline(analysisResult.timeline)
      setInsights(analysisResult.insights)
      setLoadingStatus('Ready!')
    } catch (err) {
      console.error('Error initializing player:', err)
      setError('Failed to load videos. Please check the URLs and try again.')
    } finally {
      setIsLoading(false)
    }
  }, [videoIds, topic])

  useEffect(() => {
    initializePlayer()
  }, [initializePlayer])

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="glass rounded-2xl p-8 max-w-md w-full text-center">
          <Loader2 className="w-12 h-12 text-primary-400 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Preparing Your Experience</h2>
          <p className="text-gray-400 mb-4">{loadingStatus}</p>
          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary-500 to-accent-500 shimmer" style={{ width: '60%' }} />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="glass rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">!</span>
          </div>
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!timeline) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="glass border-b border-white/10 px-4 py-3 flex items-center gap-4">
        <button
          onClick={() => router.push('/')}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="font-semibold truncate">{topic}</h1>
          <p className="text-sm text-gray-400">{timeline.videos.length} videos compared</p>
        </div>
      </header>

      {/* Main Player */}
      <main className="flex-1 p-4">
        <ComparativePlayer timeline={timeline} insights={insights} />
      </main>
    </div>
  )
}

export default function PlayerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-400" />
      </div>
    }>
      <PlayerContent />
    </Suspense>
  )
}
