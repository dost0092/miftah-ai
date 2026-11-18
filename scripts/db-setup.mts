/**
 * Creates/updates the database schema and loads the official data library.
 *
 *   npm run db:setup              # uses DATABASE_URL, or POSTGRES_URL_NON_POOLING from .env*.local
 *   npm run db:setup -- --dry     # print what would be loaded, touch nothing
 *
 * Safe to run repeatedly: migrations are idempotent and seed rows are upserted by id.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";
import { officialSources } from "../src/lib/official/sources.ts";
import { knowledgeDocs } from "../src/lib/official/knowledge.ts";
import { districts, QUARTERS, DATA_UNTIL, IS_SAMPLE_DATA } from "../src/lib/districts.ts";
import { feeRules } from "../src/lib/fees.ts";

const dry = process.argv.includes("--dry");

function envFromFiles(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of [".env.local", ".env.production.local"]) {
    if (!existsSync(f)) continue;
    for (const line of readFileSync(f, "utf8").split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !out[m[1]]) out[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
    }
  }
  return out;
}

const fileEnv = envFromFiles();
const url = process.env.DATABASE_URL || fileEnv.DATABASE_URL || fileEnv.POSTGRES_URL_NON_POOLING || fileEnv.POSTGRES_URL;

const feeLabels: Record<string, string> = {
  rett: "Real Estate Transaction Tax (RETT)",
  brokerage: "Brokerage commission (default)",
  brokerageVat: "VAT on brokerage commission",
  disposal: "Non-Saudi transaction fee (rate set by REGA regulations)",
};
const feeSource: Record<string, string> = { rett: "zatca", brokerage: "rega", brokerageVat: "zatca", disposal: "rega" };

async function main() {
  const chunks = knowledgeDocs.reduce((n, d) => n + d.paragraphs.length, 0);
  console.log(`Library: ${officialSources.length} sources, ${knowledgeDocs.length} documents, ${chunks} chunks`);
  console.log(`Market: ${districts.length} districts × ${QUARTERS.length} quarters${IS_SAMPLE_DATA ? " (SAMPLE values)" : ""}`);
  if (dry) return;
  if (!url) throw new Error("No database URL. Set DATABASE_URL or run `vercel env pull .env.local`.");

  // Supabase's pooler presents a certificate chain Node does not trust by default.
  const client = new pg.Client({ connectionString: url.replace(/[?&]sslmode=[^&]*/, ""), ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    const dir = join("supabase", "migrations");
    for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
      process.stdout.write(`migration ${file} … `);
      await client.query(readFileSync(join(dir, file), "utf8"));
      console.log("ok");
    }

    await client.query("begin");

    for (const s of officialSources) {
      await client.query(
        `insert into official_sources (id, name, name_ar, publisher, url, kind, description, updated_at)
         values ($1,$2,$3,$4,$5,$6,$7, now())
         on conflict (id) do update set name=excluded.name, name_ar=excluded.name_ar, publisher=excluded.publisher,
           url=excluded.url, kind=excluded.kind, description=excluded.description, updated_at=now()`,
        [s.id, s.name, s.nameAr, s.publisher, s.url, s.kind, s.description],
      );
    }

    for (const d of knowledgeDocs) {
      await client.query(
        `insert into knowledge_documents (id, title, title_ar, category, source_id, url, effective, checked, status, summary, keywords, updated_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11, now())
         on conflict (id) do update set title=excluded.title, title_ar=excluded.title_ar, category=excluded.category,
           source_id=excluded.source_id, url=excluded.url, effective=excluded.effective, checked=excluded.checked,
           status=excluded.status, summary=excluded.summary, keywords=excluded.keywords, updated_at=now()`,
        [d.id, d.title, d.titleAr, d.category, d.sourceId, d.url, d.effective, d.checked, d.status, d.summary, d.keywords],
      );
      await client.query("delete from knowledge_chunks where document_id = $1", [d.id]);
      const context = [d.title, d.titleAr, ...d.keywords].join(" ");
      for (const [i, p] of d.paragraphs.entries()) {
        await client.query("insert into knowledge_chunks (document_id, ord, content, context) values ($1,$2,$3,$4)", [d.id, i, p, context]);
      }
    }
    // Remove documents that were deleted from the library file.
    await client.query("delete from knowledge_documents where not (id = any($1::text[]))", [knowledgeDocs.map((d) => d.id)]);

    for (const f of feeRules) {
      await client.query(
        `insert into fee_rules (id, label, rate, applies_to, source_id, url, status, updated_at)
         values ($1,$2,$3,$4,$5,$6,'needs_review', now())
         on conflict (id) do update set label=excluded.label, rate=excluded.rate, applies_to=excluded.applies_to,
           source_id=excluded.source_id, url=excluded.url, updated_at=now()`,
        [f.id, feeLabels[f.id] ?? f.id, f.rate, f.appliesTo, feeSource[f.id] ?? null, f.source],
      );
    }

    for (const d of districts) {
      const { rows } = await client.query(
        `insert into districts (slug, city, name_ar, name_en, lat, lng)
         values ($1,$2,$3,$4,$5,$6)
         on conflict (slug) do update set city=excluded.city, name_ar=excluded.name_ar, name_en=excluded.name_en, lat=excluded.lat, lng=excluded.lng
         returning id`,
        [d.slug, d.city, d.nameAr, d.nameEn, d.center[0], d.center[1]],
      );
      const id = rows[0].id as number;
      // Only replace sample statistics; never touch rows that came from the real pipeline.
      await client.query("delete from district_stats where district_id = $1 and is_sample", [id]);
      const insert = (quarter: string, type: string, median: number, deals: number) =>
        client.query(
          `insert into district_stats (district_id, quarter, property_type, n_deals, median_ppsqm, p25_ppsqm, p75_ppsqm, data_until, source, is_sample)
           values ($1,$2,$3,$4,$5,$6,$7,$8,'SAMPLE', true)
           on conflict (district_id, quarter, property_type) do nothing`,
          [id, quarter, type, deals, median, Math.round(median * 0.88), Math.round(median * 1.12), DATA_UNTIL],
        );
      for (const [i, q] of QUARTERS.entries()) await insert(q, "apartment", d.trend[i], Math.round(d.deals * 0.55));
      const last = QUARTERS[QUARTERS.length - 1];
      await insert(last, "villa", d.median.villa, Math.round(d.deals * 0.3));
      await insert(last, "land", d.median.land, Math.round(d.deals * 0.15));
    }

    await client.query("commit");
    const { rows } = await client.query("select (select count(*) from knowledge_chunks) chunks, (select count(*) from districts) districts, (select count(*) from district_stats) stats");
    console.log("Loaded:", rows[0]);
  } catch (e) {
    await client.query("rollback").catch(() => {});
    throw e;
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
