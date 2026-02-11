import { utils, writeFile } from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export interface ExportColumn<T> {
  key: keyof T
  label: string
}

interface ExportButtonsProps<T> {
  rows: T[]
  columns: ExportColumn<T>[]
  fileName: string
}

const ExportButtons = <T,>({ rows, columns, fileName }: ExportButtonsProps<T>) => {
  const isDisabled = rows.length === 0

  const exportCsv = () => {
    if (isDisabled) return
    const data = rows.map((row) =>
      columns.reduce<Record<string, unknown>>((acc, column) => {
        acc[column.label] = row[column.key]
        return acc
      }, {}),
    )
    const worksheet = utils.json_to_sheet(data)
    const workbook = utils.book_new()
    utils.book_append_sheet(workbook, worksheet, 'Sheet1')
    writeFile(workbook, `${fileName}.csv`)
  }

  const exportExcel = () => {
    if (isDisabled) return
    const data = rows.map((row) =>
      columns.reduce<Record<string, unknown>>((acc, column) => {
        acc[column.label] = row[column.key]
        return acc
      }, {}),
    )
    const worksheet = utils.json_to_sheet(data)
    const workbook = utils.book_new()
    utils.book_append_sheet(workbook, worksheet, 'Sheet1')
    writeFile(workbook, `${fileName}.xlsx`)
  }

  const exportPdf = () => {
    if (isDisabled) return
    const doc = new jsPDF()
    const tableBody = rows.map((row) => columns.map((column) => String(row[column.key] ?? '')))
    autoTable(doc, {
      head: [columns.map((column) => column.label)],
      body: tableBody,
      styles: { fontSize: 8 },
    })
    doc.save(`${fileName}.pdf`)
  }

  return (
    <div className="table-actions">
      <button type="button" className="button" onClick={exportCsv} disabled={isDisabled}>
        Download CSV
      </button>
      <button type="button" className="button" onClick={exportExcel} disabled={isDisabled}>
        Download Excel
      </button>
      <button type="button" className="button primary" onClick={exportPdf} disabled={isDisabled}>
        Generate PDF
      </button>
    </div>
  )
}

export default ExportButtons
