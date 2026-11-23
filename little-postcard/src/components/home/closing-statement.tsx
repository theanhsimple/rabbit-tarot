import { ArrowLink } from "@/components/ui/arrow-link";
import { Container } from "@/components/ui/container";
import { routes } from "@/lib/routes";

export function ClosingStatement() {
  return (
    <section aria-label="Lời nhắn" className="border-t border-border bg-surface py-24 md:py-32 lg:py-40">
      <Container className="reveal flex flex-col items-center text-center">
        <span aria-hidden className="mb-10 block h-12 w-px bg-accent/60" />
        <blockquote className="max-w-3xl">
          <p className="font-display text-display-lg font-normal italic text-balance text-foreground">
            “Mong rằng, giữa những ngày bận rộn, bạn vẫn tìm được một khoảng nhỏ dành riêng
            cho mình.”
          </p>
        </blockquote>
        <p className="eyebrow mt-8 text-muted">— Little Postcard</p>
        <ArrowLink href={routes.about} className="mt-12">
          Về Little Postcard
        </ArrowLink>
      </Container>
    </section>
  );
}
