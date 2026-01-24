import { NextRequest, NextResponse } from 'next/server'
import { AIAnalysisRequest, AIAnalysisResponse, AlignedSegment, VideoInfo } from '@/lib/types'
import { getThumbnailUrl } from '@/lib/youtube'

export async function POST(request: NextRequest) {
  try {
    const body: AIAnalysisRequest = await request.json()
    const { videoIds, topic, transcripts } = body

    // Check if OpenAI API key is available
    const openaiKey = process.env.OPENAI_API_KEY

    let analysisResult: AIAnalysisResponse

    if (openaiKey && transcripts.some(t => t.entries.length > 0)) {
      // Use OpenAI for analysis
      analysisResult = await analyzeWithAI(videoIds, topic, transcripts, openaiKey)
    } else {
      // Use heuristic-based analysis as fallback
      analysisResult = analyzeWithHeuristics(videoIds, topic, transcripts)
    }

    return NextResponse.json(analysisResult)
  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze videos' },
      { status: 500 }
    )
  }
}

// AI-powered analysis using OpenAI
async function analyzeWithAI(
  videoIds: string[],
  topic: string,
  transcripts: any[],
  apiKey: string
): Promise<AIAnalysisResponse> {
  const OpenAI = (await import('openai')).default
  const openai = new OpenAI({ apiKey })

  // Prepare transcript summaries for each video
  const transcriptSummaries = transcripts.map((t, i) => ({
    videoId: videoIds[i],
    text: t.fullText.slice(0, 3000) // Limit text length
  }))

  const prompt = `You are analyzing multiple YouTube video transcripts about "${topic}" to find alignment points where videos discuss the same concepts.

Transcripts:
${transcriptSummaries.map((t, i) => `Video ${i + 1} (${t.videoId}):\n${t.text}`).join('\n\n')}

Analyze these transcripts and identify:
1. Common topics/concepts covered across videos
2. Time-aligned segments where videos discuss the same thing
3. Points where explanations converge (agree) or diverge (differ)
4. Unique perspectives each video brings

Return a JSON object with this structure:
{
  "segments": [
    {
      "topic": "Name of the concept/topic",
      "description": "Brief description",
      "videos": [
        {"videoId": "id", "startTime": 0, "endTime": 60, "summary": "What this video says", "confidence": 0.9}
      ],
      "recommendedOrder": ["id1", "id2"]
    }
  ],
  "insights": {
    "convergencePoints": ["Point where videos agree"],
    "divergencePoints": ["Point where videos differ"],
    "uniquePerspectives": [{"videoId": "id", "insight": "Unique point"}]
  }
}

Only return valid JSON, no markdown.`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    })

    const result = JSON.parse(completion.choices[0].message.content || '{}')

    // Build video info
    const videos: VideoInfo[] = videoIds.map((id, i) => ({
      id,
      title: `Video ${i + 1}`,
      thumbnail: getThumbnailUrl(id),
      duration: Math.max(...(result.segments?.flatMap((s: any) =>
        s.videos?.map((v: any) => v.endTime) || [300]
      ) || [300])),
      channelName: 'Unknown'
    }))

    // Format segments
    const segments: AlignedSegment[] = (result.segments || []).map((s: any, i: number) => ({
      id: `segment-${i}`,
      topic: s.topic || `Section ${i + 1}`,
      description: s.description || '',
      videos: s.videos || videoIds.map(id => ({
        videoId: id,
        startTime: i * 60,
        endTime: (i + 1) * 60,
        summary: '',
        confidence: 0.8
      })),
      recommendedOrder: s.recommendedOrder || videoIds
    }))

    return {
      timeline: {
        videos,
        segments: segments.length > 0 ? segments : generateDefaultSegments(videoIds),
        totalDuration: Math.max(...videos.map(v => v.duration), 300),
        topic
      },
      insights: result.insights || {
        convergencePoints: [],
        divergencePoints: [],
        uniquePerspectives: []
      }
    }
  } catch (error) {
    console.error('OpenAI analysis failed:', error)
    return analyzeWithHeuristics(videoIds, topic, transcripts)
  }
}

// Heuristic-based analysis (fallback when no AI available)
function analyzeWithHeuristics(
  videoIds: string[],
  topic: string,
  transcripts: any[]
): AIAnalysisResponse {
  // Create segments based on typical video structure
  const segmentTopics = [
    { name: 'Introduction', description: 'Opening and topic introduction' },
    { name: 'Core Concepts', description: 'Main ideas and fundamentals' },
    { name: 'Deep Dive', description: 'Detailed explanation and examples' },
    { name: 'Practical Application', description: 'Examples and use cases' },
    { name: 'Summary', description: 'Key takeaways and conclusion' }
  ]

  const segments = generateDefaultSegments(videoIds)

  const videos: VideoInfo[] = videoIds.map((id, i) => ({
    id,
    title: `Video ${i + 1}`,
    thumbnail: getThumbnailUrl(id),
    duration: 300, // Default 5 minutes, will be updated by player
    channelName: 'Unknown'
  }))

  return {
    timeline: {
      videos,
      segments,
      totalDuration: 300,
      topic
    },
    insights: {
      convergencePoints: [
        `All videos cover the fundamentals of ${topic}`,
        'Common examples and use cases are discussed'
      ],
      divergencePoints: [
        'Different teaching styles and approaches',
        'Varying levels of depth and complexity'
      ],
      uniquePerspectives: videoIds.map((id, i) => ({
        videoId: id,
        insight: `Video ${i + 1} offers a unique perspective on ${topic}`
      }))
    }
  }
}

function generateDefaultSegments(videoIds: string[]): AlignedSegment[] {
  const segmentTopics = [
    { name: 'Introduction', description: 'Opening and topic introduction', duration: 60 },
    { name: 'Core Concepts', description: 'Main ideas and fundamentals', duration: 90 },
    { name: 'Deep Dive', description: 'Detailed explanation', duration: 90 },
    { name: 'Examples', description: 'Practical examples', duration: 60 },
    { name: 'Conclusion', description: 'Summary and takeaways', duration: 60 }
  ]

  let currentTime = 0

  return segmentTopics.map((seg, i) => {
    const startTime = currentTime
    const endTime = currentTime + seg.duration
    currentTime = endTime

    return {
      id: `segment-${i}`,
      topic: seg.name,
      description: seg.description,
      videos: videoIds.map(videoId => ({
        videoId,
        startTime,
        endTime,
        summary: `${seg.name} section`,
        confidence: 0.7 + Math.random() * 0.3
      })),
      recommendedOrder: [...videoIds].sort(() => Math.random() - 0.5)
    }
  })
}
