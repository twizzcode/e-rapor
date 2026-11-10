"use client"

import * as React from "react"
import Image from "next/image"

import { NavMain } from "@/components/sidebar/nav-main"
import { NavUser } from "@/components/sidebar/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  BookOpenIcon,
  Building2Icon,
  LayoutDashboardIcon,
  ImagesIcon,
  HeartHandshakeIcon,
  FileTextIcon,
  SchoolIcon,
  GraduationCapIcon,
  UsersRoundIcon,
  UserRoundIcon,
} from "lucide-react"

const data = {
  platform: [
    {
      title: "Dashboard",
      url: "/",
      icon: <LayoutDashboardIcon />,
    },
    {
      title: "Teachers",
      url: "/teachers",
      icon: <GraduationCapIcon />,
    },
    {
      title: "Students",
      url: "/students",
      icon: <UsersRoundIcon />,
    },
    {
      title: "My Profile",
      url: "/profile",
      icon: <UserRoundIcon />,
    },
  ],
  school: [
    {
      title: "School Profile",
      url: "/school-profile",
      icon: <SchoolIcon />,
    },
    {
      title: "School Assets",
      url: "/school-assets",
      icon: <ImagesIcon />,
    },
    {
      title: "Classes",
      url: "/classes",
      icon: <Building2Icon />,
    },
    {
      title: "Subjects",
      url: "/subjects",
      icon: <BookOpenIcon />,
    },
    {
      title: "Personal & Social",
      url: "/personal-social",
      icon: <HeartHandshakeIcon />,
    },
  ],
  reports: [
    {
      title: "Monthly Report",
      url: "/input-scores?reportType=monthly",
      icon: <FileTextIcon />,
    },
    {
      title: "Semester Report",
      url: "/input-scores?reportType=semester",
      icon: <FileTextIcon />,
    },
    {
      title: "Tahsin Tahfidz Report",
      url: "/reports/tahsin-tahfidz",
      icon: <FileTextIcon />,
    },
  ],
}

export function AppSidebar({
  schoolName,
  role,
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  schoolName: string
  role: string
  user: {
    name: string
    email: string
    image: string | null
  }
}) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex h-12 items-center gap-2 overflow-hidden p-2 group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-1">
          <Image
            src="/logo.png"
            alt="School logo"
            width={32}
            height={32}
            className="size-8 shrink-0 object-contain"
          />
          <div className="grid min-w-0 flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate font-medium">{schoolName}</span>
            <span className="truncate text-xs text-sidebar-foreground/70">
              {role}
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain label="Platform" items={data.platform} />
        <NavMain label="School" items={data.school} />
        <NavMain label="Rapor" items={data.reports} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
