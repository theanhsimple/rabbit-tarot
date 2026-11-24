/**
 * DEVELOPMENT MOCK DATA — not production content.
 *
 * Read only through `createMockRepository` (src/lib/content), which is used
 * when CONTENT_SOURCE=mock or in `next dev` with no source set. A production
 * build without CONTENT_SOURCE fails instead of falling back to this file.
 *
 * Footage: real clips from Wikimedia Commons (public domain, CC0, CC BY,
 * CC BY-SA), trimmed and re-encoded to 720p H.264 in public/media. Each
 * thumbnail is a frame from its own clip. Attribution lives in `credit`
 * and is shown on the postcard page, as the licences require.
 * The draft and private entries exist to verify they never appear publicly;
 * their thumbnails are Unsplash photos (unsplash.com/license).
 */
import type { MediaCredit, Video } from "@/types/video";

const BY_SA_4 = { license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/" };
const BY_4 = { license: "CC BY 4.0", licenseUrl: "https://creativecommons.org/licenses/by/4.0/" };
const BY_3 = { license: "CC BY 3.0", licenseUrl: "https://creativecommons.org/licenses/by/3.0/" };
const CC0 = { license: "CC0 1.0", licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/" };
const PD = { license: "Phạm vi công cộng" };
const commons = (file: string) => `https://commons.wikimedia.org/wiki/File:${file}`;

const credits = {
  lightShadow: { title: "Light & shadow", author: "Myousry6666", sourceUrl: commons("Light_%26_shadow.webm"), ...BY_SA_4 },
  fog: { title: "Fog covering mountain time lapse", author: "Athulvis", sourceUrl: commons("Fog_covering_mountain_time_lapse.webm"), ...BY_SA_4 },
  clouds: { title: "Wolken Zeitraffer – Clouds Timelapse 4K HD 24FPS", author: "FreeSwissVideo", sourceUrl: commons("Wolken_Zeitraffer_-_Clouds_Timelapse_4K_HD_24FPS.webm"), ...BY_3 },
  kaneyama: { title: "Kaneyamanotaki Waterfall Movie", author: "Osumi Akari", sourceUrl: commons("Kaneyamanotaki_Waterfall_Movie.webm"), ...BY_SA_4 },
  darkHollow: { title: "Dark Hollow upper falls, Shenandoah NP", author: "G. Edward Johnson", sourceUrl: commons("Dark_Hollow_upper_falls_Shenandoah_NP_VA_2024-10-11_08-33-31_1.webm"), ...BY_4 },
  wallowa: { title: "Wallowa River", author: "BLM Oregon & Washington", sourceUrl: commons("Wallowa_River_(34273547262).webm"), ...PD },
  avalanche: { title: "Avalanche Lake Reflections", author: "Glacier National Park Service", sourceUrl: commons("Avalance_Lake_Reflections_(25569393933).webm"), ...PD },
  stream: { title: "Running Stream Of Water", author: "jLasWilson", sourceUrl: commons("Running_Stream_Of_Water.webm"), ...CC0 },
  missionCreek: { title: "Mouth of Mission Creek", author: "Extemporalist", sourceUrl: commons("Mouth_of_Mission_Creek.webm"), ...CC0 },
  sixes: { title: "Sixes River", author: "BLM Oregon & Washington", sourceUrl: commons("Sixes_River_(33895113543).webm"), ...PD },
} satisfies Record<string, MediaCredit>;

const media = (slug: string) => ({
  thumbnailUrl: `/images/postcards/${slug}.jpg`,
  playbackUrl: `/media/${slug}.mp4`,
});

const published = { status: "published", visibility: "public", isFeatured: false } as const;

export const videos: Video[] = [
  {
    id: "pc-014",
    slug: "bau-troi-doi-mau",
    title: "Bầu trời đổi màu",
    shortDescription: "Mây kéo đến, tan đi, rồi lại kéo đến — một buổi chiều trên cao.",
    description:
      "Những đám mây kéo đến, tan đi rồi lại kéo đến, nhanh hơn mắt thường kịp nhận ra. Một buổi chiều được thu lại trong vài chục giây, để nhớ rằng mọi thứ đều đang chuyển động, kể cả khi ta đứng yên.",
    ...media("bau-troi-doi-mau"),
    durationSeconds: 24,
    categoryId: "cat_moments",
    moodIds: ["mood_hope", "mood_relax"],
    publishedAt: "2026-11-20T16:30:00+07:00",
    ...published,
    credit: credits.clouds,
  },
  {
    id: "pc-013",
    slug: "nguoc-nang-tren-song",
    title: "Ngược nắng trên sông",
    shortDescription: "Mặt trời xuyên qua rặng thông, rơi thành những vệt sáng trên mặt nước.",
    description:
      "Con thuyền nhỏ trôi chậm, mặt trời ở ngay phía trước, xuyên qua rặng thông và vỡ thành những vệt sáng lấp lánh trên mặt sông. Mười một giây chói loà và ấm áp.",
    ...media("nguoc-nang-tren-song"),
    durationSeconds: 11,
    categoryId: "cat_travel",
    moodIds: ["mood_hope", "mood_inspired"],
    publishedAt: "2026-11-17T07:15:00+07:00",
    ...published,
    credit: credits.wallowa,
  },
  {
    id: "pc-012",
    slug: "thac-doi-giua-reu-xanh",
    title: "Thác đôi giữa rêu xanh",
    shortDescription: "Hai dòng thác song song đổ xuống hồ nước trong, giữa vách đá phủ rêu.",
    description:
      "Hai dòng thác song song đổ xuống một hồ nước nhỏ, giữa vách đá phủ rêu và dương xỉ. Hãy bật tiếng lên — đây là một bản nhạc không cần nhạc cụ.",
    ...media("thac-doi-giua-reu-xanh"),
    durationSeconds: 20,
    categoryId: "cat_music",
    moodIds: ["mood_relax", "mood_calm"],
    publishedAt: "2026-11-14T09:00:00+07:00",
    ...published,
    credit: credits.kaneyama,
  },
  {
    id: "pc-011",
    slug: "nhung-canh-buom-trong-nang-bac",
    title: "Những cánh buồm trong nắng bạc",
    shortDescription: "Năm cánh buồm nhỏ trôi trên mặt biển lấp lánh một buổi sáng mờ sương.",
    description:
      "Một buổi sáng mờ sương, năm cánh buồm nhỏ lặng lẽ trôi ngang đường chân trời. Nắng rơi xuống mặt biển thành một dải bạc lấp lánh. Không có gì xảy ra, và đó chính là điều đẹp nhất.",
    ...media("nhung-canh-buom-trong-nang-bac"),
    durationSeconds: 19,
    categoryId: "cat_art",
    moodIds: ["mood_quiet", "mood_inspired"],
    publishedAt: "2026-11-11T06:30:00+07:00",
    ...published,
    isFeatured: true,
    credit: credits.lightShadow,
  },
  {
    id: "pc-010",
    slug: "truoc-khi-suong-xuong",
    title: "Trước khi sương xuống",
    shortDescription: "Thung lũng còn xanh, mây vừa chạm đỉnh núi phía xa.",
    description:
      "Thung lũng vẫn còn xanh, những dải mây vừa chạm vào đỉnh núi phía xa. Vài phút nữa thôi, sương sẽ phủ kín tất cả. Một khoảnh khắc ở giữa — trước khi mọi thứ đổi khác.",
    ...media("truoc-khi-suong-xuong"),
    durationSeconds: 22,
    categoryId: "cat_nature",
    moodIds: ["mood_nostalgia", "mood_quiet"],
    publishedAt: "2026-11-07T08:00:00+07:00",
    ...published,
    credit: credits.fog,
  },
  {
    id: "pc-009",
    slug: "ban-nhac-cua-soi-va-nuoc",
    title: "Bản nhạc của sỏi và nước",
    shortDescription: "Nước trong vắt chảy qua lớp sỏi nhiều màu, róc rách không ngừng.",
    description:
      "Dòng nước trong vắt chảy qua lớp sỏi nhiều màu, ánh sáng nhảy múa trên từng viên đá nhỏ. Một thước phim để nhắm mắt lại và chỉ nghe tiếng róc rách.",
    ...media("ban-nhac-cua-soi-va-nuoc"),
    durationSeconds: 23,
    categoryId: "cat_music",
    moodIds: ["mood_relax", "mood_calm"],
    publishedAt: "2026-11-03T21:00:00+07:00",
    ...published,
    credit: credits.stream,
  },
  {
    id: "pc-008",
    slug: "nui-soi-bong-duoi-day-ho",
    title: "Núi soi bóng dưới đáy hồ",
    shortDescription: "Dãy núi tuyết in ngược xuống mặt hồ, lẫn vào những viên sỏi dưới đáy.",
    description:
      "Mặt hồ trong đến mức dãy núi tuyết in ngược xuống, lẫn vào những viên sỏi dưới đáy. Trên hay dưới, thật hay bóng — có lúc chẳng cần phân biệt.",
    ...media("nui-soi-bong-duoi-day-ho"),
    durationSeconds: 17,
    categoryId: "cat_art",
    moodIds: ["mood_quiet", "mood_inspired"],
    publishedAt: "2026-10-30T15:00:00+07:00",
    ...published,
    credit: credits.avalanche,
  },
  {
    id: "pc-007",
    slug: "cua-song-mot-ngay-khong-gio",
    title: "Cửa sông một ngày không gió",
    shortDescription: "Mặt nước phẳng như gương, núi xa mờ trong sương nhạt.",
    description:
      "Một ngày không gió ở cửa sông. Mặt nước phẳng như gương, những cành cây rủ xuống khung hình, núi xa mờ trong sương nhạt. Thước phim dài nhất trong thư viện, dành cho những lúc muốn ngồi yên thật lâu.",
    ...media("cua-song-mot-ngay-khong-gio"),
    durationSeconds: 30,
    categoryId: "cat_reflection",
    moodIds: ["mood_calm", "mood_quiet"],
    publishedAt: "2026-10-26T17:00:00+07:00",
    ...published,
    credit: credits.missionCreek,
  },
  {
    id: "pc-006",
    slug: "xuoi-dong-buoi-som",
    title: "Xuôi dòng buổi sớm",
    shortDescription: "Bờ cỏ xanh, rặng thông và bầu trời đầy mây trên một dòng sông rộng.",
    description:
      "Bắt đầu một ngày trên sông: bờ cỏ xanh mướt, rặng thông thẳng tắp và bầu trời đầy mây trắng. Những chuyến đi đẹp nhất thường bắt đầu thật chậm.",
    ...media("xuoi-dong-buoi-som"),
    durationSeconds: 11,
    categoryId: "cat_travel",
    moodIds: ["mood_inspired", "mood_relax"],
    publishedAt: "2026-10-22T06:45:00+07:00",
    ...published,
    credit: credits.wallowa,
  },
  {
    id: "pc-005",
    slug: "thac-nuoc-mua-thu",
    title: "Thác nước mùa thu",
    shortDescription: "Dòng thác nhiều tầng giữa rừng thay lá, tiếng nước vang đều.",
    description:
      "Dòng thác chảy qua nhiều tầng đá giữa khu rừng bắt đầu thay lá. Lá vàng phủ trên những tảng đá, tiếng nước vang đều — như một buổi chiều cuối thu chẳng muốn kết thúc.",
    ...media("thac-nuoc-mua-thu"),
    durationSeconds: 22,
    categoryId: "cat_nature",
    moodIds: ["mood_nostalgia", "mood_calm"],
    publishedAt: "2026-10-17T16:00:00+07:00",
    ...published,
    credit: credits.darkHollow,
  },
  {
    id: "pc-004",
    slug: "suong-phu-kin-thung-lung",
    title: "Sương phủ kín thung lũng",
    shortDescription: "Từng lớp sương trườn lên sườn núi cho đến khi chỉ còn một màu trắng.",
    description:
      "Từng lớp sương trườn lên sườn núi, nuốt dần những mảng rừng xanh, cho đến khi chỉ còn lại một màu trắng mềm. Một thước phim không lời về việc buông bỏ.",
    ...media("suong-phu-kin-thung-lung"),
    durationSeconds: 23,
    categoryId: "cat_reflection",
    moodIds: ["mood_quiet", "mood_calm"],
    publishedAt: "2026-10-12T07:30:00+07:00",
    ...published,
    credit: credits.fog,
  },
  {
    id: "pc-003",
    slug: "may-troi-buoi-trua",
    title: "Mây trôi buổi trưa",
    shortDescription: "Những đám mây trắng lớn trôi qua bầu trời xanh thẫm.",
    description:
      "Nằm ngửa trên cỏ và nhìn mây trôi — điều ta hay làm hồi nhỏ mà lâu rồi đã quên. Những đám mây trắng lớn trôi qua bầu trời xanh thẫm, nhẹ như không.",
    ...media("may-troi-buoi-trua"),
    durationSeconds: 24,
    categoryId: "cat_reflection",
    moodIds: ["mood_relax", "mood_inspired"],
    publishedAt: "2026-10-06T12:00:00+07:00",
    ...published,
    credit: credits.clouds,
  },
  {
    id: "pc-002",
    slug: "dong-suoi-trong-rung-am",
    title: "Dòng suối trong rừng ẩm",
    shortDescription: "Con suối trắng xoá chảy qua cánh rừng rêu phủ sau cơn mưa.",
    description:
      "Sau cơn mưa, con suối chảy mạnh hơn, trắng xoá giữa cánh rừng phủ rêu. Thân cây ẩm, lá non xanh, tiếng nước át mọi âm thanh khác.",
    ...media("dong-suoi-trong-rung-am"),
    durationSeconds: 17,
    categoryId: "cat_music",
    moodIds: ["mood_calm", "mood_nostalgia"],
    publishedAt: "2026-09-29T10:00:00+07:00",
    ...published,
    credit: credits.sixes,
  },

  // Reachable by direct link only — never listed.
  {
    id: "pc-u01",
    slug: "noi-con-suoi-re-ngoat",
    title: "Nơi con suối rẽ ngoặt",
    shortDescription: "Một khúc quanh của dòng suối, nơi nước va vào đá và đổi hướng.",
    description:
      "Một khúc quanh nhỏ của dòng suối, nơi nước va vào đá rồi đổi hướng. Tấm bưu thiếp này chỉ dành cho những ai có đường dẫn.",
    ...media("noi-con-suoi-re-ngoat"),
    durationSeconds: 17,
    categoryId: "cat_moments",
    moodIds: ["mood_quiet"],
    publishedAt: "2026-10-20T10:00:00+07:00",
    status: "published",
    visibility: "unlisted",
    isFeatured: false,
    credit: credits.sixes,
  },

  // Must never appear on the public site.
  {
    id: "pc-d01",
    slug: "binh-minh-tren-bai-cat",
    title: "Bình minh trên bãi cát (bản nháp)",
    shortDescription: "Bản nháp chưa xuất bản.",
    description: "Bản nháp chưa xuất bản.",
    thumbnailUrl: "/images/postcards/binh-minh-tren-bai-cat.jpg",
    durationSeconds: 60,
    categoryId: "cat_art",
    moodIds: ["mood_hope"],
    publishedAt: "2026-11-22T06:00:00+07:00",
    status: "draft",
    visibility: "public",
    isFeatured: true,
  },
  {
    id: "pc-p01",
    slug: "mot-buoi-sang-o-vinh",
    title: "Một buổi sáng ở vịnh (riêng tư)",
    shortDescription: "Thước phim riêng tư.",
    description: "Thước phim riêng tư.",
    thumbnailUrl: "/images/postcards/mot-buoi-sang-o-vinh.jpg",
    durationSeconds: 60,
    categoryId: "cat_travel",
    moodIds: ["mood_relax"],
    publishedAt: "2026-11-21T08:00:00+07:00",
    status: "published",
    visibility: "private",
    isFeatured: false,
  },
];
