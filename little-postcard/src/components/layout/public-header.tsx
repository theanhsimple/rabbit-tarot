import Link from "next/link";
import { Search } from "lucide-react";
import { Container } from "@/components/ui/container";
import { routes } from "@/lib/routes";
import { MobileMenu } from "./mobile-menu";
import { NavLinks } from "./nav-links";
import { Wordmark } from "./wordmark";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 supports-[backdrop-filter]:bg-background/88 supports-[backdrop-filter]:backdrop-blur-sm">
      <Container className="grid h-(--header-height) grid-cols-[1fr_auto] items-center md:grid-cols-[1fr_auto_1fr]">
        <Wordmark className="justify-self-start" />

        <nav aria-label="Điều hướng chính" className="hidden md:block">
          <NavLinks />
        </nav>

        <div className="flex items-center justify-self-end gap-1 md:-mr-2">
          <Link
            href={routes.search()}
            aria-label="Tìm kiếm"
            className="inline-flex size-10 items-center justify-center rounded-sm text-foreground transition-colors duration-300 hover:bg-surface-secondary hover:text-accent"
          >
            <Search aria-hidden className="size-[1.125rem]" strokeWidth={1.5} />
          </Link>
          <div className="-mr-2 md:hidden">
            <MobileMenu />
          </div>
        </div>
      </Container>
    </header>
  );
}
