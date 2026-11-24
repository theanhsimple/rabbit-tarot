import { ArrowLink } from "@/components/ui/arrow-link";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/ui/section-header";
import { VideoGrid } from "@/components/postcard/video-grid";
import type { Category } from "@/types/category";
import type { Video } from "@/types/video";
import { routes } from "@/lib/routes";

interface LatestPostcardsProps {
  videos: Video[];
  categories: Category[];
}

export function LatestPostcards({ videos, categories }: LatestPostcardsProps) {
  return (
    <section
      id="latest"
      aria-labelledby="latest-title"
      className="border-t border-border py-20 md:py-28 lg:py-32"
    >
      <Container>
        <SectionHeader
          titleId="latest-title"
          eyebrow="Mới cập nhật"
          title="Những thước phim mới nhất"
          description="Mỗi video là một tấm bưu thiếp nhỏ được gửi đến bạn."
          action={<ArrowLink href={routes.library()}>Xem tất cả</ArrowLink>}
        />
        <div className="mt-12 md:mt-16">
          <VideoGrid videos={videos} categories={categories} />
        </div>
      </Container>
    </section>
  );
}
