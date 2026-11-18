import { IconBook, IconCalc, IconChat, IconGrid, IconMap, IconReport, IconUser } from "@/components/Icons";

export const appNav = [
  { href: "/app", key: "dashboard", Icon: IconGrid },
  { href: "/app/advisor", key: "advisor", Icon: IconChat },
  { href: "/app/map", key: "map", Icon: IconMap },
  { href: "/app/library", key: "library", Icon: IconBook },
  { href: "/app/reports", key: "reports", Icon: IconReport },
  { href: "/app/calculator", key: "calculator", Icon: IconCalc },
] as const;

export const accountNav = { href: "/app/account", key: "account", Icon: IconUser } as const;

export function isActive(pathname: string, href: string) {
  return href === "/app" ? pathname === "/app" : pathname === href || pathname.startsWith(`${href}/`);
}
