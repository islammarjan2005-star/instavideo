'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Play, Plus, X, Sparkles, BookOpen, MessageSquare, TrendingUp, Zap } from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const [videoUrls, setVideoUrls] = useState<string[]>(['', ''])
  const [topic, setTopic] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const addVideoInput = () => {
    if (videoUrls.length < 6) {
      setVideoUrls([...videoUrls, ''])
    }
  }

  const removeVideoInput = (index: number) => {
    if (videoUrls.length > 2) {
      setVideoUrls(videoUrls.filter((_, i) => i !== index))
    }
  }

  const updateVideoUrl = (index: number, url: string) => {
    const newUrls = [...videoUrls]
    newUrls[index] = url
    setVideoUrls(newUrls)
  }

  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/
    ]
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }
    return null
  }

  const handleSubmit = async () => {
    setError('')

    const validUrls = videoUrls.filter(url => url.trim() !== '')
    if (validUrls.length < 2) {
      setError('Please enter at least 2 video URLs')
      return
    }

    const videoIds = validUrls.map(extractVideoId).filter(Boolean)
    if (videoIds.length !== validUrls.length) {
      setError('One or more URLs are invalid. Please check and try again.')
      return
    }

    if (!topic.trim()) {
      setError('Please enter a topic to help the AI understand what to focus on')
      return
    }

    setIsLoading(true)

    // Navigate to player with video IDs and topic
    const params = new URLSearchParams({
      videos: videoIds.join(','),
      topic: topic.trim()
    })
    router.push(`/player?${params.toString()}`)
  }

  const useCases = [
    {
      icon: BookOpen,
      title: 'Academic Learning',
      description: 'Math, statistics, coding, economics - see multiple explanations converge',
      color: 'text-blue-400'
    },
    {
      icon: MessageSquare,
      title: 'Commentary & Debates',
      description: 'Compare perspectives on reactions, discussions, and hot takes',
      color: 'text-purple-400'
    },
    {
      icon: TrendingUp,
      title: 'Sports Analysis',
      description: 'Watch multiple analysts break down the same play or game',
      color: 'text-green-400'
    },
    {
      icon: Zap,
      title: 'Tech Tutorials',
      description: 'Learn from different teaching styles on the same concept',
      color: 'text-yellow-400'
    }
  ]

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
      {/* Hero Section */}
      <div className="text-center mb-12 max-w-3xl">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 glow-primary">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
            SyncView
          </h1>
        </div>
        <p className="text-xl text-gray-300 mb-2">
          AI-Powered Comparative Video Learning
        </p>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Watch multiple YouTube videos intelligently interwoven into a single viewing experience.
          Compare perspectives, see explanations converge, and gain clearer understanding.
        </p>
      </div>

      {/* Input Section */}
      <div className="w-full max-w-2xl glass rounded-2xl p-6 md:p-8 mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Play className="w-5 h-5 text-primary-400" />
          Enter YouTube Videos to Compare
        </h2>

        {/* Topic Input */}
        <div className="mb-6">
          <label className="block text-sm text-gray-400 mb-2">
            What topic are these videos about?
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., 'Linear Regression', 'React Hooks', 'Game of Thrones ending'"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
          />
        </div>

        {/* Video URL Inputs */}
        <div className="space-y-3 mb-4">
          {videoUrls.map((url, index) => (
            <div key={index} className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => updateVideoUrl(index, e.target.value)}
                  placeholder={`Video ${index + 1} URL (youtube.com/watch?v=... or youtu.be/...)`}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all pr-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                  #{index + 1}
                </span>
              </div>
              {videoUrls.length > 2 && (
                <button
                  onClick={() => removeVideoInput(index)}
                  className="p-3 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}
        </div>

        {videoUrls.length < 6 && (
          <button
            onClick={addVideoInput}
            className="w-full py-2 border border-dashed border-white/20 rounded-lg text-gray-400 hover:border-primary-500 hover:text-primary-400 transition-all flex items-center justify-center gap-2 mb-6"
          >
            <Plus className="w-4 h-4" />
            Add Another Video (up to 6)
          </button>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full py-4 bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 rounded-lg font-semibold text-white transition-all glow-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Analyzing Videos...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Start Comparative View
            </>
          )}
        </button>
      </div>

      {/* Use Cases */}
      <div className="w-full max-w-4xl">
        <h3 className="text-center text-gray-400 mb-6">Perfect for</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {useCases.map((useCase, index) => (
            <div
              key={index}
              className="glass rounded-xl p-4 hover:bg-white/10 transition-all cursor-default"
            >
              <useCase.icon className={`w-6 h-6 ${useCase.color} mb-2`} />
              <h4 className="font-medium mb-1">{useCase.title}</h4>
              <p className="text-sm text-gray-400">{useCase.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 text-center text-gray-500 text-sm">
        <p>SyncView uses AI to analyze video transcripts and find alignment points.</p>
        <p className="mt-1">Videos are embedded from YouTube - no content is downloaded.</p>
      </footer>
    </main>
  )
}
