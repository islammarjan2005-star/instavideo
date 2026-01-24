'use client'

import Image from 'next/image'
import { Play, Check, Star } from 'lucide-react'
import { VideoInfo, AlignedSegment } from '@/lib/types'
import { getVideoColor, getThumbnailUrl } from '@/lib/youtube'

interface Props {
  videos: VideoInfo[]
  currentVideoId: string
  segment: AlignedSegment
  onVideoSelect: (videoId: string) => void
}

export default function VideoThumbnails({
  videos,
  currentVideoId,
  segment,
  onVideoSelect
}: Props) {
  // Sort videos by their order in the segment
  const orderedVideos = segment.recommendedOrder
    .map(id => videos.find(v => v.id === id))
    .filter(Boolean) as VideoInfo[]

  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-sm">Compare Perspectives</h3>
        <p className="text-xs text-gray-400">
          Click to switch videos
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {orderedVideos.map((video, index) => {
          const videoIndex = videos.findIndex(v => v.id === video.id)
          const color = getVideoColor(videoIndex)
          const isActive = video.id === currentVideoId
          const videoData = segment.videos.find(v => v.videoId === video.id)
          const confidence = videoData?.confidence || 0.5

          return (
            <button
              key={video.id}
              onClick={() => onVideoSelect(video.id)}
              className={`group relative rounded-lg overflow-hidden transition-all ${
                isActive
                  ? `ring-2 ${color.border} scale-105`
                  : 'hover:scale-102 hover:ring-1 ring-white/20'
              }`}
            >
              {/* Thumbnail */}
              <div className="relative aspect-video bg-gray-800">
                <Image
                  src={getThumbnailUrl(video.id, 'medium')}
                  alt={video.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 16vw"
                />

                {/* Overlay */}
                <div
                  className={`absolute inset-0 transition-opacity ${
                    isActive
                      ? 'bg-black/20'
                      : 'bg-black/40 group-hover:bg-black/20'
                  }`}
                />

                {/* Play/Active indicator */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {isActive ? (
                    <div className={`p-2 ${color.bg} rounded-full animate-pulse`}>
                      <Play className="w-4 h-4 text-white" fill="white" />
                    </div>
                  ) : (
                    <div className="p-2 bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>

                {/* Video number badge */}
                <div
                  className={`absolute top-1 left-1 px-1.5 py-0.5 rounded text-xs font-medium ${color.bg} text-white`}
                >
                  #{videoIndex + 1}
                </div>

                {/* Confidence indicator */}
                <div className="absolute bottom-1 right-1 flex items-center gap-0.5">
                  {[1, 2, 3].map((star) => (
                    <Star
                      key={star}
                      className={`w-2.5 h-2.5 ${
                        star <= Math.round(confidence * 3)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-600'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Title */}
              <div className="p-2 bg-white/5">
                <p className="text-xs font-medium truncate" title={video.title}>
                  {video.title}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {video.channelName}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Viewing order hint */}
      <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
        <span>Stars indicate how well each video covers this segment</span>
      </div>
    </div>
  )
}
