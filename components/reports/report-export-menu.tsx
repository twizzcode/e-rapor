"use client"

import * as React from "react"
import type { jsPDF as JsPdf } from "jspdf"
import {
  ChevronDownIcon,
  DownloadIcon,
  FileArchiveIcon,
  FileTextIcon,
  Loader2Icon,
  PrinterIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const A4_WIDTH_MM = 210
const A4_HEIGHT_MM = 297

type ExportMode = "all" | "per-student"

export function ReportExportMenu({
  pageSelector,
  periodLabel,
  grade,
  disabled = false,
}: {
  pageSelector: string
  periodLabel: string
  grade: number
  disabled?: boolean
}) {
  const [pending, setPending] = React.useState<ExportMode | null>(null)
  const isBusy = pending !== null

  async function exportAll() {
    const pages = getPages(pageSelector)
    if (!pages.length) {
      toast.error("No report pages to export.")
      return
    }

    setPending("all")
    const toastId = toast.loading(
      `Preparing ${pages.length} report page${pages.length === 1 ? "" : "s"}…`
    )

    try {
      const pdf = await renderPdf(pages)
      pdf.save(`${fileNameBase(periodLabel, grade)}.pdf`)
      toast.success("PDF exported.", { id: toastId })
    } catch (error) {
      console.error(error)
      toast.error("Failed to export PDF.", { id: toastId })
    } finally {
      setPending(null)
    }
  }

  async function exportPerStudent() {
    const pages = getPages(pageSelector)
    if (!pages.length) {
      toast.error("No report pages to export.")
      return
    }

    setPending("per-student")
    const toastId = toast.loading(
      `Preparing ${pages.length} student PDF${pages.length === 1 ? "" : "s"}…`
    )

    try {
      const [{ jsPDF }, { default: JSZip }] = await Promise.all([
        import("jspdf"),
        import("jszip"),
      ])
      const zip = new JSZip()

      for (const [index, page] of pages.entries()) {
        toast.loading(`Exporting ${index + 1} of ${pages.length}…`, {
          id: toastId,
        })

        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
          compress: true,
        })
        const canvas = await capturePage(page)
        const canvasWidth = canvas.width
        const canvasHeight = canvas.height
        const image = canvas.toDataURL("image/png")
        canvas.width = 0
        canvas.height = 0
        addPageImage(pdf, image, canvasWidth, canvasHeight)

        const studentName =
          page.dataset.studentName?.trim() || `Student ${index + 1}`
        const fileName = `${fileNameBase(
          `${index + 1}. ${studentName} - ${periodLabel}`,
          grade
        )}.pdf`
        zip.file(fileName, pdf.output("blob"))
      }

      const archive = await zip.generateAsync({ type: "blob" })
      downloadBlob(
        archive,
        `${fileNameBase(`${periodLabel} - Per Student`, grade)}.zip`
      )
      toast.success("Student PDFs exported.", { id: toastId })
    } catch (error) {
      console.error(error)
      toast.error("Failed to export student PDFs.", { id: toastId })
    } finally {
      setPending(null)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled || isBusy}
        render={<Button variant="outline" />}
      >
        {isBusy ? (
          <Loader2Icon className="animate-spin" />
        ) : (
          <DownloadIcon />
        )}
        Print / Export
        <ChevronDownIcon className="ml-1" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuItem disabled={isBusy} onClick={() => window.print()}>
          <PrinterIcon />
          Print
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={isBusy} onClick={exportAll}>
          <FileTextIcon />
          Export PDF (all students)
        </DropdownMenuItem>
        <DropdownMenuItem disabled={isBusy} onClick={exportPerStudent}>
          <FileArchiveIcon />
          Export PDF per student (.zip)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

async function renderPdf(pages: HTMLElement[]) {
  const { jsPDF } = await import("jspdf")
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  })

  for (const [index, page] of pages.entries()) {
    if (index > 0) pdf.addPage()

    const canvas = await capturePage(page)
    const canvasWidth = canvas.width
    const canvasHeight = canvas.height
    const image = canvas.toDataURL("image/png")
    canvas.width = 0
    canvas.height = 0
    addPageImage(pdf, image, canvasWidth, canvasHeight)
  }

  return pdf
}

async function capturePage(page: HTMLElement) {
  const { default: html2canvas } = await import("html2canvas-pro")

  return html2canvas(page, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
    onclone: (documentClone) => {
      documentClone
        .querySelectorAll<HTMLElement>("[data-report-page]")
        .forEach((element) => {
          element.style.boxShadow = "none"
        })
    },
  })
}

function addPageImage(
  pdf: JsPdf,
  image: string,
  canvasWidth: number,
  canvasHeight: number
) {
  const height = (canvasHeight / canvasWidth) * A4_WIDTH_MM

  if (height <= A4_HEIGHT_MM) {
    pdf.addImage(image, "PNG", 0, 0, A4_WIDTH_MM, height)
    return
  }

  const width = (canvasWidth / canvasHeight) * A4_HEIGHT_MM
  pdf.addImage(image, "PNG", (A4_WIDTH_MM - width) / 2, 0, width, A4_HEIGHT_MM)
}

function getPages(pageSelector: string) {
  return Array.from(document.querySelectorAll<HTMLElement>(pageSelector))
}

function fileNameBase(label: string, grade: number) {
  return safeFileName(`${label} - Grade ${grade}`)
}

function safeFileName(value: string) {
  return (
    value
      .replace(/[\\/:*?"<>|\u0000-\u001f]/g, "-")
      .replace(/\s+/g, " ")
      .replace(/[. ]+$/g, "")
      .trim() || "report"
  )
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
