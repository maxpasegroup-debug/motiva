import { getPool } from "@/server/db/pool";
import prisma from "@/lib/prisma";
import { normalizeLeadFlowType, normalizeLeadStatus, type LeadStatus } from "@/lib/leads";

let tableReady: Promise<void> | null = null;

async function ensureCrmTables(): Promise<void> {
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS leads (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(64) NOT NULL,
      type VARCHAR(32) NOT NULL CHECK (type IN ('tuition', 'foundation', 'remedial')),
      subjects TEXT,
      status VARCHAR(32) NOT NULL DEFAULT 'new'
        CHECK (status IN (
          'new', 'contacted', 'demo_scheduled', 'demo_done', 'counseling',
          'admission', 'payment_pending', 'payment_confirmed', 'mentor_assigned',
          'closed_won', 'closed_lost', 'demo', 'closed'
        )),
      flow_type VARCHAR(32) NOT NULL DEFAULT 'tuition'
        CHECK (flow_type IN ('tuition', 'remedial')),
      assigned_to VARCHAR(255),
      assigned_mentor_id UUID,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_leads_status ON leads (status)`,
  );
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_leads_assigned ON leads (assigned_to)`,
  );

  await pool.query(`
    CREATE TABLE IF NOT EXISTS demos (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      lead_id UUID NOT NULL REFERENCES leads (id) ON DELETE CASCADE,
      demo_executive_id VARCHAR(255) NOT NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'completed')),
      result VARCHAR(32) CHECK (result IS NULL OR result IN ('interested', 'not_interested')),
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_demos_lead_id ON demos (lead_id)`,
  );
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_demos_executive ON demos (demo_executive_id)`,
  );

  await pool.query(`
    CREATE TABLE IF NOT EXISTS admissions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      lead_id UUID NOT NULL REFERENCES leads (id) ON DELETE RESTRICT,
      student_name VARCHAR(255) NOT NULL,
      parent_name VARCHAR(255) NOT NULL,
      phone VARCHAR(64) NOT NULL,
      type VARCHAR(32) NOT NULL CHECK (type IN ('tuition', 'foundation')),
      status VARCHAR(32) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved')),
      fee_amount_cents INTEGER,
      fee_currency VARCHAR(8) DEFAULT 'INR',
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_admissions_lead_id ON admissions (lead_id)`,
  );
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_admissions_status ON admissions (status)`,
  );
}

function ensureTables(): Promise<void> {
  if (!tableReady) {
    tableReady = ensureCrmTables();
  }
  return tableReady;
}

export type LeadRow = {
  id: string;
  name: string;
  phone: string;
  type: "tuition" | "foundation" | "remedial";
  subjects: string | null;
  status: LeadStatus;
  flow_type: "tuition" | "remedial";
  assigned_to: string | null;
  assigned_mentor_id: string | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
};

export type DemoRow = {
  id: string;
  lead_id: string;
  demo_executive_id: string;
  status: "pending" | "completed";
  result: "interested" | "not_interested" | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
};

export type PipelineAdmissionRow = {
  id: string;
  lead_id: string;
  student_name: string;
  parent_name: string;
  phone: string;
  type: "tuition" | "foundation";
  status: "pending" | "approved";
  fee_amount_cents: number | null;
  fee_currency: string | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
};

export async function insertLead(input: {
  name: string;
  phone: string;
  type: "tuition" | "foundation" | "remedial";
  subjects?: string | null;
  assigned_to?: string | null;
  flow_type?: "tuition" | "remedial" | null;
  status?: LeadStatus | null;
  notes?: string | null;
}): Promise<{ id: string }> {
  await ensureTables();
  const pool = getPool();
  const res = await pool.query<{ id: string }>(
    `
    INSERT INTO leads (name, phone, type, subjects, assigned_to, flow_type, status, notes)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id
    `,
    [
      input.name.trim(),
      input.phone.trim(),
      input.type,
      input.subjects?.trim() || null,
      input.assigned_to?.trim() || null,
      normalizeLeadFlowType(input.flow_type),
      normalizeLeadStatus(input.status),
      input.notes?.trim() || null,
    ],
  );
  const id = res.rows[0]?.id;
  if (!id) throw new Error("insert lead failed");
  return { id };
}

export async function listLeads(): Promise<LeadRow[]> {
  await ensureTables();
  const pool = getPool();
  const res = await pool.query<LeadRow>(
    `SELECT id, name, phone, type, subjects, status, flow_type, assigned_to, assigned_mentor_id, notes, created_at, updated_at
     FROM leads ORDER BY created_at DESC`,
  );
  return res.rows;
}

export async function getLeadById(id: string): Promise<LeadRow | null> {
  await ensureTables();
  const pool = getPool();
  const res = await pool.query<LeadRow>(
    `SELECT id, name, phone, type, subjects, status, flow_type, assigned_to, assigned_mentor_id, notes, created_at, updated_at
     FROM leads WHERE id = $1`,
    [id],
  );
  return res.rows[0] ?? null;
}

export async function updateLeadStatus(
  id: string,
  status: LeadStatus,
): Promise<boolean> {
  await ensureTables();
  const pool = getPool();
  const r = await pool.query(
    `UPDATE leads SET status = $2, updated_at = NOW() WHERE id = $1`,
    [id, normalizeLeadStatus(status)],
  );
  return (r.rowCount ?? 0) > 0;
}

export async function assignLead(
  id: string,
  assigned_to: string | null,
): Promise<boolean> {
  await ensureTables();
  const pool = getPool();
  const r = await pool.query(
    `UPDATE leads SET assigned_to = $2, updated_at = NOW() WHERE id = $1`,
    [id, assigned_to?.trim() || null],
  );
  return (r.rowCount ?? 0) > 0;
}

export async function insertDemo(input: {
  lead_id: string;
  demo_executive_id: string;
}): Promise<{ id: string }> {
  await ensureTables();
  const pool = getPool();
  const res = await pool.query<{ id: string }>(
    `
    INSERT INTO demos (lead_id, demo_executive_id)
    VALUES ($1, $2)
    RETURNING id
    `,
    [input.lead_id, input.demo_executive_id.trim()],
  );
  const id = res.rows[0]?.id;
  if (!id) throw new Error("insert demo failed");
  await updateLeadStatus(input.lead_id, "demo_scheduled");
  return { id };
}

export async function getDemoById(id: string): Promise<DemoRow | null> {
  await ensureTables();
  const pool = getPool();
  const res = await pool.query<DemoRow>(
    `SELECT id, lead_id, demo_executive_id, status, result, notes, created_at, updated_at
     FROM demos WHERE id = $1`,
    [id],
  );
  return res.rows[0] ?? null;
}

export async function listDemosForExecutive(
  demoExecutiveId: string,
): Promise<DemoRow[]> {
  await ensureTables();
  const pool = getPool();
  const res = await pool.query<DemoRow>(
    `SELECT id, lead_id, demo_executive_id, status, result, notes, created_at, updated_at
     FROM demos WHERE demo_executive_id = $1 ORDER BY created_at DESC`,
    [demoExecutiveId],
  );
  return res.rows;
}

export async function completeDemo(
  id: string,
  input: {
    result: "interested" | "not_interested";
    notes?: string | null;
  },
): Promise<DemoRow | null> {
  await ensureTables();
  const pool = getPool();
  const res = await pool.query<DemoRow>(
    `
    UPDATE demos
    SET status = 'completed', result = $2, notes = $3, updated_at = NOW()
    WHERE id = $1 AND status = 'pending'
    RETURNING id, lead_id, demo_executive_id, status, result, notes, created_at, updated_at
    `,
    [id, input.result, input.notes?.trim() || null],
  );
  const row = res.rows[0];
  if (!row) return null;
  if (input.result === "interested") {
    await updateLeadStatus(row.lead_id, "demo_done");
  } else {
    await updateLeadStatus(row.lead_id, "closed_lost");
  }
  return row;
}

export async function insertPipelineAdmission(input: {
  lead_id: string;
  student_name: string;
  parent_name: string;
  phone: string;
  type: "tuition" | "foundation";
  fee_amount_cents?: number | null;
  fee_currency?: string | null;
  notes?: string | null;
}): Promise<{ id: string }> {
  await ensureTables();
  const pool = getPool();
  const res = await pool.query<{ id: string }>(
    `
    INSERT INTO admissions (
      lead_id, student_name, parent_name, phone, type,
      fee_amount_cents, fee_currency, notes
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id
    `,
    [
      input.lead_id,
      input.student_name.trim(),
      input.parent_name.trim(),
      input.phone.trim(),
      input.type,
      input.fee_amount_cents ?? null,
      input.fee_currency?.trim() || "INR",
      input.notes?.trim() || null,
    ],
  );
  const id = res.rows[0]?.id;
  if (!id) throw new Error("insert admission failed");
  await updateLeadStatus(input.lead_id, "admission");
  return { id };
}

export async function listPipelineAdmissions(): Promise<PipelineAdmissionRow[]> {
  await ensureTables();
  const pool = getPool();
  const res = await pool.query<PipelineAdmissionRow>(
    `SELECT id, lead_id, student_name, parent_name, phone, type, status,
            fee_amount_cents, fee_currency, notes, created_at, updated_at
     FROM admissions ORDER BY created_at DESC`,
  );
  return res.rows;
}

export async function getPipelineAdmissionById(
  id: string,
): Promise<PipelineAdmissionRow | null> {
  await ensureTables();
  const pool = getPool();
  const res = await pool.query<PipelineAdmissionRow>(
    `SELECT id, lead_id, student_name, parent_name, phone, type, status,
            fee_amount_cents, fee_currency, notes, created_at, updated_at
     FROM admissions WHERE id = $1`,
    [id],
  );
  return res.rows[0] ?? null;
}

export async function getLeadWithDemosById(id: string) {
  await ensureTables();
  return prisma.lead.findUnique({
    where: { id },
    include: {
      demos: {
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function approvePipelineAdmission(
  id: string,
): Promise<PipelineAdmissionRow | null> {
  await ensureTables();
  const pool = getPool();
  const res = await pool.query<PipelineAdmissionRow>(
    `
    UPDATE admissions
    SET status = 'approved', updated_at = NOW()
    WHERE id = $1 AND status = 'pending'
    RETURNING id, lead_id, student_name, parent_name, phone, type, status,
              fee_amount_cents, fee_currency, notes, created_at, updated_at
    `,
    [id],
  );
  return res.rows[0] ?? null;
}

export async function revertPipelineAdmissionToPending(
  id: string,
): Promise<void> {
  await ensureTables();
  const pool = getPool();
  await pool.query(
    `UPDATE admissions SET status = 'pending', updated_at = NOW() WHERE id = $1`,
    [id],
  );
}
