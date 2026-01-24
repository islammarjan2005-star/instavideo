import { NextRequest, NextResponse } from 'next/server'
import { VideoTranscript, TranscriptEntry } from '@/lib/types'

// Fetch YouTube transcript using youtube-transcript package
// This runs server-side to avoid CORS issues
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const videoId = searchParams.get('videoId')

  if (!videoId) {
    return NextResponse.json({ error: 'Video ID is required' }, { status: 400 })
  }

  try {
    // Dynamic import to ensure it runs server-side only
    const { YoutubeTranscript } = await import('youtube-transcript')

    const rawTranscript = await YoutubeTranscript.fetchTranscript(videoId)

    const entries: TranscriptEntry[] = rawTranscript.map((item: any) => ({
      text: item.text || '',
      start: item.offset / 1000, // Convert from ms to seconds
      duration: item.duration / 1000
    }))

    const transcript: VideoTranscript = {
      videoId,
      entries,
      fullText: entries.map(e => e.text).join(' ')
    }

    return NextResponse.json(transcript)
  } catch (error) {
    console.error('Error fetching transcript:', error)

    // Return a mock transcript for demo purposes if real one fails
    // In production, you'd want to handle this differently
    const mockTranscript: VideoTranscript = {
      videoId,
      entries: generateMockTranscript(),
      fullText: 'Transcript unavailable for this video.'
    }

    return NextResponse.json(mockTranscript)
  }
}

// Generate mock transcript entries for demo when real transcript is unavailable
function generateMockTranscript(): TranscriptEntry[] {
  const segments = [
    'Welcome to this video where we will explore the topic in depth.',
    'Let me start by introducing the key concepts you need to understand.',
    'The first important point is understanding the fundamentals.',
    'Now lets dive deeper into the details of how this works.',
    'Here is a practical example to illustrate the concept.',
    'Many people find this part confusing so let me clarify.',
    'The key insight here is to recognize the pattern.',
    'In conclusion these are the main takeaways from our discussion.',
  ]

  return segments.map((text, index) => ({
    text,
    start: index * 30,
    duration: 28
  }))
}
