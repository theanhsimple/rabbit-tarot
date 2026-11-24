/** DEVELOPMENT MOCK DATA — see src/data/videos.ts. */
import type { Category } from "@/types/category";

export const categories: Category[] = [
  {
    id: "cat_nature",
    slug: "thien-nhien",
    label: "Thiên nhiên",
    description: "Rừng, núi, sương sớm và những cơn gió.",
  },
  {
    id: "cat_music",
    slug: "am-nhac",
    label: "Âm nhạc",
    description: "Tiếng nước, tiếng gió — những thước phim để lắng nghe.",
  },
  {
    id: "cat_art",
    slug: "nghe-thuat",
    label: "Nghệ thuật",
    description: "Ánh sáng, màu sắc và bố cục của đời thường.",
  },
  {
    id: "cat_travel",
    slug: "nhung-chuyen-di",
    label: "Những chuyến đi",
    description: "Những nơi chốn đã đi qua và muốn quay lại.",
  },
  {
    id: "cat_reflection",
    slug: "chiem-nghiem",
    label: "Chiêm nghiệm",
    description: "Chậm rãi, để nghĩ về điều quan trọng.",
  },
  {
    id: "cat_moments",
    slug: "nhung-khoanh-khac",
    label: "Những khoảnh khắc",
    description: "Những điều nhỏ bé dễ bị bỏ lỡ.",
  },
];
