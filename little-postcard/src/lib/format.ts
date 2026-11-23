/** 248 → "4:08" */
export function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/** 248 → "4 phút 8 giây", for screen readers. */
export function formatDurationLong(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return seconds ? `${minutes} phút ${seconds} giây` : `${minutes} phút`;
}

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Ho_Chi_Minh",
});

/** "2026-11-18T07:00:00+07:00" → "18 tháng 11, 2026" */
export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}
