import { VideoInfo, TranscriptEntry, VideoTranscript } from './types'

// Extract video ID from various YouTube URL formats
export function extractVideoId(url: string): string | null {
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

// Get video thumbnail URL
export function getThumbnailUrl(videoId: string, quality: 'default' | 'medium' | 'high' | 'maxres' = 'high'): string {
  const qualityMap = {
    default: 'default',
    medium: 'mqdefault',
    high: 'hqdefault',
    maxres: 'maxresdefault'
  }
  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`
}

// Format seconds to MM:SS or HH:MM:SS
export function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Parse time string to seconds
export function parseTime(timeStr: string): number {
  const parts = timeStr.split(':').map(Number)
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2]
  }
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1]
  }
  return parts[0] || 0
}

// Fetch video info using oEmbed (no API key required)
export async function fetchVideoInfo(videoId: string): Promise<VideoInfo> {
  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    )

    if (!response.ok) {
      throw new Error('Failed to fetch video info')
    }

    const data = await response.json()

    return {
      id: videoId,
      title: data.title || 'Unknown Title',
      thumbnail: getThumbnailUrl(videoId),
      duration: 0, // oEmbed doesn't provide duration, will be set by player
      channelName: data.author_name || 'Unknown Channel'
    }
  } catch (error) {
    console.error('Error fetching video info:', error)
    return {
      id: videoId,
      title: 'Video ' + videoId,
      thumbnail: getThumbnailUrl(videoId),
      duration: 0,
      channelName: 'Unknown Channel'
    }
  }
}

// Color palette for different videos
export const videoColors = [
  { bg: 'bg-blue-500', text: 'text-blue-400', border: 'border-blue-500', hex: '#3b82f6' },
  { bg: 'bg-purple-500', text: 'text-purple-400', border: 'border-purple-500', hex: '#a855f7' },
  { bg: 'bg-green-500', text: 'text-green-400', border: 'border-green-500', hex: '#22c55e' },
  { bg: 'bg-orange-500', text: 'text-orange-400', border: 'border-orange-500', hex: '#f97316' },
  { bg: 'bg-pink-500', text: 'text-pink-400', border: 'border-pink-500', hex: '#ec4899' },
  { bg: 'bg-cyan-500', text: 'text-cyan-400', border: 'border-cyan-500', hex: '#06b6d4' },
]

export function getVideoColor(index: number) {
  return videoColors[index % videoColors.length]
}
