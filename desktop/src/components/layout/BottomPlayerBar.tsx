import React, { useState } from "react";
import { useNavigate } from "react-router";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  ListMusic,
  Moon,
  Download,
  X,
  Trash2,
  ArrowUp,
  ArrowDown,
  Loader2,
} from "lucide-react";
import { useAudioStore, type SleepTimerMode } from "../../stores/audioStore";
import { useDownloadsStore } from "../../stores/downloadsStore";
import { useSettingsStore } from "../../stores/settingsStore";
import { useI18n } from "../../hooks/useI18n";
import { Button } from "../ui";

function formatClock(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

export const BottomPlayerBar: React.FC = () => {
  const { dict } = useI18n();
  const navigate = useNavigate();
  const showToast = useSettingsStore((s) => s.showToast);

  const currentTrack = useAudioStore((s) => s.currentTrack);
  const isPlaying = useAudioStore((s) => s.isPlaying);
  const isBuffering = useAudioStore((s) => s.isBuffering);
  const currentTime = useAudioStore((s) => s.currentTime);
  const duration = useAudioStore((s) => s.duration);
  const playbackRate = useAudioStore((s) => s.playbackRate);
  const volume = useAudioStore((s) => s.volume);
  const muted = useAudioStore((s) => s.muted);
  const repeatMode = useAudioStore((s) => s.repeatMode);
  const sleepTimerMode = useAudioStore((s) => s.sleepTimerMode);
  const queue = useAudioStore((s) => s.queue);
  const error = useAudioStore((s) => s.error);

  const togglePlayPause = useAudioStore((s) => s.togglePlayPause);
  const seekTo = useAudioStore((s) => s.seekTo);
  const skipNext = useAudioStore((s) => s.skipNext);
  const skipPrevious = useAudioStore((s) => s.skipPrevious);
  const setPlaybackRate = useAudioStore((s) => s.setPlaybackRate);
  const setVolume = useAudioStore((s) => s.setVolume);
  const toggleMute = useAudioStore((s) => s.toggleMute);
  const cycleRepeatMode = useAudioStore((s) => s.cycleRepeatMode);
  const setSleepTimer = useAudioStore((s) => s.setSleepTimer);
  const removeFromQueue = useAudioStore((s) => s.removeFromQueue);
  const reorderQueue = useAudioStore((s) => s.reorderQueue);
  const clearQueue = useAudioStore((s) => s.clearQueue);
  const closePlayer = useAudioStore((s) => s.closePlayer);

  const startDownload = useDownloadsStore((s) => s.startDownload);

  const [queueOpen, setQueueOpen] = useState(false);
  const [sleepOpen, setSleepOpen] = useState(false);

  if (!currentTrack) return null;

  const cycleSpeed = () => {
    const idx = SPEEDS.indexOf(playbackRate);
    const next = SPEEDS[(idx + 1) % SPEEDS.length] ?? 1;
    setPlaybackRate(next);
  };

  const handleDownloadCurrent = () => {
    const id = `${currentTrack.reciterId}:${currentTrack.chapter}:${currentTrack.verse ?? "full"}`;
    const fileName = currentTrack.verse
      ? `${currentTrack.reciterId}-s${currentTrack.chapter}-v${currentTrack.verse}.mp3`
      : `${currentTrack.reciterId}-s${String(currentTrack.chapter).padStart(3, "0")}.mp3`;
    void startDownload({
      id,
      reciterId: currentTrack.reciterId,
      reciterName: currentTrack.reciterName,
      chapter: currentTrack.chapter,
      surahName: currentTrack.surahName,
      url: currentTrack.audioUrl,
      relativePath: `downloads/${fileName}`,
    });
    showToast(`${dict.audio.downloading}: ${currentTrack.surahName}`, "info");
  };

  const sleepOptions: { mode: SleepTimerMode; label: string }[] = [
    { mode: "off", label: dict.audio.sleepOff },
    { mode: "15", label: dict.audio.sleepMinutes.replace("{{n}}", "15") },
    { mode: "30", label: dict.audio.sleepMinutes.replace("{{n}}", "30") },
    { mode: "45", label: dict.audio.sleepMinutes.replace("{{n}}", "45") },
    { mode: "60", label: dict.audio.sleepMinutes.replace("{{n}}", "60") },
    { mode: "end_of_surah", label: dict.audio.sleepEndOfSurah },
  ];

  return (
    <footer
      aria-label="Audio player"
      className="relative z-30 flex h-[72px] shrink-0 items-center justify-between gap-4 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4"
    >
      {/* Left: Track info */}
      <div className="flex min-w-0 w-60 items-center gap-3">
        <button
          type="button"
          onClick={() =>
            navigate(
              `/quran/${currentTrack.chapter}${currentTrack.verse ? `?verse=${currentTrack.verse}` : ""}`,
            )
          }
          className="min-w-0 text-start hover:underline cursor-pointer"
        >
          <div className="truncate text-[14px] font-semibold text-[var(--color-text)]">
            {currentTrack.surahName}
            {currentTrack.verse ? ` · ${currentTrack.chapter}:${currentTrack.verse}` : ""}
          </div>
          <div className="truncate text-[12px] text-[var(--color-text-muted)]">
            {error ? (
              <span className="text-[var(--color-error)]">{error}</span>
            ) : (
              currentTrack.reciterName
            )}
          </div>
        </button>
      </div>

      {/* Center: Transport + Seek */}
      <div className="flex flex-1 max-w-xl flex-col items-center gap-1">
        <div className="flex items-center gap-2">
          <Button
            variant="icon"
            size="sm"
            onClick={skipPrevious}
            aria-label={dict.common.previous}
          >
            <SkipBack size={16} strokeWidth={1.75} />
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => togglePlayPause()}
            aria-label={isPlaying ? dict.common.pause : dict.common.play}
            className="h-8 w-8 !px-0 rounded-full"
          >
            {isBuffering ? (
              <Loader2 size={16} strokeWidth={1.75} className="animate-spin" />
            ) : isPlaying ? (
              <Pause size={16} strokeWidth={1.75} />
            ) : (
              <Play size={16} strokeWidth={1.75} />
            )}
          </Button>
          <Button variant="icon" size="sm" onClick={skipNext} aria-label={dict.common.next}>
            <SkipForward size={16} strokeWidth={1.75} />
          </Button>
        </div>
        <div className="flex w-full items-center gap-2.5 text-[11px] tabular-nums text-[var(--color-text-muted)]">
          <span className="w-9 text-end">{formatClock(currentTime)}</span>
          <input
            type="range"
            aria-label="Seek audio"
            min={0}
            max={duration || 100}
            step={0.5}
            value={Math.min(currentTime, duration || 100)}
            onChange={(e) => seekTo(Number(e.target.value))}
            className="h-1 flex-1 cursor-pointer accent-[var(--color-primary)]"
          />
          <span className="w-9">{formatClock(duration)}</span>
        </div>
      </div>

      {/* Right: Speed, Repeat, Sleep, Volume, Queue, Download, Close */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={cycleSpeed}
          aria-label={dict.audio.speed}
          className="px-2 tabular-nums text-[12px]"
        >
          {playbackRate}x
        </Button>

        <Button
          variant="icon"
          size="sm"
          onClick={cycleRepeatMode}
          aria-label={
            repeatMode === "verse"
              ? dict.audio.repeatVerse
              : repeatMode === "surah"
                ? dict.audio.repeatSurah
                : dict.audio.repeatOff
          }
          className={repeatMode !== "off" ? "!text-[var(--color-primary)]" : ""}
        >
          {repeatMode === "verse" ? (
            <Repeat1 size={16} strokeWidth={1.75} />
          ) : (
            <Repeat size={16} strokeWidth={1.75} />
          )}
        </Button>

        {/* Sleep timer */}
        <div className="relative">
          <Button
            variant="icon"
            size="sm"
            onClick={() => {
              setSleepOpen((v) => !v);
              setQueueOpen(false);
            }}
            aria-label={dict.audio.sleepTimer}
            className={sleepTimerMode !== "off" ? "!text-[var(--color-primary)]" : ""}
          >
            <Moon size={16} strokeWidth={1.75} />
          </Button>
          {sleepOpen && (
            <div
              className="absolute bottom-11 end-0 z-40 w-44 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)] py-1.5"
              style={{ boxShadow: "var(--shadow-popover)" }}
            >
              <div className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                {dict.audio.sleepTimer}
              </div>
              {sleepOptions.map((opt) => (
                <button
                  key={opt.mode}
                  type="button"
                  onClick={() => {
                    setSleepTimer(opt.mode);
                    setSleepOpen(false);
                  }}
                  className={`flex w-full items-center justify-between px-3 py-1.5 text-[13px] hover:bg-[var(--color-surface-2)] cursor-pointer ${
                    sleepTimerMode === opt.mode
                      ? "font-semibold text-[var(--color-primary)]"
                      : "text-[var(--color-text)]"
                  }`}
                >
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Volume */}
        <div className="hidden md:flex items-center gap-1">
          <Button
            variant="icon"
            size="sm"
            onClick={toggleMute}
            aria-label={muted ? dict.audio.unmute : dict.audio.mute}
          >
            {muted || volume === 0 ? (
              <VolumeX size={16} strokeWidth={1.75} />
            ) : (
              <Volume2 size={16} strokeWidth={1.75} />
            )}
          </Button>
          <input
            type="range"
            aria-label={dict.audio.volume}
            min={0}
            max={1}
            step={0.05}
            value={muted ? 0 : volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="h-1 w-16 cursor-pointer accent-[var(--color-primary)]"
          />
        </div>

        {/* Queue popover */}
        <div className="relative">
          <Button
            variant="icon"
            size="sm"
            onClick={() => {
              setQueueOpen((v) => !v);
              setSleepOpen(false);
            }}
            aria-label={dict.audio.queue}
            className={queueOpen ? "!text-[var(--color-primary)]" : ""}
          >
            <ListMusic size={16} strokeWidth={1.75} />
          </Button>
          {queueOpen && (
            <div
              className="absolute bottom-11 end-0 z-40 w-80 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface)]"
              style={{ boxShadow: "var(--shadow-popover)" }}
            >
              <div className="flex items-center justify-between border-b border-[var(--color-border)] px-3.5 py-2.5">
                <span className="text-[13px] font-semibold">
                  {dict.audio.queue} ({queue.length})
                </span>
                {queue.length > 0 && (
                  <button
                    type="button"
                    onClick={clearQueue}
                    className="text-[12px] text-[var(--color-text-muted)] hover:text-[var(--color-error)] cursor-pointer"
                  >
                    {dict.audio.clearQueue}
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-[var(--color-border)]">
                {queue.length === 0 ? (
                  <div className="py-8 text-center text-[13px] text-[var(--color-text-muted)]">
                    {dict.audio.queueEmpty}
                  </div>
                ) : (
                  queue.slice(0, 40).map((t, idx) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between gap-2 px-3.5 py-2 text-[13px]"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium">
                          {t.surahName}
                          {t.verse ? ` : ${t.verse}` : ""}
                        </div>
                        <div className="truncate text-[11px] text-[var(--color-text-muted)]">
                          {t.reciterName}
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        {idx > 0 && (
                          <Button
                            variant="icon"
                            size="sm"
                            onClick={() => reorderQueue(idx, idx - 1)}
                            aria-label="Move up"
                            className="h-7 w-7"
                          >
                            <ArrowUp size={13} />
                          </Button>
                        )}
                        {idx < queue.length - 1 && (
                          <Button
                            variant="icon"
                            size="sm"
                            onClick={() => reorderQueue(idx, idx + 1)}
                            aria-label="Move down"
                            className="h-7 w-7"
                          >
                            <ArrowDown size={13} />
                          </Button>
                        )}
                        <Button
                          variant="icon"
                          size="sm"
                          onClick={() => removeFromQueue(idx)}
                          aria-label={dict.common.delete}
                          className="h-7 w-7"
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <Button
          variant="icon"
          size="sm"
          onClick={handleDownloadCurrent}
          aria-label={dict.audio.download}
        >
          <Download size={16} strokeWidth={1.75} />
        </Button>

        <Button
          variant="icon"
          size="sm"
          onClick={closePlayer}
          aria-label={dict.common.close}
        >
          <X size={16} strokeWidth={1.75} />
        </Button>
      </div>
    </footer>
  );
};
