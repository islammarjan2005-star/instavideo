'use client'

import { useEffect, useRef, useCallback } from 'react'
import { YouTubePlayer, PlayerState } from '@/lib/types'

interface Props {
  videoId: string
  isActive: boolean
  onPlayerReady: (player: YouTubePlayer) => void
  onStateChange: (state: number) => void
  onTimeUpdate: (time: number) => void
  onDurationUpdate: (duration: number) => void
}

// Extend window to include YouTube API
declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}

export default function YouTubeEmbed({
  videoId,
  isActive,
  onPlayerReady,
  onStateChange,
  onTimeUpdate,
  onDurationUpdate
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YouTubePlayer | null>(null)
  const timeUpdateInterval = useRef<NodeJS.Timeout | null>(null)

  const startTimeUpdates = useCallback(() => {
    if (timeUpdateInterval.current) {
      clearInterval(timeUpdateInterval.current)
    }

    timeUpdateInterval.current = setInterval(() => {
      if (playerRef.current && isActive) {
        try {
          const time = playerRef.current.getCurrentTime()
          if (typeof time === 'number') {
            onTimeUpdate(time)
          }
        } catch (e) {
          // Player might not be ready
        }
      }
    }, 250) // Update 4 times per second
  }, [isActive, onTimeUpdate])

  const stopTimeUpdates = useCallback(() => {
    if (timeUpdateInterval.current) {
      clearInterval(timeUpdateInterval.current)
      timeUpdateInterval.current = null
    }
  }, [])

  useEffect(() => {
    // Load YouTube IFrame API if not already loaded
    if (!window.YT) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      const firstScriptTag = document.getElementsByTagName('script')[0]
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)
    }

    const initPlayer = () => {
      if (!containerRef.current) return

      // Create a unique ID for this player
      const playerId = `youtube-player-${videoId}`
      containerRef.current.id = playerId

      playerRef.current = new window.YT.Player(playerId, {
        videoId,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 0,
          controls: 0, // Hide YouTube controls, we'll use our own
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          fs: 0,
          playsinline: 1,
          enablejsapi: 1,
          origin: window.location.origin
        },
        events: {
          onReady: (event: any) => {
            onPlayerReady(event.target)

            // Get duration
            try {
              const duration = event.target.getDuration()
              if (duration > 0) {
                onDurationUpdate(duration)
              }
            } catch (e) {
              // Duration not available yet
            }
          },
          onStateChange: (event: any) => {
            onStateChange(event.data)

            // Start/stop time updates based on playback state
            if (event.data === PlayerState.PLAYING) {
              startTimeUpdates()
            } else if (
              event.data === PlayerState.PAUSED ||
              event.data === PlayerState.ENDED
            ) {
              stopTimeUpdates()
            }
          }
        }
      })
    }

    // Wait for API to be ready
    if (window.YT && window.YT.Player) {
      initPlayer()
    } else {
      window.onYouTubeIframeAPIReady = initPlayer
    }

    return () => {
      stopTimeUpdates()
      if (playerRef.current) {
        try {
          playerRef.current.destroy()
        } catch (e) {
          // Player already destroyed
        }
      }
    }
  }, [videoId, onPlayerReady, onStateChange, onDurationUpdate, startTimeUpdates, stopTimeUpdates])

  // Handle active state changes
  useEffect(() => {
    if (isActive) {
      startTimeUpdates()
    } else {
      stopTimeUpdates()
    }
  }, [isActive, startTimeUpdates, stopTimeUpdates])

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
    />
  )
}
