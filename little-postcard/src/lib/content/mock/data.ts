/**
 * DEVELOPMENT MOCK DATA — not production content.
 *
 * Loaded only through `createMockRepository`, which `getContentRepository`
 * selects when CONTENT_SOURCE=mock (or in `next dev` with no source set).
 * A production build without an explicit CONTENT_SOURCE fails instead of
 * falling back to this file. See src/lib/content/index.ts.
 *
 * Photographs: Unsplash (unsplash.com/license), stored in
 * public/images/postcards. Titles and copy are placeholders.
 */
import type { Category, Mood, Video } from "../types";

export const mockMoods: Mood[] = [
  { slug: "binh-yen", label: "Bình yên", description: "Cho những lúc cần chậm lại" },
  { slug: "hy-vong", label: "Hy vọng", description: "Ánh sáng sau một ngày dài" },
  { slug: "hoai-niem", label: "Hoài niệm", description: "Những điều đã cũ mà vẫn ấm" },
  { slug: "lang-le", label: "Lặng lẽ", description: "Không cần nói gì thêm" },
  { slug: "thu-gian", label: "Thư giãn", description: "Thả lỏng vai, thở thật sâu" },
  { slug: "cam-hung", label: "Cảm hứng", description: "Một tia sáng để bắt đầu" },
];

export const mockCategories: Category[] = [
  {
    slug: "thien-nhien",
    label: "Thiên nhiên",
    description: "Rừng, núi, sương sớm và những cơn gió.",
  },
  {
    slug: "am-nhac",
    label: "Âm nhạc",
    description: "Những thước phim để lắng nghe nhiều hơn là xem.",
  },
  {
    slug: "nghe-thuat",
    label: "Nghệ thuật",
    description: "Ánh sáng, màu sắc và bố cục của đời thường.",
  },
  {
    slug: "nhung-chuyen-di",
    label: "Những chuyến đi",
    description: "Những nơi chốn đã đi qua và muốn quay lại.",
  },
  {
    slug: "chiem-nghiem",
    label: "Chiêm nghiệm",
    description: "Chậm rãi, để nghĩ về điều quan trọng.",
  },
  {
    slug: "nhung-khoanh-khac",
    label: "Những khoảnh khắc",
    description: "Những điều nhỏ bé dễ bị bỏ lỡ.",
  },
];

export const mockVideos: Video[] = [
  {
    id: "pc-010",
    title: "Sương sớm trên đồi",
    slug: "suong-som-tren-doi",
    shortDescription: "Mặt trời lên chậm qua những lớp sương còn vương trên sườn đồi.",
    description:
      "Một buổi sáng không vội vã. Sương còn nằm trên những sườn đồi, mặt trời lên chậm, và con đường nhỏ dẫn về phía xa như chưa từng có ai đi qua. Bốn phút để thở cùng nhịp của ngày mới.",
    thumbnailUrl: "/images/postcards/suong-som-tren-doi.jpg",
    durationSeconds: 248,
    category: "thien-nhien",
    moods: ["binh-yen", "hy-vong"],
    publishedAt: "2026-11-18T07:00:00+07:00",
    isFeatured: true,
  },
  {
    id: "pc-009",
    title: "Một buổi sáng ở vịnh",
    slug: "mot-buoi-sang-o-vinh",
    shortDescription: "Những chiếc thuyền nhỏ trôi giữa các đảo đá khi nắng vừa lên.",
    description:
      "Nước vịnh phẳng lặng, những chiếc thuyền nhỏ chậm rãi rời bến. Đảo đá hiện dần ra trong nắng sớm, từng lớp một. Một tấm bưu thiếp gửi từ chuyến đi chưa muốn kết thúc.",
    thumbnailUrl: "/images/postcards/mot-buoi-sang-o-vinh.jpg",
    durationSeconds: 312,
    category: "nhung-chuyen-di",
    moods: ["thu-gian", "cam-hung"],
    publishedAt: "2026-11-14T08:00:00+07:00",
    isFeatured: false,
  },
  {
    id: "pc-008",
    title: "Tiếng thở của biển",
    slug: "tieng-tho-cua-bien",
    shortDescription: "Mặt nước lên xuống đều đặn, như một hơi thở dài.",
    description:
      "Không có bờ, không có chân trời — chỉ có mặt nước lên xuống đều đặn. Một thước phim để nghe nhiều hơn là xem, dành cho những đêm khó ngủ.",
    thumbnailUrl: "/images/postcards/tieng-tho-cua-bien.jpg",
    durationSeconds: 426,
    category: "am-nhac",
    moods: ["binh-yen", "lang-le"],
    publishedAt: "2026-11-09T21:00:00+07:00",
    isFeatured: false,
  },
  {
    id: "pc-007",
    title: "Ánh sáng trong rừng thông",
    slug: "anh-sang-trong-rung-thong",
    shortDescription: "Nắng chiều xuyên qua tán thông, rơi xuống lối mòn.",
    description:
      "Những thân thông cao thẳng, nắng chiều len qua từng kẽ lá và rơi xuống lối mòn phủ đầy lá khô. Tiếng chim xa, tiếng gió gần. Một khoảng xanh để trở về.",
    thumbnailUrl: "/images/postcards/anh-sang-trong-rung-thong.jpg",
    durationSeconds: 195,
    category: "thien-nhien",
    moods: ["binh-yen", "hy-vong"],
    publishedAt: "2026-11-03T16:30:00+07:00",
    isFeatured: false,
  },
  {
    id: "pc-006",
    title: "Căn nhà nhỏ trên đồi",
    slug: "can-nha-nho-tren-doi",
    shortDescription: "Một mái nhà đỏ giữa trời trắng, và những bông hoa dại.",
    description:
      "Một căn nhà nhỏ đứng một mình giữa trời trắng. Không có ai, chỉ có gió và những bông hoa dại khẽ lay. Một thước phim về sự lặng lẽ và những nơi ta từng gọi là nhà.",
    thumbnailUrl: "/images/postcards/can-nha-nho-tren-doi.jpg",
    durationSeconds: 164,
    category: "nhung-khoanh-khac",
    moods: ["hoai-niem", "lang-le"],
    publishedAt: "2026-10-27T10:00:00+07:00",
    isFeatured: false,
  },
  {
    id: "pc-005",
    title: "Những lớp núi lúc hoàng hôn",
    slug: "nhung-lop-nui-luc-hoang-hon",
    shortDescription: "Núi chồng lên núi, nhạt dần vào ánh chiều.",
    description:
      "Núi chồng lên núi, mỗi lớp nhạt hơn lớp trước, cho đến khi hoà vào ánh chiều. Một người nhỏ bé đứng trên đỉnh, nhìn về phía xa. Có những điều chỉ thấy rõ khi đứng đủ xa.",
    thumbnailUrl: "/images/postcards/nhung-lop-nui-luc-hoang-hon.jpg",
    durationSeconds: 287,
    category: "chiem-nghiem",
    moods: ["hoai-niem", "cam-hung"],
    publishedAt: "2026-10-20T17:45:00+07:00",
    isFeatured: false,
  },
  {
    id: "pc-004",
    title: "Bình minh trên bãi cát",
    slug: "binh-minh-tren-bai-cat",
    shortDescription: "Sóng nhẹ, cát mịn và mặt trời vừa nhô lên khỏi mặt biển.",
    description:
      "Sóng nhẹ trườn lên bãi cát rồi rút đi. Mặt trời vừa nhô lên, nhuộm vàng cả mép nước. Một bức tranh chuyển động về khởi đầu, về những ngày còn ở phía trước.",
    thumbnailUrl: "/images/postcards/binh-minh-tren-bai-cat.jpg",
    durationSeconds: 221,
    category: "nghe-thuat",
    moods: ["hy-vong", "thu-gian"],
    publishedAt: "2026-10-12T06:00:00+07:00",
    isFeatured: false,
  },
  {
    id: "pc-003",
    title: "Mặt hồ phẳng lặng",
    slug: "mat-ho-phang-lang",
    shortDescription: "Núi soi bóng xuống mặt hồ không một gợn sóng.",
    description:
      "Mặt hồ không một gợn sóng, giữ trọn bóng núi và bầu trời. Thước phim dài nhất trong thư viện — dành cho những buổi chiều muốn ngồi yên thật lâu.",
    thumbnailUrl: "/images/postcards/mat-ho-phang-lang.jpg",
    durationSeconds: 540,
    category: "chiem-nghiem",
    moods: ["lang-le", "binh-yen"],
    publishedAt: "2026-10-02T15:00:00+07:00",
    isFeatured: false,
  },
  {
    id: "pc-002",
    title: "Thung lũng ngái ngủ",
    slug: "thung-lung-ngai-ngu",
    shortDescription: "Vách đá lớn, rừng thông và một buổi chiều ngược nắng.",
    description:
      "Vách đá lớn đứng sừng sững sau hàng thông, nắng chiều ngược sáng phủ lên cỏ một lớp vàng mỏng. Ghi lại trên đường đi, vào một ngày không định trước.",
    thumbnailUrl: "/images/postcards/thung-lung-ngai-ngu.jpg",
    durationSeconds: 233,
    category: "nhung-chuyen-di",
    moods: ["cam-hung", "thu-gian"],
    publishedAt: "2026-09-21T16:00:00+07:00",
    isFeatured: false,
  },
];
