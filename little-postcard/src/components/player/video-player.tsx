"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { LoaderCircle, Maximize, Minimize, Pause, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { cn } from "cn";
import { ErrorState } from "@/components/shared/error-state";
import { Button } from "@/components/ui/button";
import { formatDuration, formatDurationLong } from "@/lib/format";

interface VideoPlayerProps {
  src: string;
  poster: string;
  title: string;
  /** Shown before the media's own metadata has loaded. */
  durationSeconds?: number;
  className?: string;
}

type WebkitVideo = HTMLVideoElement & { webkitEnterFullscreen?: () => void };

const ERROR_MESSAGES: Record<number, string> = {
  1: "Việc phát đã bị dừng.",
  2: "Không tải được thước phim do lỗi mạng.",
  3: "Không giải mã được thước phim này.",
  4: "Trình duyệt không hỗ trợ định dạng của thước phim này.",
};

/**
 * 16:9 player with custom controls driven entirely by the media element's
 * own events — every state shown (loading, playing, buffered, error) is the
 * browser's real playback state.
 */
export function VideoPlayer({ src, poster, title, durationSeconds = 0, className }: VideoPlayerProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<WebkitVideo>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [ended, setEnded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(durationSeconds);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [idle, setIdle] = useState(false);

  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === frameRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      clearTimeout(idleTimer.current);
    };
  }, []);

  const video = () => videoRef.current;

  function play() {
    const el = video();
    if (!el) return;
    setStarted(true);
    setEnded(false);
    if (el.readyState < HTMLMediaElement.HAVE_FUTURE_DATA) setWaiting(true);
    // play() rejects if interrupted by pause() or blocked; real failures
    // surface through the element's "error" event.
    el.play().catch(() => {});
  }

  function togglePlay() {
    const el = video();
    if (!el) return;
    if (el.paused || el.ended) play();
    else el.pause();
  }

  function retry() {
    const el = video();
    if (!el) return;
    setError(null);
    setWaiting(true);
    el.load();
    play();
  }

  function seek(seconds: number) {
    const el = video();
    if (!el || !Number.isFinite(seconds)) return;
    el.currentTime = Math.min(Math.max(seconds, 0), el.duration || duration);
    setCurrent(el.currentTime);
  }

  function changeVolume(next: number) {
    const el = video();
    if (!el) return;
    el.volume = next;
    el.muted = next === 0;
  }

  function toggleMute() {
    const el = video();
    if (!el) return;
    if (el.muted && el.volume === 0) el.volume = 0.6;
    el.muted = !el.muted;
  }

  async function toggleFullscreen() {
    const frame = frameRef.current;
    const el = video();
    if (!frame || !el) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else if (frame.requestFullscreen) {
      await frame.requestFullscreen().catch(() => {});
    } else {
      el.webkitEnterFullscreen?.(); // iOS Safari
    }
  }

  function wake() {
    setIdle(false);
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setIdle(true), 2500);
  }

  function onKeyDown(event: React.KeyboardEvent) {
    const target = event.target as HTMLElement;
    const onRange = target instanceof HTMLInputElement && target.type === "range";
    const onButton = target.tagName === "BUTTON";
    switch (event.key) {
      case " ":
      case "k":
        if (onButton && event.key === " ") return; // let the button act
        event.preventDefault();
        togglePlay();
        break;
      case "m":
        toggleMute();
        break;
      case "f":
        void toggleFullscreen();
        break;
      case "ArrowLeft":
      case "ArrowRight":
        if (onRange) return; // the slider handles its own arrows
        event.preventDefault();
        seek((video()?.currentTime ?? 0) + (event.key === "ArrowLeft" ? -5 : 5));
        break;
      default:
        return;
    }
    wake();
  }

  const progress = duration > 0 ? (current / duration) * 100 : 0;
  const bufferedPct = duration > 0 ? (buffered / duration) * 100 : 0;
  const showControls = started && !error;
  const controlsHidden = playing && idle && !waiting;
  const effectiveVolume = muted ? 0 : volume;

  return (
    <div
      ref={frameRef}
      onKeyDown={onKeyDown}
      onPointerMove={started ? wake : undefined}
      onFocusCapture={started ? wake : undefined}
      data-idle={controlsHidden || undefined}
      className={cn(
        "group/player relative isolate aspect-video w-full overflow-hidden bg-media text-white",
        controlsHidden && "cursor-none",
        className,
      )}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        preload="none"
        playsInline
        aria-label={title}
        onClick={togglePlay}
        className="absolute inset-0 h-full w-full object-contain"
        onPlay={() => {
          setPlaying(true);
          setEnded(false);
          wake();
        }}
        onPause={() => {
          setPlaying(false);
          setIdle(false);
        }}
        onWaiting={() => setWaiting(true)}
        onPlaying={() => setWaiting(false)}
        onCanPlay={() => setWaiting(false)}
        onSeeked={() => setWaiting(false)}
        onEnded={() => {
          setEnded(true);
          setPlaying(false);
          setIdle(false);
        }}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onDurationChange={(e) => {
          const d = e.currentTarget.duration;
          if (Number.isFinite(d) && d > 0) setDuration(d);
        }}
        onProgress={(e) => {
          const ranges = e.currentTarget.buffered;
          if (ranges.length) setBuffered(ranges.end(ranges.length - 1));
        }}
        onVolumeChange={(e) => {
          setVolume(e.currentTarget.volume);
          setMuted(e.currentTarget.muted);
        }}
        onError={(e) => {
          const code = e.currentTarget.error?.code ?? 0;
          setError(ERROR_MESSAGES[code] ?? "Không phát được thước phim này.");
          setWaiting(false);
          setPlaying(false);
        }}
      />

      {/* Poster + start button, before first play */}
      {!started ? (
        <button
          type="button"
          onClick={play}
          className="group/start absolute inset-0 z-10 flex items-center justify-center"
        >
          <Image
            src={poster}
            alt=""
            fill
            preload
            sizes="(min-width: 1376px) 1280px, 100vw"
            className="-z-10 object-cover"
          />
          <span aria-hidden className="absolute inset-0 -z-10 bg-media/20 transition-colors duration-500 group-hover/start:bg-media/30" />
          <span className="flex size-20 items-center justify-center rounded-full border border-white/60 bg-media/30 backdrop-blur-[2px] transition-transform duration-500 ease-soft group-hover/start:scale-105 md:size-24">
            <Play aria-hidden className="ml-1 size-7 fill-white md:size-8" strokeWidth={1} />
          </span>
          <span className="sr-only">Phát “{title}”</span>
          <span className="absolute bottom-5 left-5 text-xs tracking-[0.18em] text-white/80 uppercase md:bottom-7 md:left-7">
            {formatDuration(duration)}
          </span>
        </button>
      ) : null}

      {/* Buffering */}
      {waiting && !error ? (
        <div role="status" className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <LoaderCircle aria-hidden className="size-10 animate-spin text-white/85" strokeWidth={1.25} />
          <span className="sr-only">Đang tải thước phim…</span>
        </div>
      ) : null}

      {/* Replay */}
      {ended && !error ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-media/45">
          <Button variant="outline-inverse" size="lg" onClick={play}>
            <RotateCcw aria-hidden />
            Xem lại
          </Button>
        </div>
      ) : null}

      {/* Error */}
      {error ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-media/85">
          <ErrorState tone="inverse" title="Không phát được thước phim." description={error}>
            <Button variant="outline-inverse" onClick={retry}>
              <RotateCcw aria-hidden />
              Thử lại
            </Button>
          </ErrorState>
        </div>
      ) : null}

      {/* Controls */}
      {showControls ? (
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 z-10 bg-[linear-gradient(to_top,rgba(23,25,22,0.75),rgba(23,25,22,0))] px-3 pt-10 pb-1 transition-opacity duration-500 md:px-5",
            controlsHidden ? "opacity-0" : "opacity-100",
          )}
        >
          <input
            type="range"
            aria-label="Tiến trình"
            aria-valuetext={`${formatDurationLong(Math.floor(current))} trên ${formatDurationLong(Math.floor(duration))}`}
            min={0}
            max={duration || 0}
            step={0.1}
            value={Math.min(current, duration || 0)}
            onChange={(e) => seek(Number(e.target.value))}
            style={{ "--fill": `${progress}%`, "--buffer": `${bufferedPct}%` } as React.CSSProperties}
            className="media-range block w-full"
          />
          <div className="-mt-1 flex items-center gap-1">
            <ControlButton label={playing ? "Tạm dừng" : "Phát"} onClick={togglePlay}>
              {playing ? <Pause aria-hidden className="fill-white" /> : <Play aria-hidden className="fill-white" />}
            </ControlButton>
            <ControlButton label={muted || volume === 0 ? "Bật tiếng" : "Tắt tiếng"} onClick={toggleMute}>
              {muted || volume === 0 ? <VolumeX aria-hidden /> : <Volume2 aria-hidden />}
            </ControlButton>
            <input
              type="range"
              aria-label="Âm lượng"
              aria-valuetext={`${Math.round(effectiveVolume * 100)}%`}
              min={0}
              max={1}
              step={0.05}
              value={effectiveVolume}
              onChange={(e) => changeVolume(Number(e.target.value))}
              style={{ "--fill": `${effectiveVolume * 100}%`, "--buffer": "0%" } as React.CSSProperties}
              className="media-range w-20 pointer-coarse:hidden"
            />
            <p className="ml-2 text-xs text-white/85 tabular-nums">
              <span aria-hidden>
                {formatDuration(current)} <span className="text-white/50">/ {formatDuration(duration)}</span>
              </span>
            </p>
            <ControlButton
              label={fullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
              onClick={() => void toggleFullscreen()}
              className="ml-auto"
            >
              {fullscreen ? <Minimize aria-hidden /> : <Maximize aria-hidden />}
            </ControlButton>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ControlButton({
  label,
  onClick,
  children,
  className,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex size-11 items-center justify-center rounded-sm text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent [&_svg]:size-[1.125rem]",
        className,
      )}
    >
      {children}
    </button>
  );
}
