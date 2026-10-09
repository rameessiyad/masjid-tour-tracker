import { pool, initSchema } from "../src/config/db.js";
import { SAMPLE_PARTICIPANTS } from "../src/utils/sampleParticipants.js";

// Removes ONLY rows whose name exactly matches a sample name.
// Real participants with other names are untouched. The 'seeded' flag stays,
// so `npm run seed` will not bring the samples back.
async function main() {
  await initSchema();
  const names = SAMPLE_PARTICIPANTS.map((p) => p.name);
  const { rowCount } = await pool.query("DELETE FROM participants WHERE name = ANY($1::text[])", [names]);
  await pool.query(
    `INSERT INTO app_meta (key, value) VALUES ('seeded', 'true')
     ON CONFLICT (key) DO UPDATE SET value = 'true'`
  );
  console.log(`Removed ${rowCount} sample participant(s).`);
}

main()
  .catch((err) => {
    console.error("Clear failed:", err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
