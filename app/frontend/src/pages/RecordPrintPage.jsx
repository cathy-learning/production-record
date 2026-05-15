import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { pdf } from '@react-pdf/renderer'
import api from '../api'
import ProductionRecordPdf from '../pdf/ProductionRecordPdf'

export default function RecordPrintPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const iframeRef = useRef(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pdfUrl, setPdfUrl] = useState('')
  const [fileName, setFileName] = useState(`record-${id || 'preview'}.pdf`)

  useEffect(() => {
    let active = true
    let objectUrl = ''

    async function buildPdfPreview() {
      setLoading(true)
      setError('')
      try {
        const response = await api.get(`/records/${id}`)
        if (!active) {
          return
        }

        const record = response.data
        const lotNumber = record?.header?.lotNumber
        setFileName(`${lotNumber || `record-${id}`}.pdf`)

        const blob = await pdf(<ProductionRecordPdf record={record} />).toBlob()
        if (!active) {
          return
        }

        objectUrl = URL.createObjectURL(blob)
        setPdfUrl(objectUrl)
      } catch (requestError) {
        if (!active) {
          return
        }
        setError(requestError?.response?.data?.error || 'Failed to build PDF preview.')
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    buildPdfPreview()

    return () => {
      active = false
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [id])

  function handleSavePdf() {
    if (!pdfUrl) {
      return
    }
    const anchor = document.createElement('a')
    anchor.href = pdfUrl
    anchor.download = fileName
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
  }

  function handlePrint() {
    const printWindow = iframeRef.current?.contentWindow
    if (printWindow) {
      printWindow.focus()
      printWindow.print()
      return
    }
    window.print()
  }

  return (
    <div className="page-shell">
      <header className="top-bar">
        <div>
          <h1>PDF Preview</h1>
          <p>Check the layout first, then print or save.</p>
        </div>
        <div className="action-row">
          <button type="button" className="secondary-btn" onClick={() => navigate('/dashboard')}>
            Back
          </button>
          <button type="button" className="text-btn" onClick={handlePrint} disabled={!pdfUrl}>
            Print
          </button>
          <button type="button" className="primary-btn" onClick={handleSavePdf} disabled={!pdfUrl}>
            Save PDF
          </button>
        </div>
      </header>

      <section className="card preview-card">
        {loading && <p>Generating PDF preview...</p>}
        {error && <p className="error-text">{error}</p>}
        {!loading && !error && pdfUrl && (
          <iframe ref={iframeRef} title="PDF Preview" src={pdfUrl} className="preview-iframe" />
        )}
      </section>
    </div>
  )
}
