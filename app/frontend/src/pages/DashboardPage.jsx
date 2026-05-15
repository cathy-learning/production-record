import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api'

function formatDate(value) {
  if (!value) {
    return '-'
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleString()
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)

  async function loadRecords(search = keyword) {
    setLoading(true)
    setError('')
    try {
      const response = await api.get('/records', {
        params: {
          q: search,
          page: 1,
          pageSize: 100,
        },
      })
      setRecords(response.data.items || [])
    } catch (requestError) {
      setError(requestError?.response?.data?.error || 'Failed to load records.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true

    async function loadInitialRecords() {
      try {
        const response = await api.get('/records', {
          params: {
            q: '',
            page: 1,
            pageSize: 100,
          },
        })
        if (!active) {
          return
        }
        setRecords(response.data.items || [])
      } catch (requestError) {
        if (!active) {
          return
        }
        setError(requestError?.response?.data?.error || 'Failed to load records.')
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadInitialRecords()
    return () => {
      active = false
    }
  }, [])

  async function handleDelete(id) {
    if (!window.confirm('Delete this record permanently? This cannot be undone.')) {
      return
    }
    setBusyId(id)
    try {
      await api.delete(`/records/${id}`)
      await loadRecords(keyword)
    } catch (requestError) {
      window.alert(requestError?.response?.data?.error || 'Delete failed.')
    } finally {
      setBusyId(null)
    }
  }

  function handleGeneratePdf(recordId) {
    navigate(`/records/${recordId}/print`)
  }

  const orderedRecords = useMemo(() => {
    return [...records].sort((a, b) => {
      const timeA = Date.parse(a.updated_at || a.created_at || '')
      const timeB = Date.parse(b.updated_at || b.created_at || '')
      if (!Number.isNaN(timeA) && !Number.isNaN(timeB) && timeA !== timeB) {
        return timeA - timeB
      }
      return (a.id || 0) - (b.id || 0)
    })
  }, [records])

  const hasData = useMemo(() => orderedRecords.length > 0, [orderedRecords.length])

  return (
    <div className="page-shell">
      <header className="top-bar">
        <div>
          <h1>Production Records Dashboard</h1>
          <p>Manage history, edit entries, and generate standard PDFs.</p>
        </div>
        <button type="button" className="primary-btn" onClick={() => navigate('/records/new')}>
          New Record
        </button>
      </header>

      <section className="card">
        <form
          className="search-row"
          onSubmit={(event) => {
            event.preventDefault()
            loadRecords(keyword)
          }}
        >
          <input
            type="text"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Search by lot number or product name"
          />
          <button type="submit" className="secondary-btn">
            Search
          </button>
        </form>

        {loading && <p>Loading records...</p>}
        {error && <p className="error-text">{error}</p>}

        {!loading && !hasData && <p>No records found.</p>}

        {!loading && hasData && (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Production Date</th>
                  <th>Product Name</th>
                  <th>Specifications</th>
                  <th>Lot Number</th>
                  <th>Updated At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orderedRecords.map((record, index) => (
                  <tr key={record.id}>
                    <td>{index + 1}</td>
                    <td>{record.production_date || '-'}</td>
                    <td>{record.product_name || '-'}</td>
                    <td>{record.specifications || '-'}</td>
                    <td>{record.lot_number || '-'}</td>
                    <td>{formatDate(record.updated_at)}</td>
                    <td>
                      <div className="action-row">
                        <Link className="text-btn" to={`/records/${record.id}/edit`}>
                          Edit
                        </Link>
                        <button
                          type="button"
                          className="text-btn"
                          onClick={() => handleGeneratePdf(record.id)}
                        >
                          Generate PDF
                        </button>
                        <button
                          type="button"
                          className="danger-btn"
                          onClick={() => handleDelete(record.id)}
                          disabled={busyId === record.id}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
