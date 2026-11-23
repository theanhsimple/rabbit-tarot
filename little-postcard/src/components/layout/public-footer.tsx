import Link from "next/link";
import { Container } from "@/components/ui/container";
import { getContentRepository } from "@/lib/content";
import { routes } from "@/lib/routes";
import { Wordmark } from "./wordmark";

const footerLinks = [
  {
    heading: "Khám phá",
    links: [
      { href: routes.library(), label: "Thư viện" },
      { href: routes.search(), label: "Tìm kiếm" },
    ],
  },
  {
    heading: "Little Postcard",
    links: [
      { href: routes.home, label: "Trang chủ" },
      { href: routes.about, label: "Giới thiệu" },
    ],
  },
] as const;

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

        {footerLinks.map((group) => (
          <nav
            key={group.heading}
            aria-label={group.heading}
            className="col-span-2 md:col-span-2 lg:col-span-3"
          >
            <p className="eyebrow mb-5 text-muted-foreground">{group.heading}</p>
            <ul className="flex flex-col gap-3">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-foreground transition-colors duration-300 hover:text-accent"
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
