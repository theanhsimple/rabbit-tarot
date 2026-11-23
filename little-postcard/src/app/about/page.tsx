import type { Metadata } from "next";
import Image from "next/image";
import { PageIntro } from "@/components/layout/page-intro";
import { ArrowLink } from "@/components/ui/arrow-link";
import { Container } from "@/components/ui/container";
import { routes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Giới thiệu",
  description: "Little Postcard — một nơi để ta dừng lại.",
};

/* Sprint 01A placeholder: final copy to be supplied. */
export default function AboutPage() {
  return (
    <>
      <PageIntro
        eyebrow="Giới thiệu"
        title="Một nơi để ta dừng lại."
        description="Little Postcard là một kho lưu trữ nhỏ của những thước phim ngắn — về thiên nhiên, những chuyến đi và những khoảnh khắc lặng lẽ của đời thường."
      />
      <Container className="pb-24 lg:pb-32">
        <div className="relative aspect-[21/9] overflow-hidden bg-media">
          <Image
            src="/images/hero-valley.jpg"
            alt=""
            fill
            sizes="(min-width: 1376px) 1280px, 100vw"
            className="object-cover"
          />
        </div>
        <div className="editorial-grid mt-14 gap-y-8 md:mt-20">
          <p className="col-span-4 font-display text-display-md italic md:col-span-8 lg:col-span-5">
            A little place to pause.
          </p>
          <div className="col-span-4 flex flex-col gap-5 text-base leading-relaxed text-foreground/80 md:col-span-8 lg:col-span-6 lg:col-start-7">
            <p>
              Mỗi thước phim ở đây được gửi đi như một tấm bưu thiếp: ngắn, chậm rãi và không
              đòi hỏi gì ở người xem — chỉ một vài phút để thở và nhìn kỹ hơn.
            </p>
            <p>
              Bạn có thể bắt đầu từ tâm trạng của hôm nay, từ một chủ đề yêu thích, hoặc đơn
              giản là từ thước phim mới nhất.
            </p>
            <ArrowLink href={routes.library()} className="mt-4">
              Khám phá thư viện
            </ArrowLink>
          </div>
        </div>
      </Container>
    </>
  );
}
