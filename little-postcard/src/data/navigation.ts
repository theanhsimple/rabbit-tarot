import { routes } from "@/lib/routes";

export interface NavItem {
  href: string;
  label: string;
}

export const primaryNav: NavItem[] = [
  { href: routes.home, label: "Trang chủ" },
  { href: routes.library(), label: "Thư viện" },
  { href: routes.about, label: "Giới thiệu" },
];

export const footerNav: { heading: string; links: NavItem[] }[] = [
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
];
