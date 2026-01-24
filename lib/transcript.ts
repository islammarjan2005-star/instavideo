import { TranscriptEntry, VideoTranscript } from './types'

// Fetch transcript using a proxy approach (since youtube-transcript needs server-side)
// This will be called from the API route
export async function fetchTranscript(videoId: string): Promise<VideoTranscript | null> {
  try {
    // We'll use the API route to fetch transcripts server-side
    const response = await fetch(`/api/transcript?videoId=${videoId}`)

    if (!response.ok) {
      console.error('Failed to fetch transcript for', videoId)
      return null
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching transcript:', error)
    return null
  }
}

// Parse raw transcript data into structured entries
export function parseTranscriptEntries(rawEntries: any[]): TranscriptEntry[] {
  return rawEntries.map(entry => ({
    text: entry.text || entry.snippet || '',
    start: parseFloat(entry.start || entry.offset || 0),
    duration: parseFloat(entry.duration || entry.dur || 0)
  }))
}

// Combine transcript entries into full text with timestamps
export function transcriptToText(entries: TranscriptEntry[]): string {
  return entries.map(e => e.text).join(' ')
}

// Find the transcript entry at a given time
export function findEntryAtTime(entries: TranscriptEntry[], time: number): TranscriptEntry | null {
  for (const entry of entries) {
    if (time >= entry.start && time < entry.start + entry.duration) {
      return entry
    }
  }
  return null
}

// Get transcript text for a time range
export function getTextForTimeRange(
  entries: TranscriptEntry[],
  startTime: number,
  endTime: number
): string {
  return entries
    .filter(e => e.start >= startTime && e.start < endTime)
    .map(e => e.text)
    .join(' ')
}

// Simple text similarity using word overlap (Jaccard similarity)
export function textSimilarity(text1: string, text2: string): number {
  const words1Array = text1.toLowerCase().split(/\s+/).filter(w => w.length > 3)
  const words2Array = text2.toLowerCase().split(/\s+/).filter(w => w.length > 3)

  const words1 = new Set(words1Array)
  const words2 = new Set(words2Array)

  const intersection = words1Array.filter(w => words2.has(w))
  const unionArray = [...words1Array, ...words2Array.filter(w => !words1.has(w))]

  if (unionArray.length === 0) return 0
  return intersection.length / unionArray.length
}
