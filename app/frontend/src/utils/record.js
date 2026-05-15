import {
  SECTION_A_ROWS,
  EMPTY_SECTION_B_ROW,
  EMPTY_SECTION_D_ROW,
  EMPTY_SECTION_E_ROW,
} from '../constants'

export function createEmptyRecord() {
  return {
    header: {
      productionDate: '',
      productName: '',
      specifications: '',
      lotNumber: '',
      encoding: '',
    },
    sectionA: SECTION_A_ROWS.map((row) => ({ ...row, result: 'yes' })),
    sectionB: [{ ...EMPTY_SECTION_B_ROW }],
    sectionD: [{ ...EMPTY_SECTION_D_ROW }],
    sectionE: [{ ...EMPTY_SECTION_E_ROW }],
    totalIngredients: '',
    remarks: '',
    signatures: {
      manager: '',
      qa: '',
      reviewer: '',
    },
  }
}

export function normalizeRecordForForm(record) {
  const base = createEmptyRecord()
  const existingRows = Array.isArray(record.sectionA) ? record.sectionA : []
  const existingMap = new Map(
    existingRows.map((row) => [
      `${row.inspectionItem || ''}__${row.inspectionContent || ''}`,
      row,
    ]),
  )

  return {
    ...base,
    ...record,
    header: {
      ...base.header,
      ...(record.header || {}),
    },
    sectionA: base.sectionA.map((defaultRow) => {
      const key = `${defaultRow.inspectionItem}__${defaultRow.inspectionContent}`
      const existing = existingMap.get(key)
      return {
        inspectionItem: defaultRow.inspectionItem,
        inspectionContent: defaultRow.inspectionContent,
        result: existing?.result || '',
      }
    }),
    sectionB: record.sectionB?.length
      ? record.sectionB.map((row) => ({
          ...EMPTY_SECTION_B_ROW,
          ...(row || {}),
          productionProcess: row?.productionProcess || EMPTY_SECTION_B_ROW.productionProcess,
        }))
      : [{ ...EMPTY_SECTION_B_ROW }],
    sectionD: record.sectionD?.length ? record.sectionD : [{ ...EMPTY_SECTION_D_ROW }],
    sectionE: record.sectionE?.length ? record.sectionE : [{ ...EMPTY_SECTION_E_ROW }],
    signatures: {
      ...base.signatures,
      ...(record.signatures || {}),
    },
  }
}
