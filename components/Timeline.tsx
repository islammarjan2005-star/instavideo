'use client'

import { AlignedSegment, VideoInfo } from '@/lib/types'
import { getVideoColor, formatTime } from '@/lib/youtube'

interface Props {
  segments: AlignedSegment[]
  videos: VideoInfo[]
  currentSegmentIndex: number
  currentVideoId: string
  currentTime: number
  onSegmentClick: (index: number) => void
}

export default function Timeline({
  segments,
  videos,
  currentSegmentIndex,
  currentVideoId,
  currentTime,
  onSegmentClick
}: Props) {
  // Calculate total timeline duration
  const totalDuration = segments.reduce((acc, seg) => {
    const maxEnd = Math.max(...seg.videos.map(v => v.endTime))
    return Math.max(acc, maxEnd)
  }, 0)

  // Calculate segment widths as percentages
  const getSegmentWidth = (segment: AlignedSegment, index: number) => {
    const startTime = index === 0 ? 0 : segments[index - 1].videos[0]?.endTime || 0
    const endTime = Math.max(...segment.videos.map(v => v.endTime))
    const duration = endTime - startTime
    return (duration / totalDuration) * 100
  }

  // Calculate current progress within segment
  const getCurrentProgress = () => {
    const segment = segments[currentSegmentIndex]
    if (!segment) return 0

    const videoData = segment.videos.find(v => v.videoId === currentVideoId)
    if (!videoData) return 0

    const segmentDuration = videoData.endTime - videoData.startTime
    const elapsed = currentTime - videoData.startTime
    return Math.min(100, Math.max(0, (elapsed / segmentDuration) * 100))
  }

  return (
    <div className="space-y-2">
      {/* Main timeline bar */}
      <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
        {/* Segment divisions */}
        <div className="absolute inset-0 flex">
          {segments.map((segment, index) => {
            const width = getSegmentWidth(segment, index)
            const isActive = index === currentSegmentIndex
            const isPast = index < currentSegmentIndex

            return (
              <button
                key={segment.id}
                onClick={() => onSegmentClick(index)}
                className="relative h-full transition-colors group"
                style={{ width: `${width}%` }}
              >
                {/* Background */}
                <div
                  className={`absolute inset-0 transition-colors ${
                    isPast
                      ? 'bg-primary-500/50'
                      : isActive
                      ? 'bg-primary-500/30'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                />

                {/* Progress within active segment */}
                {isActive && (
                  <div
                    className="absolute inset-y-0 left-0 bg-primary-500 transition-all duration-250"
                    style={{ width: `${getCurrentProgress()}%` }}
                  />
                )}

                {/* Segment divider */}
                {index < segments.length - 1 && (
                  <div className="absolute right-0 top-0 bottom-0 w-px bg-white/20" />
                )}

                {/* Hover tooltip */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  {segment.topic}
                </div>
              </button>
            )
          })}
        </div>

        {/* Current position indicator */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg transition-all duration-250 pointer-events-none z-10"
          style={{
            left: `calc(${
              segments.slice(0, currentSegmentIndex).reduce((acc, seg, i) => acc + getSegmentWidth(seg, i), 0)
            }% + ${getCurrentProgress() * getSegmentWidth(segments[currentSegmentIndex], currentSegmentIndex) / 100}%)`
          }}
        />
      </div>

      {/* Video color legend in current segment */}
      <div className="flex items-center gap-4 text-xs">
        <span className="text-gray-500">Videos in this segment:</span>
        <div className="flex items-center gap-3">
          {segments[currentSegmentIndex]?.recommendedOrder.map((videoId, index) => {
            const videoIndex = videos.findIndex(v => v.id === videoId)
            const video = videos[videoIndex]
            const isCurrentVideo = videoId === currentVideoId
            const color = getVideoColor(videoIndex)

            return (
              <div
                key={videoId}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded transition-all ${
                  isCurrentVideo ? 'bg-white/10' : ''
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${color.bg} ${isCurrentVideo ? 'animate-pulse' : ''}`} />
                <span className={isCurrentVideo ? 'text-white' : 'text-gray-400'}>
                  {video?.channelName?.slice(0, 15) || `Video ${videoIndex + 1}`}
                </span>
                {isCurrentVideo && (
                  <span className="text-primary-400 ml-1">playing</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Time display */}
      <div className="flex justify-between text-xs text-gray-500">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(totalDuration)}</span>
      </div>
    </div>
  )
}
