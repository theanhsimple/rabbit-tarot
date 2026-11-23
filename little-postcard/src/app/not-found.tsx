import { ArrowLink } from "@/components/ui/arrow-link";
import { Container } from "@/components/ui/container";
import { routes } from "@/lib/routes";

export default function NotFound() {
  return (
    <Container className="flex min-h-[60vh] flex-col items-start justify-center py-24">
      <p className="eyebrow text-accent">404</p>
      <h1 className="mt-4 font-display text-display-lg font-medium text-balance">
        Tấm bưu thiếp này đã thất lạc.
      </h1>
      <p className="mt-4 max-w-md text-muted">
        Có thể đường dẫn đã thay đổi. Hãy quay lại thư viện để tìm một thước phim khác.
      </p>
      <div className="mt-8 flex gap-8">
        <ArrowLink href={routes.library()}>Thư viện</ArrowLink>
        <ArrowLink href={routes.home}>Trang chủ</ArrowLink>
      </div>
    </Container>
  );
}
