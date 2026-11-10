"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

type NavItem = {
  title: string
  url: string
  icon?: React.ReactNode
}

export function NavMain({ label, items }: { label: string; items: NavItem[] }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function isActive(url: string) {
    const [path, query] = url.split("?")
    if (pathname !== path && !pathname.startsWith(`${path}/`)) return false
    if (!query) return true
    return [...new URLSearchParams(query)].every(
      ([key, value]) => searchParams.get(key) === value
    )
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarMenu className="gap-1">
        {items.map((item) => {
          const active =
            item.url === "/"
              ? pathname === "/"
              : item.url !== "#" && isActive(item.url)

          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                tooltip={item.title}
                isActive={active}
                render={<Link href={item.url} />}
                className="data-active:bg-sidebar-primary data-active:text-sidebar-primary-foreground data-active:hover:bg-sidebar-primary data-active:hover:text-sidebar-primary-foreground"
              >
                {item.icon}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
