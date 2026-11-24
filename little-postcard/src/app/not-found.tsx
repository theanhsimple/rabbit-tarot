import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { routes } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Không tìm thấy",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <Container className="editorial-grid min-h-[70vh] content-center gap-y-10 py-24">
      <p
        aria-hidden
        className="col-span-4 font-display text-[7rem] leading-none text-border select-none md:col-span-3 md:text-[9rem] lg:col-span-4 lg:text-[12rem]"
      >
        404
      </p>
      <div className="col-span-4 md:col-span-5 lg:col-span-6 lg:col-start-6">
        <p className="eyebrow text-accent">Không tìm thấy</p>
        <h1 className="mt-4 font-display text-display-lg font-medium text-balance">
          Tấm bưu thiếp này đã thất lạc trên đường đến bạn.
        </h1>
        <p className="mt-5 max-w-md leading-relaxed text-muted">
          Có thể đường dẫn đã thay đổi, hoặc thước phim không còn được chia sẻ công khai.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href={routes.home}>Về trang chủ</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href={routes.library()}>Khám phá thư viện</Link>
          </Button>
        </div>
      </div>
    </Container>
  );
}
