/** DEVELOPMENT MOCK DATA — see src/data/videos.ts. */
import type { Mood } from "@/types/mood";

export const moods: Mood[] = [
  { id: "mood_calm", slug: "binh-yen", label: "Bình yên", description: "Cho những lúc cần chậm lại" },
  { id: "mood_hope", slug: "hy-vong", label: "Hy vọng", description: "Ánh sáng sau một ngày dài" },
  { id: "mood_nostalgia", slug: "hoai-niem", label: "Hoài niệm", description: "Những điều đã cũ mà vẫn ấm" },
  { id: "mood_quiet", slug: "lang-le", label: "Lặng lẽ", description: "Không cần nói gì thêm" },
  { id: "mood_relax", slug: "thu-gian", label: "Thư giãn", description: "Thả lỏng vai, thở thật sâu" },
  { id: "mood_inspired", slug: "cam-hung", label: "Cảm hứng", description: "Một tia sáng để bắt đầu" },
];
