import {
  Document,
  Font,
  Image,
  Page,
  Path,
  Rect,
  Svg,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer'
import notoSansSc400 from '@fontsource/noto-sans-sc/files/noto-sans-sc-chinese-simplified-400-normal.woff'
import notoSansSc700 from '@fontsource/noto-sans-sc/files/noto-sans-sc-chinese-simplified-700-normal.woff'

Font.register({
  family: 'NotoSansSC',
  fonts: [
    { src: notoSansSc400, fontWeight: 400, fontStyle: 'normal' },
    { src: notoSansSc700, fontWeight: 700, fontStyle: 'normal' },
  ],
})

const styles = StyleSheet.create({
  page: {
    paddingTop: 108,
    paddingBottom: 24,
    paddingHorizontal: 24,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#111827',
  },
  headerRow: {
    position: 'absolute',
    top: 24,
    left: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottom: '1 solid #d1d5db',
    paddingBottom: 8,
  },
  logo: {
    width: 95,
    height: 64,
    objectFit: 'contain',
  },
  headerTextWrap: {
    flex: 1,
  },
  fixedTitleLine1: {
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 4,
  },
  fixedTitleLine2: {
    fontSize: 11,
    fontWeight: 700,
  },
  sectionTitle: {
    marginTop: 10,
    marginBottom: 6,
    fontSize: 10,
    fontWeight: 700,
  },
  row: {
    flexDirection: 'row',
    borderBottom: '1 solid #d1d5db',
  },
  cell: {
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderRight: '1 solid #d1d5db',
  },
  table: {
    border: '1 solid #d1d5db',
    marginBottom: 8,
  },
  sectionEGroup: {
    border: '1 solid #d1d5db',
    marginBottom: 8,
  },
  sectionEInnerTable: {
    borderWidth: 0,
    marginBottom: 0,
  },
  label: {
    width: '30%',
    backgroundColor: '#f3f4f6',
  },
  value: {
    width: '70%',
  },
  footerRow: {
    flexDirection: 'row',
    marginTop: 14,
    gap: 8,
  },
  footerBox: {
    flex: 1,
    border: '1 solid #d1d5db',
    padding: 6,
    minHeight: 36,
  },
  noteBox: {
    border: '1 solid #d1d5db',
    padding: 6,
    minHeight: 210,
    position: 'relative',
  },
  remarksSealWrap: {
    position: 'absolute',
    left: 6,
    right: 6,
    top: 4,
    alignItems: 'center',
  },
  remarksSealImage: {
    width: 132,
    height: 132,
    objectFit: 'contain',
  },
  remarksFooterRow: {
    position: 'absolute',
    left: 6,
    right: 6,
    bottom: 6,
    flexDirection: 'row',
    gap: 8,
  },
  resultInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  resultOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  signoffTable: {
    border: '1 solid #d1d5db',
    marginTop: -1,
    marginBottom: 8,
  },
  sectionEInlineSignoffRow: {
    flexDirection: 'row',
  },
  signoffRow: {
    flexDirection: 'row',
  },
  signoffLabelCell: {
    width: '20%',
    borderRight: '1 solid #d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 0,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  signoffSignatureCell: {
    width: '13.33%',
    borderRight: '1 solid #d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 0,
    paddingVertical: 4,
    paddingHorizontal: 4,
    overflow: 'hidden',
  },
  signImage: {
    width: 82,
    height: 24,
    objectFit: 'contain',
    alignSelf: 'center',
  },
  footerQaSignImage: {
    width: 123,
    height: 36,
    objectFit: 'contain',
    alignSelf: 'center',
  },
  sectionBInspectorImage: {
    width: 56,
    height: 20,
    objectFit: 'contain',
    alignSelf: 'center',
  },
  sectionCBox: {
    border: '1 solid #d1d5db',
    paddingVertical: 4,
    paddingHorizontal: 6,
    marginBottom: 6,
  },
  sectionCText: {
    fontSize: 10,
    fontWeight: 700,
  },
  remarksTitleAfterSectionE: {
    marginTop: 8,
  },
  cjkText: {
    fontFamily: 'NotoSansSC',
  },
})

function safeArray(value) {
  return Array.isArray(value) && value.length > 0 ? value : []
}

function valueOrDash(value) {
  return value || '-'
}

function containsCjk(value) {
  return /[\u3400-\u9fff\uf900-\ufaff]/.test(String(value || ''))
}

function DynamicValueText({ value }) {
  const text = valueOrDash(value)
  return <Text style={containsCjk(text) ? styles.cjkText : null}>{text}</Text>
}

function renderHeaderField(label, value) {
  return (
    <View style={styles.row} key={label}>
      <View style={[styles.cell, styles.label]}>
        <Text>{label}</Text>
      </View>
      <View style={[styles.cell, styles.value]}>
        <DynamicValueText value={value} />
      </View>
    </View>
  )
}

function renderHeaderSignatureField(label, signatureSrc, signatureStyle = styles.signImage) {
  return (
    <View style={styles.row} key={`${label}-signature`}>
      <View style={[styles.cell, styles.label]}>
        <Text>{label}</Text>
      </View>
      <View style={[styles.cell, styles.value, { justifyContent: 'center' }]}>
        <Image style={signatureStyle} src={signatureSrc} />
      </View>
    </View>
  )
}

function CheckIcon({ checked }) {
  return (
    <Svg width={9} height={9} viewBox="0 0 10 10">
      <Rect x={0.6} y={0.6} width={8.8} height={8.8} stroke="#111827" strokeWidth={1} fill="none" />
      {checked ? (
        <Path d="M2 5.2 L4.1 7.2 L8 3.2" stroke="#111827" strokeWidth={1.2} fill="none" />
      ) : null}
    </Svg>
  )
}

function SectionATable({ rows }) {
  const columnWeights = [1.8, 5.8, 1.8]
  const safeRows = rows.length
    ? rows
    : [{ inspectionItem: '-', inspectionContent: '-', result: '' }]

  return (
    <View style={styles.table}>
      <View style={styles.row}>
        <View style={[styles.cell, { flex: columnWeights[0], backgroundColor: '#f3f4f6' }]}>
          <Text>Inspection item</Text>
        </View>
        <View style={[styles.cell, { flex: columnWeights[1], backgroundColor: '#f3f4f6' }]}>
          <Text>Inspection content</Text>
        </View>
        <View style={[styles.cell, { flex: columnWeights[2], backgroundColor: '#f3f4f6' }]}>
          <Text>Result</Text>
        </View>
      </View>
      {safeRows.map((item, rowIndex) => {
        const resultValue = (item.result || '').toLowerCase()
        return (
          <View style={styles.row} key={`section-a-row-${rowIndex}`}>
            <View style={[styles.cell, { flex: columnWeights[0] }]}>
              <DynamicValueText value={item.inspectionItem} />
            </View>
            <View style={[styles.cell, { flex: columnWeights[1] }]}>
              <DynamicValueText value={item.inspectionContent} />
            </View>
            <View style={[styles.cell, { flex: columnWeights[2] }]}>
              <View style={styles.resultInline}>
                <View style={styles.resultOption}>
                  <Text>Yes</Text>
                  <CheckIcon checked={resultValue === 'yes'} />
                </View>
                <View style={styles.resultOption}>
                  <Text>No</Text>
                  <CheckIcon checked={resultValue === 'no'} />
                </View>
              </View>
            </View>
          </View>
        )
      })}
    </View>
  )
}

function SectionESignoffRow({ inline = false }) {
  return (
    <View style={inline ? styles.sectionEInlineSignoffRow : styles.signoffTable}>
      <View style={styles.signoffRow}>
        <View style={[styles.signoffLabelCell, { width: '25%' }]}>
          <Text>accusatory person</Text>
        </View>
        <View style={[styles.signoffSignatureCell, { width: '25%' }]}>
          <Image style={styles.signImage} src="/signatures/accusatory-person.png" />
        </View>
        <View style={[styles.signoffLabelCell, { width: '25%' }]}>
          <Text>Checked by</Text>
        </View>
        <View style={[styles.signoffSignatureCell, { width: '25%', borderRight: 'none' }]}>
          <Image style={styles.signImage} src="/signatures/section-e-checked-by.png" />
        </View>
      </View>
    </View>
  )
}

function SectionASignoffRow() {
  return (
    <View style={styles.signoffTable}>
      <View style={styles.signoffRow}>
        <View style={styles.signoffLabelCell}>
          <Text>Checked by</Text>
        </View>
        <View style={styles.signoffSignatureCell}>
          <Image style={styles.signImage} src="/signatures/checked-by-a.png" />
        </View>
        <View style={styles.signoffLabelCell}>
          <Text>Production Manager</Text>
        </View>
        <View style={styles.signoffSignatureCell}>
          <Image style={styles.signImage} src="/signatures/production-manager.png" />
        </View>
        <View style={styles.signoffLabelCell}>
          <Text>QA Verification</Text>
        </View>
        <View style={[styles.signoffSignatureCell, { borderRight: 'none' }]}>
          <Image style={styles.signImage} src="/signatures/qa-verification.png" />
        </View>
      </View>
    </View>
  )
}

function Table({ headers, rows, columnWeights, containerStyle }) {
  return (
    <View style={[styles.table, containerStyle]}>
      <View style={styles.row}>
        {headers.map((head, colIndex) => (
          <View
            key={head}
            style={[
              styles.cell,
              {
                flex: columnWeights?.[colIndex] || 1,
                backgroundColor: '#f3f4f6',
              },
            ]}
          >
            <Text>{head}</Text>
          </View>
        ))}
      </View>
      {(rows.length ? rows : [Array(headers.length).fill('-')]).map((row, rowIndex) => {
        let columnCursor = 0
        return (
          <View style={styles.row} key={`row-${rowIndex}`}>
            {row.map((item, colIndex) => {
              let value = item
              let colSpan = 1

              if (item && typeof item === 'object' && !Array.isArray(item)) {
                value = item.value
                colSpan = item.colSpan || 1
              }

              let flexValue = 0
              for (let i = 0; i < colSpan; i += 1) {
                flexValue += columnWeights?.[columnCursor + i] || 1
              }

              columnCursor += colSpan

              return (
                <View key={`col-${colIndex}`} style={[styles.cell, { flex: flexValue }]}>
                  <DynamicValueText value={value} />
                </View>
              )
            })}
          </View>
        )
      })}
    </View>
  )
}

function SectionBTable({ rows }) {
  const headers = [
    'Production processes',
    'Time',
    'Temperature (℃)',
    'Relative humidity (%)',
    'Time',
    'Temperature (℃)',
    'Relative humidity (%)',
    'Inspector',
  ]
  const columnWeights = [1.9, 1.1, 1.2, 1.5, 1.1, 1.2, 1.5, 1.2]
  const safeRows = rows.length
    ? rows
    : [
        {
          productionProcess: 'Weighing & Blending',
          time: '',
          temperature: '',
          humidity: '',
          time2: '',
          temperature2: '',
          humidity2: '',
        },
      ]

  return (
    <View style={styles.table}>
      <View style={styles.row}>
        {headers.map((head, colIndex) => (
          <View
            key={`section-b-head-${colIndex}`}
            style={[styles.cell, { flex: columnWeights[colIndex], backgroundColor: '#f3f4f6' }]}
          >
            <Text>{head}</Text>
          </View>
        ))}
      </View>
      {safeRows.map((item, rowIndex) => (
        <View style={styles.row} key={`section-b-row-${rowIndex}`}>
          <View style={[styles.cell, { flex: columnWeights[0] }]}>
            <DynamicValueText value={item.productionProcess || 'Weighing & Blending'} />
          </View>
          <View style={[styles.cell, { flex: columnWeights[1] }]}>
            <DynamicValueText value={item.time} />
          </View>
          <View style={[styles.cell, { flex: columnWeights[2] }]}>
            <DynamicValueText value={item.temperature} />
          </View>
          <View style={[styles.cell, { flex: columnWeights[3] }]}>
            <DynamicValueText value={item.humidity} />
          </View>
          <View style={[styles.cell, { flex: columnWeights[4] }]}>
            <DynamicValueText value={item.time2} />
          </View>
          <View style={[styles.cell, { flex: columnWeights[5] }]}>
            <DynamicValueText value={item.temperature2} />
          </View>
          <View style={[styles.cell, { flex: columnWeights[6] }]}>
            <DynamicValueText value={item.humidity2} />
          </View>
          <View style={[styles.cell, { flex: columnWeights[7], alignItems: 'center', justifyContent: 'center' }]}>
            <Image style={styles.sectionBInspectorImage} src="/signatures/checked-by.png" />
          </View>
        </View>
      ))}
    </View>
  )
}

function SectionCBlock() {
  return (
    <View style={styles.sectionCBox}>
      <Text style={styles.sectionCText}>
        Section C: Material Requisition: 1. Prepare accurate raw and auxiliary material
        requisition and delivery orders based on production orders,and submit them to the warehouse
        department; 2. During material requisition,meticulously verify product name,batch
        number,specifications,quantity,and inspection certificates,with designated personnel
        conducting secondary verification; 3. Standardize cleaning,disinfection,and unpacking
        procedures before materials are transferred to the workshop&apos;s temporary storage area.
      </Text>
    </View>
  )
}

export default function ProductionRecordPdf({ record }) {
  const sectionA = safeArray(record?.sectionA)
  const sectionB = safeArray(record?.sectionB)
  const sectionD = safeArray(record?.sectionD)
  const sectionE = safeArray(record?.sectionE)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View fixed style={styles.headerRow}>
          <Image style={styles.logo} src="/company-logo.png" />
          <View style={styles.headerTextWrap}>
            <Text style={styles.fixedTitleLine1}>
              Shanghai Hoo Pharmaceutical. Co.,Ltd. record documents
            </Text>
            <Text style={styles.fixedTitleLine2}>
              Productions records of solid dosage form pretreatment and weighing process
            </Text>
          </View>
        </View>

        <View style={styles.table}>
          {renderHeaderField('Encoding', record?.header?.encoding)}
          {renderHeaderField('Production Date', record?.header?.productionDate)}
          {renderHeaderField('Product Name', record?.header?.productName)}
          {renderHeaderField('Specifications', record?.header?.specifications)}
          {renderHeaderField('Lot Number', record?.header?.lotNumber)}
        </View>

        <Text style={styles.sectionTitle}>Section A: Pre-production Inspection</Text>
        <SectionATable rows={sectionA} />
        <SectionASignoffRow />

        <Text style={styles.sectionTitle}>
          Section B: Temperature and humidity monitoring in the operating room (twice per
          shift,required temperature:18 °C –26°C,relative humidity:45%–65%)
        </Text>
        <SectionBTable rows={sectionB} />

        <SectionCBlock />

        <Text break style={styles.sectionTitle}>
          Section D: Pre-treatment (Grinding): 1.According to the process specifications,
          transport the material to be ground to the grinding room for processing. Replace the
          sieve with the specified mesh size (pre-inspected), activate the circulating cooling
          water, and inspect the dust collection bag for integrity; 2.Standardized site clearance
          must be performed during the grinding of two different materials.
        </Text>
        <Table
          headers={[
            'name of material',
            'Milling Mesh Size',
            'Weight Before Milling (kg)',
            'Weight After Milling (kg)',
            'Operator',
          ]}
          rows={sectionD.map((item) => [
            item.materialName,
            item.meshSize,
            item.weightBefore,
            item.weightAfter,
            item.operator,
          ])}
        />

        <Text style={styles.sectionTitle}>
          Section E: Weighing and Mixing:1.Transfer materials from the receiving area to the
          weighing and mixing operation room;2.According to the process formula,one person
          performs the weighing and mixing while another conducts verification,with timely
          documentation;3.Attach clear identification labels to the material containers;4.After
          weighing,any remaining raw or auxiliary materials that are no longer used shall be
          properly packaged,sealed,and labeled before returning to the warehouse.
        </Text>
        <View style={styles.sectionEGroup}>
          <Table
            headers={[
              'No.',
              'Material specifications and names',
              'Batch No./Receipt No.',
              'Test Report No.',
              'Weighed Quantity (kg)',
              'Remaining Quantity（kg）',
            ]}
            columnWeights={[0.7, 2.8, 1.8, 1.6, 1.6, 1.8]}
            containerStyle={styles.sectionEInnerTable}
            rows={[
              ...sectionE.map((item, rowIndex) => [
                String(rowIndex + 1),
                item.materialSpec,
                item.lotOrReceipt,
                item.reportNo,
                item.weighedWeight,
                item.remainingWeight,
              ]),
              [{ value: 'Total ingredients (kg)', colSpan: 2 }, ' ', ' ', record?.totalIngredients, ' '],
            ]}
          />

          <SectionESignoffRow inline />
        </View>

        <Text style={[styles.sectionTitle, styles.remarksTitleAfterSectionE]}>Remarks</Text>
        <View style={styles.noteBox}>
          <View style={styles.remarksSealWrap}>
            <Image style={styles.remarksSealImage} src="/stamps/remarks-seal.png" />
          </View>
          <View style={styles.remarksFooterRow}>
            <View style={styles.footerBox}>
              <Text>Production Manager Signature</Text>
              <View
                style={[
                  styles.signoffSignatureCell,
                  { width: '100%', borderRight: 'none', paddingVertical: 0, minHeight: 24 },
                ]}
              >
                <Image style={styles.signImage} src="/signatures/footer-production-manager.png" />
              </View>
            </View>
            <View style={styles.footerBox}>
              <Text>QA Inspector Signature</Text>
              <View
                style={[
                  styles.signoffSignatureCell,
                  { width: '100%', borderRight: 'none', paddingVertical: 0, minHeight: 24 },
                ]}
              >
                <Image
                  style={[styles.signImage, styles.footerQaSignImage]}
                  src="/signatures/footer-qa-inspector.png"
                />
              </View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  )
}
