// Video and segment types for the comparative player

export interface VideoInfo {
  id: string
  title: string
  thumbnail: string
  duration: number // in seconds
  channelName: string
}

export interface TranscriptEntry {
  text: string
  start: number // start time in seconds
  duration: number // duration in seconds
}

export interface VideoTranscript {
  videoId: string
  entries: TranscriptEntry[]
  fullText: string
}

export interface AlignedSegment {
  id: string
  topic: string
  description: string
  videos: {
    videoId: string
    startTime: number
    endTime: number
    summary: string
    confidence: number // 0-1, how well this video covers the topic
  }[]
  recommendedOrder: string[] // video IDs in recommended viewing order
}

export interface VideoTimeline {
  videos: VideoInfo[]
  segments: AlignedSegment[]
  totalDuration: number
  topic: string
}

export interface PlaybackState {
  currentSegmentIndex: number
  currentVideoIndex: number // index within the current segment's recommendedOrder
  currentTime: number
  isPlaying: boolean
  autoSwitch: boolean // whether to automatically switch between videos
}

export interface AIAnalysisRequest {
  videoIds: string[]
  topic: string
  transcripts: VideoTranscript[]
}

export interface AIAnalysisResponse {
  timeline: VideoTimeline
  insights: {
    convergencePoints: string[]
    divergencePoints: string[]
    uniquePerspectives: { videoId: string; insight: string }[]
  }
}

// YouTube Player types
export interface YouTubePlayer {
  playVideo: () => void
  pauseVideo: () => void
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void
  getCurrentTime: () => number
  getDuration: () => number
  getPlayerState: () => number
  setVolume: (volume: number) => void
  mute: () => void
  unMute: () => void
  isMuted: () => boolean
  getVolume: () => number
  destroy: () => void
}

export interface YouTubePlayerEvent {
  target: YouTubePlayer
  data: number
}

// Player state constants (matching YouTube API)
export const PlayerState = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
} as const
