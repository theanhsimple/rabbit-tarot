"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { routes } from "@/lib/routes";
import { MobileNavLinks } from "./nav-links";

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Mở menu">
          <Menu aria-hidden className="size-5" strokeWidth={1.5} />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full gap-0 border-l-0 px-6 pt-20 pb-8 sm:max-w-sm">
        <SheetTitle className="sr-only">Menu</SheetTitle>
        <SheetDescription className="sr-only">Điều hướng chính của Little Postcard</SheetDescription>
        <nav aria-label="Điều hướng chính">
          <MobileNavLinks onNavigate={close} />
        </nav>
        <Link
          href={routes.search()}
          onClick={close}
          className="mt-8 inline-flex items-center gap-3 text-sm text-muted transition-colors hover:text-foreground"
        >
          <Search aria-hidden className="size-4" strokeWidth={1.5} />
          Tìm một thước phim
        </Link>
        <p className="mt-auto font-display text-xl italic text-muted">A little place to pause.</p>
      </SheetContent>
    </Sheet>
  );
}
