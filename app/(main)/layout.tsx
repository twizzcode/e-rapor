import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { eq } from "drizzle-orm"

import { AppSidebar } from "@/components/sidebar/app-sidebar"
import { AppBreadcrumb } from "@/components/layout/app-breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { auth } from "@/lib/auth"
import { db } from "@/db"
import { schoolProfile, teacher } from "@/db/schema"

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) redirect("/login")

  if (session.user.role !== "teacher" && session.user.role !== "admin") {
    redirect("/access-denied")
  }

  const [teacherProfile, school] = await Promise.all([
    db.query.teacher.findFirst({
      columns: { active: true },
      where: eq(teacher.userId, session.user.id),
    }),
    db.query.schoolProfile.findFirst({
      columns: { name: true },
      where: eq(schoolProfile.id, "main"),
    }),
  ])

  if (teacherProfile?.active === false) redirect("/access-denied")

  return (
    <SidebarProvider>
      <AppSidebar
        schoolName={school?.name ?? "SDII Cahaya Bangsa"}
        role={session.user.role === "admin" ? "Admin Teacher" : "Teacher"}
      />
      <SidebarInset>
        <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="flex shrink-0 items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <span className="flex h-7 items-center">
              <Separator
                orientation="vertical"
                className="h-4 [align-self:center]"
              />
            </span>
          </div>
          <div className="min-w-0">
            <AppBreadcrumb />
          </div>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
