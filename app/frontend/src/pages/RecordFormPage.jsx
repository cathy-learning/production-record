import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  EMPTY_SECTION_B_ROW,
  EMPTY_SECTION_D_ROW,
  EMPTY_SECTION_E_ROW,
} from '../constants'
import api from '../api'
import { createEmptyRecord, normalizeRecordForForm } from '../utils/record'

function sectionTitle(title, subtitle) {
  return (
    <div className="section-header">
      <h2>{title}</h2>
      <p>{subtitle}</p>
    </div>
  )
}

export default function RecordFormPage() {
  const navigate = useNavigate()
  const params = useParams()
  const isEditing = useMemo(() => Boolean(params.id), [params.id])
  const [form, setForm] = useState(createEmptyRecord())
  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isEditing) {
      return
    }

    let active = true

    async function fetchRecord() {
      try {
        const response = await api.get(`/records/${params.id}`)
        if (!active) {
          return
        }
        setForm(normalizeRecordForForm(response.data))
      } catch (requestError) {
        if (!active) {
          return
        }
        setError(requestError?.response?.data?.error || 'Failed to load record.')
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    fetchRecord()
    return () => {
      active = false
    }
  }, [isEditing, params.id])

  function updateHeader(field, value) {
    setForm((prev) => ({
      ...prev,
      header: {
        ...prev.header,
        [field]: value,
      },
    }))
  }

  function updateSignatures(field, value) {
    setForm((prev) => ({
      ...prev,
      signatures: {
        ...prev.signatures,
        [field]: value,
      },
    }))
  }

  function updateSectionA(rowIndex, result) {
    setForm((prev) => ({
      ...prev,
      sectionA: prev.sectionA.map((item, index) =>
        index === rowIndex ? { ...item, result } : item,
      ),
    }))
  }

  function updateRow(section, rowIndex, field, value) {
    setForm((prev) => ({
      ...prev,
      [section]: prev[section].map((row, index) =>
        index === rowIndex ? { ...row, [field]: value } : row,
      ),
    }))
  }

  function addRow(section, template) {
    setForm((prev) => ({
      ...prev,
      [section]: [...prev[section], { ...template }],
    }))
  }

  function removeRowWithTemplate(section, rowIndex, template) {
    setForm((prev) => {
      const nextRows = prev[section].filter((_, index) => index !== rowIndex)
      return {
        ...prev,
        [section]: nextRows.length ? nextRows : [{ ...template }],
      }
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (isEditing) {
        await api.put(`/records/${params.id}`, form)
      } else {
        await api.post('/records', form)
      }
      navigate('/dashboard')
    } catch (requestError) {
      setError(requestError?.response?.data?.error || 'Failed to save record.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="page-shell">
        <p>Loading record...</p>
      </div>
    )
  }

  function getInspectionItemRowSpan(index) {
    const current = form.sectionA[index]?.inspectionItem || ''
    if (!current) {
      return 1
    }
    if (index > 0 && form.sectionA[index - 1]?.inspectionItem === current) {
      return 0
    }
    let span = 1
    for (let i = index + 1; i < form.sectionA.length; i += 1) {
      if (form.sectionA[i]?.inspectionItem === current) {
        span += 1
      } else {
        break
      }
    }
    return span
  }

  return (
    <div className="page-shell">
      <header className="top-bar">
        <div>
          <h1>{isEditing ? 'Edit Production Record' : 'New Production Record'}</h1>
          <p>All fields are optional. Save first, then generate PDF from Dashboard.</p>
        </div>
        <button type="button" className="secondary-btn" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </button>
      </header>

      <form className="form-layout" onSubmit={handleSubmit}>
        {error && <p className="error-text">{error}</p>}

        <section className="card">
          {sectionTitle('Basic Header Information', 'Top area of the production form')}
          <div className="form-grid">
            <label>
              Encoding
              <input
                type="text"
                value={form.header.encoding}
                onChange={(event) => updateHeader('encoding', event.target.value)}
              />
            </label>
            <label>
              Production Date
              <input
                type="text"
                value={form.header.productionDate}
                onChange={(event) => updateHeader('productionDate', event.target.value)}
              />
            </label>
            <label>
              Product Name
              <input
                type="text"
                value={form.header.productName}
                onChange={(event) => updateHeader('productName', event.target.value)}
              />
            </label>
            <label>
              Specifications
              <input
                type="text"
                value={form.header.specifications}
                onChange={(event) => updateHeader('specifications', event.target.value)}
              />
            </label>
            <label>
              Lot Number
              <input
                type="text"
                value={form.header.lotNumber}
                onChange={(event) => updateHeader('lotNumber', event.target.value)}
              />
            </label>
          </div>
        </section>

        <section className="card">
          {sectionTitle(
            'Section A: Pre-production Inspection',
            'Inspection item / inspection content / result',
          )}
          <div className="table-scroll">
            <table className="edit-table">
              <thead>
                <tr>
                  <th>Inspection item</th>
                  <th>Inspection content</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {form.sectionA.map((row, rowIndex) => {
                  const rowSpan = getInspectionItemRowSpan(rowIndex)
                  return (
                    <tr key={`sectionA-${rowIndex}`}>
                      {rowSpan > 0 && <td rowSpan={rowSpan}>{row.inspectionItem || '-'}</td>}
                      <td>{row.inspectionContent || '-'}</td>
                      <td>
                        <div className="radio-row">
                          <label>
                            <input
                              type="radio"
                              name={`sectionA-${rowIndex}`}
                              checked={row.result === 'yes'}
                              onChange={() => updateSectionA(rowIndex, 'yes')}
                            />
                            Yes
                          </label>
                          <label>
                            <input
                              type="radio"
                              name={`sectionA-${rowIndex}`}
                              checked={row.result === 'no'}
                              onChange={() => updateSectionA(rowIndex, 'no')}
                            />
                            No
                          </label>
                          <button
                            type="button"
                            className="mini-btn"
                            onClick={() => updateSectionA(rowIndex, '')}
                          >
                            Clear
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card">
          {sectionTitle(
            'Section B: Temperature and humidity monitoring in the operating room (twice per shift,required temperature:18 °C –26°C,relative humidity:45%–65%)',
            'Twice-per-shift records',
          )}
          <div className="table-scroll">
            <table className="edit-table">
              <thead>
                <tr>
                  <th>Production processes</th>
                  <th>Time</th>
                  <th>Temperature (℃)</th>
                  <th>Relative humidity (%)</th>
                  <th>Time</th>
                  <th>Temperature (℃)</th>
                  <th>Relative humidity (%)</th>
                  <th>Inspector</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {form.sectionB.map((row, rowIndex) => (
                  <tr key={`sectionB-${rowIndex}`}>
                    <td>
                      <input
                        value={row.productionProcess}
                        onChange={(event) =>
                          updateRow('sectionB', rowIndex, 'productionProcess', event.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        value={row.time}
                        onChange={(event) =>
                          updateRow('sectionB', rowIndex, 'time', event.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        value={row.temperature}
                        onChange={(event) =>
                          updateRow('sectionB', rowIndex, 'temperature', event.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        value={row.humidity}
                        onChange={(event) =>
                          updateRow('sectionB', rowIndex, 'humidity', event.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        value={row.time2}
                        onChange={(event) =>
                          updateRow('sectionB', rowIndex, 'time2', event.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        value={row.temperature2}
                        onChange={(event) =>
                          updateRow('sectionB', rowIndex, 'temperature2', event.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        value={row.humidity2}
                        onChange={(event) =>
                          updateRow('sectionB', rowIndex, 'humidity2', event.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        value={row.inspector}
                        onChange={(event) =>
                          updateRow('sectionB', rowIndex, 'inspector', event.target.value)
                        }
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="mini-btn"
                        onClick={() =>
                          removeRowWithTemplate('sectionB', rowIndex, EMPTY_SECTION_B_ROW)
                        }
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            type="button"
            className="mini-btn"
            onClick={() => addRow('sectionB', EMPTY_SECTION_B_ROW)}
          >
            + Add Row
          </button>
        </section>

        <section className="card">
          {sectionTitle(
            'Section C: Material Requisition',
            'Fixed operating requirements',
          )}
          <div style={{ lineHeight: 1.7, color: '#0f172a' }}>
            <p style={{ margin: '0 0 6px' }}>
              1. Prepare accurate raw and auxiliary material requisition and delivery orders based
              on production orders, and submit them to the warehouse department.
            </p>
            <p style={{ margin: '0 0 6px' }}>
              2. During material requisition, meticulously verify product name, batch number,
              specifications, quantity, and inspection certificates, with designated personnel
              conducting secondary verification.
            </p>
            <p style={{ margin: 0 }}>
              3. Standardize cleaning, disinfection, and unpacking procedures before materials are
              transferred to the workshop&apos;s temporary storage area.
            </p>
          </div>
        </section>

        <section className="card">
          {sectionTitle(
            'Section D: Pre-treatment (Grinding)',
            "1.According to the process specifications, transport the material to be ground to the grinding room for processing. Replace the sieve with the specified mesh size (pre-inspected), activate the circulating cooling water, and inspect the dust collection bag for integrity; 2.Standardized site clearance must be performed during the grinding of two different materials.",
          )}
          <div className="table-scroll">
            <table className="edit-table">
              <thead>
                <tr>
                  <th>name of material</th>
                  <th>Milling Mesh Size</th>
                  <th>Weight Before Milling (kg)</th>
                  <th>Weight After Milling (kg)</th>
                  <th>Operator</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {form.sectionD.map((row, rowIndex) => (
                  <tr key={`sectionD-${rowIndex}`}>
                    <td>
                      <input
                        value={row.materialName}
                        onChange={(event) =>
                          updateRow('sectionD', rowIndex, 'materialName', event.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        value={row.meshSize}
                        onChange={(event) =>
                          updateRow('sectionD', rowIndex, 'meshSize', event.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        value={row.weightBefore}
                        onChange={(event) =>
                          updateRow('sectionD', rowIndex, 'weightBefore', event.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        value={row.weightAfter}
                        onChange={(event) =>
                          updateRow('sectionD', rowIndex, 'weightAfter', event.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        value={row.operator}
                        onChange={(event) =>
                          updateRow('sectionD', rowIndex, 'operator', event.target.value)
                        }
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="mini-btn"
                        onClick={() =>
                          removeRowWithTemplate('sectionD', rowIndex, EMPTY_SECTION_D_ROW)
                        }
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            type="button"
            className="mini-btn"
            onClick={() => addRow('sectionD', EMPTY_SECTION_D_ROW)}
          >
            + Add Row
          </button>
        </section>

        <section className="card">
          {sectionTitle(
            'Section E: Weighing and Mixing',
            'Weighing and Mixing:1.Transfer materials from the receiving area to the weighing and mixing operation room;2.According to the process formula,one person performs the weighing and mixing while another conducts verification,with timely documentation;3.Attach clear identification labels to the material containers;4.After weighing,any remaining raw or auxiliary materials that are no longer used shall be properly packaged,sealed,and labeled before returning to the warehouse.',
          )}
          <div className="table-scroll">
            <table className="edit-table">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Material specifications and names</th>
                  <th>Batch No./Receipt No.</th>
                  <th>Test Report No.</th>
                  <th>Weighed Quantity (kg)</th>
                  <th>Remaining Quantity（kg）</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {form.sectionE.map((row, rowIndex) => (
                  <tr key={`sectionE-${rowIndex}`}>
                    <td>{rowIndex + 1}</td>
                    <td>
                      <input
                        value={row.materialSpec}
                        onChange={(event) =>
                          updateRow('sectionE', rowIndex, 'materialSpec', event.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        value={row.lotOrReceipt}
                        onChange={(event) =>
                          updateRow('sectionE', rowIndex, 'lotOrReceipt', event.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        value={row.reportNo}
                        onChange={(event) =>
                          updateRow('sectionE', rowIndex, 'reportNo', event.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        value={row.weighedWeight}
                        onChange={(event) =>
                          updateRow('sectionE', rowIndex, 'weighedWeight', event.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        value={row.remainingWeight}
                        onChange={(event) =>
                          updateRow('sectionE', rowIndex, 'remainingWeight', event.target.value)
                        }
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="mini-btn"
                        onClick={() =>
                          removeRowWithTemplate('sectionE', rowIndex, EMPTY_SECTION_E_ROW)
                        }
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={2} style={{ textAlign: 'left', fontWeight: 600 }}>
                    Total ingredients (kg)
                  </td>
                  <td />
                  <td />
                  <td>
                    <input
                      type="text"
                      value={form.totalIngredients}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, totalIngredients: event.target.value }))
                      }
                    />
                  </td>
                  <td />
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
          <button
            type="button"
            className="mini-btn"
            onClick={() => addRow('sectionE', EMPTY_SECTION_E_ROW)}
          >
            + Add Row
          </button>
        </section>

        <section className="card">
          {sectionTitle('Total / Remarks / Signatures', 'Fixed electronic signatures can be optimized later')}
          <div className="form-grid">
            <label>
              Total ingredients (kg)
              <input
                type="text"
                value={form.totalIngredients}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, totalIngredients: event.target.value }))
                }
              />
            </label>
            <label>
              Manager Signature (text placeholder)
              <input
                type="text"
                value={form.signatures.manager}
                onChange={(event) => updateSignatures('manager', event.target.value)}
              />
            </label>
            <label>
              QA Signature (text placeholder)
              <input
                type="text"
                value={form.signatures.qa}
                onChange={(event) => updateSignatures('qa', event.target.value)}
              />
            </label>
            <label>
              Reviewer Signature (text placeholder)
              <input
                type="text"
                value={form.signatures.reviewer}
                onChange={(event) => updateSignatures('reviewer', event.target.value)}
              />
            </label>
          </div>
          <label>
            Remarks
            <textarea
              rows={4}
              value={form.remarks}
              onChange={(event) => setForm((prev) => ({ ...prev, remarks: event.target.value }))}
            />
          </label>
        </section>

        <div className="sticky-actions">
          <button type="submit" className="primary-btn" disabled={saving}>
            {saving ? 'Saving...' : 'Save Record'}
          </button>
        </div>
      </form>
    </div>
  )
}
