const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = Number(process.env.PORT || 3001);
const IS_VERCEL = process.env.VERCEL === '1';
const DATABASE_FILE =
  process.env.DATABASE_FILE ||
  (IS_VERCEL ? '/tmp/production.db' : path.join(__dirname, 'data', 'production.db'));

const SECTION_A_DEFAULT_ROWS = [
  {
    inspectionItem: 'Sanitation',
    inspectionContent:
      'Clean door/window/floor/wall/air inlet/air outlet, etc., to meet requirements',
    result: '',
  },
  {
    inspectionItem: 'Sanitation',
    inspectionContent:
      'The door/window/floor/wall/air inlet/air outlet, etc., should be cleaned again to meet the requirements.',
    result: '',
  },
  {
    inspectionItem: 'Personnel hygiene',
    inspectionContent: 'All operators hold valid health certificates for employment.',
    result: '',
  },
  {
    inspectionItem: 'Personnel hygiene',
    inspectionContent:
      'All operators have standardized the change of work attire and undergone disinfection.',
    result: '',
  },
  {
    inspectionItem: 'Equipment and Facilities',
    inspectionContent:
      'The equipment, containers, and tools used have been cleaned or sanitized, and the equipment inspection is normal.',
    result: '',
  },
  {
    inspectionItem: 'Equipment and Facilities',
    inspectionContent:
      'The equipment, containers, and tools used were re-cleaned or re-cleaned to meet the requirements.',
    result: '',
  },
  {
    inspectionItem: 'Equipment and Facilities',
    inspectionContent: 'The dust removal system is operational.',
    result: '',
  },
  {
    inspectionItem: 'Calibration',
    inspectionContent:
      'The required weighing instruments are within the valid calibration period.',
    result: '',
  },
  {
    inspectionItem: 'Line Clearance',
    inspectionContent:
      'The last batch of products has been cleared and approved upon completion of production, and remains valid.',
    result: '',
  },
  {
    inspectionItem: 'Line Clearance',
    inspectionContent: 'Clear and pass',
    result: '',
  },
  {
    inspectionItem: 'Temperature & Humidity',
    inspectionContent:
      'Temperature and humidity control in the production area meets the requirements',
    result: '',
  },
  {
    inspectionItem: 'Temperature & Humidity',
    inspectionContent:
      'Temperature and humidity in the production area have been readjusted to meet the requirements',
    result: '',
  },
];

ensureDatabaseDirectory(DATABASE_FILE);

const db = new sqlite3.Database(DATABASE_FILE);

db.serialize(() => {
  db.run('PRAGMA foreign_keys = ON');
});

app.use(cors());
app.use(express.json({ limit: '2mb' }));

const startupPromise = initializeSchema();

if (IS_VERCEL) {
  startupPromise.catch((error) => {
    console.error('Failed to initialize database schema (serverless)', error);
  });
} else {
  startupPromise
    .then(() => {
      app.listen(PORT, () => {
        console.log(`Backend running on port ${PORT}`);
        console.log(`SQLite file: ${DATABASE_FILE}`);
      });
    })
    .catch((error) => {
      console.error('Failed to initialize database schema', error);
      process.exit(1);
    });
}

app.use(async (_req, _res, next) => {
  try {
    await startupPromise;
    next();
  } catch (error) {
    next(error);
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/records', async (req, res) => {
  const q = String(req.query.q || '').trim();
  const page = Math.max(Number(req.query.page || 1), 1);
  const pageSize = Math.min(Math.max(Number(req.query.pageSize || 20), 1), 100);
  const offset = (page - 1) * pageSize;

  try {
    const whereSql = q
      ? 'WHERE product_name LIKE ? OR lot_number LIKE ?'
      : '';
    const whereParams = q ? [`%${q}%`, `%${q}%`] : [];

    const countRow = await get(
      `SELECT COUNT(*) AS total FROM records ${whereSql}`,
      whereParams,
    );

    const rows = await all(
      `
      SELECT
        id,
        production_date,
        product_name,
        specifications,
        lot_number,
        total_ingredients,
        manager_signature,
        qa_signature,
        reviewer_signature,
        created_at,
        updated_at
      FROM records
      ${whereSql}
      ORDER BY datetime(updated_at) DESC, id DESC
      LIMIT ? OFFSET ?
      `,
      [...whereParams, pageSize, offset],
    );

    res.json({
      items: rows,
      page,
      pageSize,
      total: countRow?.total || 0,
    });
  } catch (error) {
    handleApiError(res, error);
  }
});

app.get('/api/records/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid record id' });
  }

  try {
    const record = await get('SELECT * FROM records WHERE id = ?', [id]);
    if (!record) {
      return res.status(404).json({ error: 'Record not found' });
    }

    const sectionAFromDb = await all(
      `
      SELECT item_key AS inspectionItem, item_label AS inspectionContent, status AS result
      FROM section_a_checks
      WHERE record_id = ?
      ORDER BY row_order ASC, id ASC
      `,
      [id],
    );
    const sectionB = await all(
      `
      SELECT
        production_process AS productionProcess,
        time,
        temperature,
        humidity,
        time2,
        temperature2,
        humidity2,
        inspector
      FROM section_b_logs
      WHERE record_id = ?
      ORDER BY row_order ASC, id ASC
      `,
      [id],
    );
    const sectionD = await all(
      `
      SELECT material_name AS materialName,
             mesh_size AS meshSize,
             weight_before AS weightBefore,
             weight_after AS weightAfter,
             operator
      FROM section_d_rows
      WHERE record_id = ?
      ORDER BY row_order ASC, id ASC
      `,
      [id],
    );
    const sectionE = await all(
      `
      SELECT material_spec AS materialSpec,
             lot_or_receipt AS lotOrReceipt,
             report_no AS reportNo,
             weighed_weight AS weighedWeight,
             remaining_weight AS remainingWeight
      FROM section_e_rows
      WHERE record_id = ?
      ORDER BY row_order ASC, id ASC
      `,
      [id],
    );

    const sectionA = mergeSectionA(sectionAFromDb);

    return res.json({
      id: record.id,
      header: {
        productionDate: record.production_date || '',
        productName: record.product_name || '',
        specifications: record.specifications || '',
        lotNumber: record.lot_number || '',
        encoding: record.encoding || '',
      },
      sectionA,
      sectionB,
      sectionD,
      sectionE,
      totalIngredients: record.total_ingredients || '',
      remarks: record.remarks || '',
      signatures: {
        manager: record.manager_signature || '',
        qa: record.qa_signature || '',
        reviewer: record.reviewer_signature || '',
      },
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    });
  } catch (error) {
    handleApiError(res, error);
  }
});

app.post('/api/records', async (req, res) => {
  try {
    const payload = normalizePayload(req.body);
    const now = new Date().toISOString();

    const result = await withTransaction(async () => {
      const insert = await run(
        `
        INSERT INTO records (
          production_date,
          product_name,
          specifications,
          lot_number,
          encoding,
          remarks,
          total_ingredients,
          manager_signature,
          qa_signature,
          reviewer_signature,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          payload.header.productionDate,
          payload.header.productName,
          payload.header.specifications,
          payload.header.lotNumber,
          payload.header.encoding,
          payload.remarks,
          payload.totalIngredients,
          payload.signatures.manager,
          payload.signatures.qa,
          payload.signatures.reviewer,
          now,
          now,
        ],
      );

      const recordId = insert.lastID;
      await replaceChildren(recordId, payload);
      return recordId;
    });

    res.status(201).json({ id: result });
  } catch (error) {
    handleApiError(res, error);
  }
});

app.put('/api/records/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid record id' });
  }

  try {
    const exists = await get('SELECT id FROM records WHERE id = ?', [id]);
    if (!exists) {
      return res.status(404).json({ error: 'Record not found' });
    }

    const payload = normalizePayload(req.body);
    const now = new Date().toISOString();

    await withTransaction(async () => {
      await run(
        `
        UPDATE records
        SET production_date = ?,
            product_name = ?,
            specifications = ?,
            lot_number = ?,
            encoding = ?,
            remarks = ?,
            total_ingredients = ?,
            manager_signature = ?,
            qa_signature = ?,
            reviewer_signature = ?,
            updated_at = ?
        WHERE id = ?
        `,
        [
          payload.header.productionDate,
          payload.header.productName,
          payload.header.specifications,
          payload.header.lotNumber,
          payload.header.encoding,
          payload.remarks,
          payload.totalIngredients,
          payload.signatures.manager,
          payload.signatures.qa,
          payload.signatures.reviewer,
          now,
          id,
        ],
      );

      await replaceChildren(id, payload);
    });

    res.json({ ok: true });
  } catch (error) {
    handleApiError(res, error);
  }
});

app.delete('/api/records/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid record id' });
  }

  try {
    const result = await run('DELETE FROM records WHERE id = ?', [id]);
    if (!result.changes) {
      return res.status(404).json({ error: 'Record not found' });
    }
    res.json({ ok: true });
  } catch (error) {
    handleApiError(res, error);
  }
});

async function initializeSchema() {
  await run(`
    CREATE TABLE IF NOT EXISTS records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      production_date TEXT,
      product_name TEXT,
      specifications TEXT,
      lot_number TEXT,
      encoding TEXT,
      remarks TEXT,
      total_ingredients TEXT,
      manager_signature TEXT,
      qa_signature TEXT,
      reviewer_signature TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS section_a_checks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_id INTEGER NOT NULL,
      item_key TEXT NOT NULL,
      item_label TEXT NOT NULL,
      status TEXT,
      row_order INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (record_id) REFERENCES records(id) ON DELETE CASCADE
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS section_b_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_id INTEGER NOT NULL,
      production_process TEXT,
      time TEXT,
      temperature TEXT,
      humidity TEXT,
      time2 TEXT,
      temperature2 TEXT,
      humidity2 TEXT,
      inspector TEXT,
      row_order INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (record_id) REFERENCES records(id) ON DELETE CASCADE
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS section_d_rows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_id INTEGER NOT NULL,
      material_name TEXT,
      mesh_size TEXT,
      weight_before TEXT,
      weight_after TEXT,
      operator TEXT,
      row_order INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (record_id) REFERENCES records(id) ON DELETE CASCADE
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS section_e_rows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_id INTEGER NOT NULL,
      material_spec TEXT,
      lot_or_receipt TEXT,
      report_no TEXT,
      weighed_weight TEXT,
      remaining_weight TEXT,
      row_order INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (record_id) REFERENCES records(id) ON DELETE CASCADE
    )
  `);

  await ensureColumnExists('records', 'encoding', 'TEXT');
  await ensureColumnExists('section_b_logs', 'production_process', 'TEXT');
  await ensureColumnExists('section_b_logs', 'time2', 'TEXT');
  await ensureColumnExists('section_b_logs', 'temperature2', 'TEXT');
  await ensureColumnExists('section_b_logs', 'humidity2', 'TEXT');
}

function normalizePayload(body) {
  const header = body?.header || {};
  const signatures = body?.signatures || {};

  return {
    header: {
      productionDate: toText(header.productionDate),
      productName: toText(header.productName),
      specifications: toText(header.specifications),
      lotNumber: toText(header.lotNumber),
      encoding: toText(header.encoding),
    },
    sectionA: normalizeSectionA(body?.sectionA),
    sectionB: normalizeRows(body?.sectionB, [
      'productionProcess',
      'time',
      'temperature',
      'humidity',
      'time2',
      'temperature2',
      'humidity2',
      'inspector',
    ]).map((row) => ({
      ...row,
      productionProcess: row.productionProcess || 'Weighing & Blending',
    })),
    sectionD: normalizeRows(body?.sectionD, [
      'materialName',
      'meshSize',
      'weightBefore',
      'weightAfter',
      'operator',
    ]),
    sectionE: normalizeRows(body?.sectionE, [
      'materialSpec',
      'lotOrReceipt',
      'reportNo',
      'weighedWeight',
      'remainingWeight',
    ]),
    totalIngredients: toText(body?.totalIngredients),
    remarks: toText(body?.remarks),
    signatures: {
      manager: toText(signatures.manager),
      qa: toText(signatures.qa),
      reviewer: toText(signatures.reviewer),
    },
  };
}

function normalizeSectionA(value) {
  const rows = Array.isArray(value) ? value : [];
  const normalizedRows = rows
    .map((row) => ({
      inspectionItem: toText(row?.inspectionItem),
      inspectionContent: toText(row?.inspectionContent),
      result: normalizeResult(row?.result || row?.status),
    }))
    .filter((row) => row.inspectionItem !== '' || row.inspectionContent !== '');

  return alignSectionARows(normalizedRows);
}

function mergeSectionA(sectionAFromDb) {
  const rows = Array.isArray(sectionAFromDb) ? sectionAFromDb : [];
  const normalizedRows = rows
    .map((row) => ({
      inspectionItem: toText(row.inspectionItem),
      inspectionContent: toText(row.inspectionContent),
      result: normalizeResult(row.result),
    }))
    .filter((row) => row.inspectionItem !== '' || row.inspectionContent !== '');

  return alignSectionARows(normalizedRows);
}

function normalizeRows(rows, fields) {
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows.map((row) => {
    const normalized = {};
    for (const field of fields) {
      normalized[field] = toText(row?.[field]);
    }
    return normalized;
  });
}

function normalizeResult(value) {
  const text = toText(value).toLowerCase();
  if (text === 'yes' || text === 'no') {
    return text;
  }
  return '';
}

function alignSectionARows(rows) {
  const rowMap = new Map(
    rows.map((row) => [
      `${row.inspectionItem}__${row.inspectionContent}`,
      row,
    ]),
  );

  return SECTION_A_DEFAULT_ROWS.map((defaultRow) => {
    const key = `${defaultRow.inspectionItem}__${defaultRow.inspectionContent}`;
    const existing = rowMap.get(key);
    return {
      inspectionItem: defaultRow.inspectionItem,
      inspectionContent: defaultRow.inspectionContent,
      result: existing?.result || '',
    };
  });
}

async function replaceChildren(recordId, payload) {
  await run('DELETE FROM section_a_checks WHERE record_id = ?', [recordId]);
  await run('DELETE FROM section_b_logs WHERE record_id = ?', [recordId]);
  await run('DELETE FROM section_d_rows WHERE record_id = ?', [recordId]);
  await run('DELETE FROM section_e_rows WHERE record_id = ?', [recordId]);

  for (let index = 0; index < payload.sectionA.length; index += 1) {
    const row = payload.sectionA[index];
    await run(
      `
      INSERT INTO section_a_checks (record_id, item_key, item_label, status, row_order)
      VALUES (?, ?, ?, ?, ?)
      `,
      [recordId, row.inspectionItem, row.inspectionContent, row.result, index],
    );
  }

  for (let index = 0; index < payload.sectionB.length; index += 1) {
    const row = payload.sectionB[index];
    if (!hasAnyValue(row)) {
      continue;
    }
    await run(
      `
      INSERT INTO section_b_logs (
        record_id,
        production_process,
        time,
        temperature,
        humidity,
        time2,
        temperature2,
        humidity2,
        inspector,
        row_order
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        recordId,
        row.productionProcess,
        row.time,
        row.temperature,
        row.humidity,
        row.time2,
        row.temperature2,
        row.humidity2,
        row.inspector,
        index,
      ],
    );
  }

  for (let index = 0; index < payload.sectionD.length; index += 1) {
    const row = payload.sectionD[index];
    if (!hasAnyValue(row)) {
      continue;
    }
    await run(
      `
      INSERT INTO section_d_rows (
        record_id, material_name, mesh_size, weight_before, weight_after, operator, row_order
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        recordId,
        row.materialName,
        row.meshSize,
        row.weightBefore,
        row.weightAfter,
        row.operator,
        index,
      ],
    );
  }

  for (let index = 0; index < payload.sectionE.length; index += 1) {
    const row = payload.sectionE[index];
    if (!hasAnyValue(row)) {
      continue;
    }
    await run(
      `
      INSERT INTO section_e_rows (
        record_id, material_spec, lot_or_receipt, report_no, weighed_weight, remaining_weight, row_order
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        recordId,
        row.materialSpec,
        row.lotOrReceipt,
        row.reportNo,
        row.weighedWeight,
        row.remainingWeight,
        index,
      ],
    );
  }
}

function hasAnyValue(row) {
  return Object.values(row).some((value) => toText(value) !== '');
}

function ensureDatabaseDirectory(filePath) {
  const directory = path.dirname(filePath);
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
}

async function ensureColumnExists(tableName, columnName, columnType) {
  const columns = await all(`PRAGMA table_info(${tableName})`);
  const exists = columns.some((column) => column.name === columnName);
  if (!exists) {
    await run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnType}`);
  }
}

function withTransaction(callback) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION', async (beginErr) => {
        if (beginErr) {
          reject(beginErr);
          return;
        }

        try {
          const result = await callback();
          db.run('COMMIT', (commitErr) => {
            if (commitErr) {
              reject(commitErr);
              return;
            }
            resolve(result);
          });
        } catch (error) {
          db.run('ROLLBACK', () => {
            reject(error);
          });
        }
      });
    });
  });
}

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(error) {
      if (error) {
        reject(error);
        return;
      }
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(rows);
    });
  });
}

function toText(value) {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value).trim();
}

function handleApiError(res, error) {
  console.error(error);
  res.status(500).json({ error: 'Internal server error' });
}

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
