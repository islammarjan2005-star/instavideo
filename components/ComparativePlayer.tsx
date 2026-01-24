'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Play, Pause, SkipForward, SkipBack, Volume2, VolumeX,
  Shuffle, ArrowRightLeft, ChevronDown, ChevronUp,
  Lightbulb, GitCompare, Eye
} from 'lucide-react'
import { VideoTimeline, PlaybackState, AlignedSegment, YouTubePlayer, PlayerState, AIAnalysisResponse } from '@/lib/types'
import { formatTime, getVideoColor } from '@/lib/youtube'
import YouTubeEmbed from './YouTubeEmbed'
import Timeline from './Timeline'
import VideoThumbnails from './VideoThumbnails'

interface Props {
  timeline: VideoTimeline
  insights: AIAnalysisResponse['insights'] | null
}

export default function ComparativePlayer({ timeline, insights }: Props) {
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    currentSegmentIndex: 0,
    currentVideoIndex: 0,
    currentTime: 0,
    isPlaying: false,
    autoSwitch: true
  })

  const [volume, setVolume] = useState(100)
  const [isMuted, setIsMuted] = useState(false)
  const [showInsights, setShowInsights] = useState(false)
  const [videoDurations, setVideoDurations] = useState<Record<string, number>>({})

  const playersRef = useRef<Record<string, YouTubePlayer | null>>({})
  const lastSwitchTime = useRef<number>(0)

  const currentSegment = timeline.segments[playbackState.currentSegmentIndex]
  const currentVideoId = currentSegment?.recommendedOrder[playbackState.currentVideoIndex] || timeline.videos[0].id
  const currentVideoInfo = timeline.videos.find(v => v.id === currentVideoId)
  const currentVideoData = currentSegment?.videos.find(v => v.videoId === currentVideoId)

  // Register player ref
  const registerPlayer = useCallback((videoId: string, player: YouTubePlayer | null) => {
    playersRef.current[videoId] = player
  }, [])

  // Update duration when player is ready
  const handleDurationUpdate = useCallback((videoId: string, duration: number) => {
    setVideoDurations(prev => ({ ...prev, [videoId]: duration }))
  }, [])

  // Handle play/pause
  const togglePlayback = useCallback(() => {
    const player = playersRef.current[currentVideoId]
    if (!player) return

    if (playbackState.isPlaying) {
      player.pauseVideo()
    } else {
      player.playVideo()
    }
    setPlaybackState(prev => ({ ...prev, isPlaying: !prev.isPlaying }))
  }, [currentVideoId, playbackState.isPlaying])

  // Handle player state change
  const handleStateChange = useCallback((videoId: string, state: number) => {
    if (videoId !== currentVideoId) return

    if (state === PlayerState.PLAYING) {
      setPlaybackState(prev => ({ ...prev, isPlaying: true }))
    } else if (state === PlayerState.PAUSED) {
      setPlaybackState(prev => ({ ...prev, isPlaying: false }))
    } else if (state === PlayerState.ENDED) {
      // Move to next segment or video
      if (playbackState.currentVideoIndex < currentSegment.recommendedOrder.length - 1) {
        switchToVideo(playbackState.currentVideoIndex + 1)
      } else if (playbackState.currentSegmentIndex < timeline.segments.length - 1) {
        goToSegment(playbackState.currentSegmentIndex + 1)
      } else {
        setPlaybackState(prev => ({ ...prev, isPlaying: false }))
      }
    }
  }, [currentVideoId, currentSegment, playbackState])

  // Time update handler
  const handleTimeUpdate = useCallback((videoId: string, time: number) => {
    if (videoId !== currentVideoId) return

    setPlaybackState(prev => ({ ...prev, currentTime: time }))

    // Auto-switch logic
    if (!playbackState.autoSwitch || !currentVideoData) return

    const now = Date.now()
    if (now - lastSwitchTime.current < 3000) return // Minimum 3 seconds between switches

    const segmentEndTime = currentVideoData.endTime
    const timeUntilEnd = segmentEndTime - time

    // If within 2 seconds of segment end, switch to next video or segment
    if (timeUntilEnd <= 2 && timeUntilEnd > 0) {
      lastSwitchTime.current = now

      if (playbackState.currentVideoIndex < currentSegment.recommendedOrder.length - 1) {
        // Switch to next video in segment
        switchToVideo(playbackState.currentVideoIndex + 1)
      } else if (playbackState.currentSegmentIndex < timeline.segments.length - 1) {
        // Move to next segment
        goToSegment(playbackState.currentSegmentIndex + 1)
      }
    }
  }, [currentVideoId, playbackState, currentVideoData, currentSegment, timeline.segments.length])

  // Switch to specific video within current segment
  const switchToVideo = useCallback((videoIndex: number) => {
    const currentPlayer = playersRef.current[currentVideoId]
    if (currentPlayer) {
      currentPlayer.pauseVideo()
    }

    const newVideoId = currentSegment.recommendedOrder[videoIndex]
    const newVideoData = currentSegment.videos.find(v => v.videoId === newVideoId)

    if (!newVideoData) return

    setPlaybackState(prev => ({
      ...prev,
      currentVideoIndex: videoIndex,
      currentTime: newVideoData.startTime
    }))

    // Seek and play new video
    setTimeout(() => {
      const newPlayer = playersRef.current[newVideoId]
      if (newPlayer) {
        newPlayer.seekTo(newVideoData.startTime, true)
        if (playbackState.isPlaying) {
          newPlayer.playVideo()
        }
      }
    }, 100)
  }, [currentVideoId, currentSegment, playbackState.isPlaying])

  // Switch to specific video by ID
  const switchToVideoById = useCallback((videoId: string) => {
    const videoIndex = currentSegment.recommendedOrder.indexOf(videoId)
    if (videoIndex !== -1) {
      switchToVideo(videoIndex)
    }
  }, [currentSegment, switchToVideo])

  // Go to specific segment
  const goToSegment = useCallback((segmentIndex: number) => {
    const currentPlayer = playersRef.current[currentVideoId]
    if (currentPlayer) {
      currentPlayer.pauseVideo()
    }

    const segment = timeline.segments[segmentIndex]
    if (!segment) return

    const firstVideoId = segment.recommendedOrder[0]
    const videoData = segment.videos.find(v => v.videoId === firstVideoId)

    if (!videoData) return

    setPlaybackState(prev => ({
      ...prev,
      currentSegmentIndex: segmentIndex,
      currentVideoIndex: 0,
      currentTime: videoData.startTime
    }))

    setTimeout(() => {
      const player = playersRef.current[firstVideoId]
      if (player) {
        player.seekTo(videoData.startTime, true)
        if (playbackState.isPlaying) {
          player.playVideo()
        }
      }
    }, 100)
  }, [currentVideoId, timeline.segments, playbackState.isPlaying])

  // Skip forward/backward
  const skipForward = useCallback(() => {
    if (playbackState.currentSegmentIndex < timeline.segments.length - 1) {
      goToSegment(playbackState.currentSegmentIndex + 1)
    }
  }, [playbackState.currentSegmentIndex, timeline.segments.length, goToSegment])

  const skipBackward = useCallback(() => {
    if (playbackState.currentSegmentIndex > 0) {
      goToSegment(playbackState.currentSegmentIndex - 1)
    }
  }, [playbackState.currentSegmentIndex, goToSegment])

  // Volume control
  const toggleMute = useCallback(() => {
    const player = playersRef.current[currentVideoId]
    if (!player) return

    if (isMuted) {
      player.unMute()
      player.setVolume(volume)
    } else {
      player.mute()
    }
    setIsMuted(!isMuted)
  }, [currentVideoId, isMuted, volume])

  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume)
    const player = playersRef.current[currentVideoId]
    if (player) {
      player.setVolume(newVolume)
      if (newVolume > 0 && isMuted) {
        player.unMute()
        setIsMuted(false)
      }
    }
  }, [currentVideoId, isMuted])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault()
          togglePlayback()
          break
        case 'ArrowRight':
          skipForward()
          break
        case 'ArrowLeft':
          skipBackward()
          break
        case 'm':
          toggleMute()
          break
        case 'a':
          setPlaybackState(prev => ({ ...prev, autoSwitch: !prev.autoSwitch }))
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [togglePlayback, skipForward, skipBackward, toggleMute])

  const videoColorIndex = timeline.videos.findIndex(v => v.id === currentVideoId)

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      {/* Main Player Area */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Video Player Container */}
        <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
          {/* All video players (stacked, only active one visible) */}
          {timeline.videos.map((video, index) => (
            <div
              key={video.id}
              className={`absolute inset-0 transition-opacity duration-500 ${
                video.id === currentVideoId ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              <YouTubeEmbed
                videoId={video.id}
                isActive={video.id === currentVideoId}
                onPlayerReady={(player) => registerPlayer(video.id, player)}
                onStateChange={(state) => handleStateChange(video.id, state)}
                onTimeUpdate={(time) => handleTimeUpdate(video.id, time)}
                onDurationUpdate={(duration) => handleDurationUpdate(video.id, duration)}
              />
            </div>
          ))}

          {/* Current Video Indicator */}
          <div className={`absolute top-4 left-4 px-3 py-1.5 rounded-lg glass ${getVideoColor(videoColorIndex).text} flex items-center gap-2`}>
            <div className={`w-2 h-2 rounded-full ${getVideoColor(videoColorIndex).bg} animate-pulse`} />
            <span className="text-sm font-medium truncate max-w-[200px]">
              {currentVideoInfo?.title || `Video ${videoColorIndex + 1}`}
            </span>
          </div>

          {/* Segment Info */}
          <div className="absolute bottom-4 left-4 right-4 glass rounded-lg p-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-medium text-sm">{currentSegment?.topic}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{currentSegment?.description}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">
                  {formatTime(playbackState.currentTime)}
                </p>
                <p className="text-xs text-gray-500">
                  Segment {playbackState.currentSegmentIndex + 1}/{timeline.segments.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="glass rounded-xl p-4">
          {/* Timeline */}
          <Timeline
            segments={timeline.segments}
            videos={timeline.videos}
            currentSegmentIndex={playbackState.currentSegmentIndex}
            currentVideoId={currentVideoId}
            currentTime={playbackState.currentTime}
            onSegmentClick={goToSegment}
          />

          {/* Playback Controls */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <button
                onClick={skipBackward}
                disabled={playbackState.currentSegmentIndex === 0}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
              >
                <SkipBack className="w-5 h-5" />
              </button>

              <button
                onClick={togglePlayback}
                className="p-3 bg-primary-500 hover:bg-primary-600 rounded-full transition-colors"
              >
                {playbackState.isPlaying ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6 ml-0.5" />
                )}
              </button>

              <button
                onClick={skipForward}
                disabled={playbackState.currentSegmentIndex === timeline.segments.length - 1}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-4">
              {/* Auto-switch toggle */}
              <button
                onClick={() => setPlaybackState(prev => ({ ...prev, autoSwitch: !prev.autoSwitch }))}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
                  playbackState.autoSwitch
                    ? 'bg-primary-500/20 text-primary-400'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span className="text-sm">Auto-switch</span>
              </button>

              {/* Volume */}
              <div className="flex items-center gap-2">
                <button onClick={toggleMute} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-5 h-5" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
                  className="w-20 accent-primary-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Video Thumbnails - Switch between videos */}
        <VideoThumbnails
          videos={timeline.videos}
          currentVideoId={currentVideoId}
          segment={currentSegment}
          onVideoSelect={switchToVideoById}
        />
      </div>

      {/* Sidebar - Insights */}
      <div className="lg:w-80 flex flex-col gap-4">
        {/* Segment List */}
        <div className="glass rounded-xl p-4 flex-1 overflow-auto max-h-[400px]">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-primary-400" />
            Segments
          </h3>
          <div className="space-y-2">
            {timeline.segments.map((segment, index) => (
              <button
                key={segment.id}
                onClick={() => goToSegment(index)}
                className={`w-full text-left p-3 rounded-lg transition-all ${
                  index === playbackState.currentSegmentIndex
                    ? 'bg-primary-500/20 border border-primary-500/50'
                    : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">#{index + 1}</span>
                  <span className="font-medium text-sm">{segment.topic}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                  {segment.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* AI Insights */}
        {insights && (
          <div className="glass rounded-xl overflow-hidden">
            <button
              onClick={() => setShowInsights(!showInsights)}
              className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
            >
              <span className="font-semibold flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-400" />
                AI Insights
              </span>
              {showInsights ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {showInsights && (
              <div className="p-4 pt-0 space-y-4">
                {insights.convergencePoints.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-green-400 mb-2">
                      Points of Agreement
                    </h4>
                    <ul className="space-y-1">
                      {insights.convergencePoints.map((point, i) => (
                        <li key={i} className="text-sm text-gray-400 flex gap-2">
                          <span className="text-green-400">+</span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {insights.divergencePoints.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-orange-400 mb-2">
                      Different Perspectives
                    </h4>
                    <ul className="space-y-1">
                      {insights.divergencePoints.map((point, i) => (
                        <li key={i} className="text-sm text-gray-400 flex gap-2">
                          <span className="text-orange-400">~</span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {insights.uniquePerspectives.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-purple-400 mb-2 flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      Unique Insights
                    </h4>
                    <ul className="space-y-2">
                      {insights.uniquePerspectives.map((item, i) => {
                        const videoIndex = timeline.videos.findIndex(v => v.id === item.videoId)
                        return (
                          <li key={i} className="text-sm">
                            <span className={getVideoColor(videoIndex).text}>
                              Video {videoIndex + 1}:
                            </span>
                            <span className="text-gray-400 ml-1">{item.insight}</span>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Keyboard Shortcuts */}
        <div className="glass rounded-xl p-4">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Keyboard Shortcuts</h3>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
            <div><kbd className="px-1.5 py-0.5 bg-white/10 rounded">Space</kbd> Play/Pause</div>
            <div><kbd className="px-1.5 py-0.5 bg-white/10 rounded">M</kbd> Mute</div>
            <div><kbd className="px-1.5 py-0.5 bg-white/10 rounded">←</kbd> Prev segment</div>
            <div><kbd className="px-1.5 py-0.5 bg-white/10 rounded">→</kbd> Next segment</div>
            <div><kbd className="px-1.5 py-0.5 bg-white/10 rounded">A</kbd> Auto-switch</div>
          </div>
        </div>
      </div>
    </div>
  )
}
