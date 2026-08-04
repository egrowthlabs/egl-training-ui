'use client'

import { useEffect, useRef } from 'react'
import videojs from 'video.js'
import 'video.js/dist/video-js.css'
import type Player from 'video.js/dist/types/player'

interface VideoPlayerProps {
  src: string
  poster?: string
  className?: string
}

export function VideoPlayer({ src, poster, className }: VideoPlayerProps) {
  const videoRef  = useRef<HTMLDivElement>(null)
  const playerRef = useRef<Player | null>(null)

  useEffect(() => {
    if (!videoRef.current) return

    if (!playerRef.current) {
      const videoEl = document.createElement('video-js')
      videoEl.classList.add('vjs-big-play-centered')
      videoRef.current.appendChild(videoEl)

      playerRef.current = videojs(videoEl, {
        autoplay:    false,
        controls:    true,
        responsive:  true,
        fluid:       true,
        poster,
        sources: [{ src, type: 'video/mp4' }],
        playbackRates: [0.75, 1, 1.25, 1.5],
      })
    } else {
      const player = playerRef.current
      player.src([{ src, type: 'video/mp4' }])
      if (poster) player.poster(poster)
    }
  }, [src, poster])

  useEffect(() => {
    return () => {
      if (playerRef.current && !playerRef.current.isDisposed()) {
        playerRef.current.dispose()
        playerRef.current = null
      }
    }
  }, [])

  return (
    <div
      ref={videoRef}
      className={className}
      data-vjs-player
    />
  )
}
