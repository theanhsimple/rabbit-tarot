import Link from "next/link";
import { Container } from "@/components/ui/container";
import { footerNav } from "@/data/navigation";
import { getContentRepository } from "@/lib/content";
import { Wordmark } from "./wordmark";

export async function PublicFooter() {
  const { source } = await getContentRepository();

  return (
    <footer className="border-t border-border bg-background">
      <Container className="editorial-grid gap-y-12 py-16 lg:py-20">
        <div className="col-span-4 md:col-span-4 lg:col-span-6">
          <Wordmark />
          <p className="mt-5 max-w-xs font-display text-xl leading-snug italic text-muted">
            A little place to pause.
          </p>
        </div>

        {footerNav.map((group) => (
          <nav
            key={group.heading}
            aria-label={group.heading}
            className="col-span-2 md:col-span-2 lg:col-span-3"
          >
            <p className="eyebrow mb-2 text-muted-foreground">{group.heading}</p>
            <ul className="flex flex-col">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex min-h-11 items-center text-sm text-foreground transition-colors duration-300 hover:text-accent"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div className="col-span-full flex flex-col gap-2 border-t border-border pt-8 text-xs text-muted sm:flex-row sm:justify-between">
          <p>© Little Postcard. Những tấm bưu thiếp nhỏ gửi đến bạn.</p>
          {source === "mock" ? (
            <p className="text-muted-foreground">Bản xem trước · nội dung mẫu</p>
          ) : null}
        </div>
      </Container>
    </footer>
  );
}
