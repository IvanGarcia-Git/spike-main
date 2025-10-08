import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import * as XLSX from 'xlsx'

export default function ExportButton({ data, filename = 'export', type = 'excel' }) {
  const handleExport = () => {
    if (type === 'excel') {
      exportToExcel()
    } else if (type === 'pdf') {
      exportToPDF()
    }
  }

  const exportToExcel = () => {
    // Convertir los datos a formato de hoja de cálculo
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos')

    // Generar archivo y descargar
    XLSX.writeFile(workbook, `${filename}.xlsx`)
  }

  const exportToPDF = () => {
    // Placeholder para exportación a PDF
    // Se puede implementar con jsPDF
    console.log('Exportar a PDF:', data)
    alert('Función de exportación a PDF en desarrollo')
  }

  return (
    <button
      onClick={handleExport}
      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
    >
      <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
      Exportar {type === 'excel' ? 'Excel' : 'PDF'}
    </button>
  )
}
