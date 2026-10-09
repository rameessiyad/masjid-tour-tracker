import { pool, initSchema } from "../src/config/db.js";

// Real participant list: names only, nobody has paid yet (amount_paid = 0).
// Names are kept exactly as typed. Two names appear twice (സലീന, അൻസി) - they are
// treated as different people, so all 96 entries are inserted.
const NAMES = [
  "നൗഷാദ് ഉസ്താദ്",
  "മുഹമ്മദ്‌ ബിലാൽ",
  "മുഹമ്മദ്‌ യാസീൻ",
  "മുഹമ്മദ്‌ മുബാറക്",
  "ജംഷീർ റഹ്മാൻ",
  "അജാസ്",
  "ഹലീമ",
  "അജ്നാസ്",
  "ആയിഷ ഷിനാസ്",
  "ഫർഹാൻ",
  "ഹന",
  "അനീഷ",
  "സിയാദ്",
  "സുഹാന",
  "അഹ്സാൻ ലബീബ്",
  "അൻസാരി",
  "അഫ്നാൻ",
  "നസിയ",
  "നിസാർ",
  "റാഫിയാ",
  "ആബിദ്",
  "ഷെമീർ",
  "ജിബി",
  "സൗദ",
  "അൻഷാദ്",
  "ആമിന",
  "അൻസി",
  "നബീസ",
  "മിൻഹാ",
  "അസ്മാ",
  "റിസ്വാൻ",
  "ആയിഷ റിസ",
  "ഷുക്കൂർ",
  "സുഹൈല",
  "അഷ്ഫാക്ക്",
  "നസീമ",
  "ജമാൽ",
  "മോളി",
  "കുഞ്ഞി",
  "ആദം",
  "സലീന",
  "ഷെറീന",
  "ശിഹാബ്",
  "സീന",
  "അസ്ന",
  "അജ്മി",
  "അനീഷ്",
  "സജ്ന",
  "കുഞ്ഞമ്മ",
  "അർഷദ്",
  "സുൽഫി",
  "ഇർഫാൻ",
  "ഇഹ്‌സാൻ",
  "അമി",
  "ആസാദ്‌",
  "ഷീബ",
  "ഫൈസൽ",
  "നൗഫത്",
  "ഷാജഹാൻ",
  "സലീന",
  "ഹാറൂൻ",
  "ആഷിഖ് അഹമ്മദ്",
  "താഹിന",
  "അനസ്",
  "ജാബിർ റഹ്മാൻ",
  "ഫൈസൽ മകൾ",
  "ഷാനി",
  "ഷാനവാസ്",
  "ഷിഹാബ്",
  "ആസിഫ് താഹിന മോൻ",
  "ശാമില അഹമ്മദ്",
  "താഹിറ",
  "ഫത്താഹ്",
  "റസിയ",
  "ബെഷീർ",
  "നെസി",
  "സഫിയ",
  "റംല",
  "സൽമ",
  "സക്കീന",
  "ഫാസിൽ",
  "ഷിബു",
  "അൻസി",
  "ഹുസൈൻ",
  "ഹുസ്ന",
  "ഹന്ന",
  "ജെസ്‌ന",
  "റിയാസ്",
  "റൈഹാന",
  "സുലൈഹ",
  "ആസിയ",
  "ആദില",
  "ബഷീർ",
  "ഫാരിസ",
  "ജങ്കർ ഖാൻ",
  "നിസ",
];

// Seeds once. A flag row in app_meta stops a second run from duplicating the list.
// To insert the list again on purpose: npm run seed -- --force
const FLAG = "participants_list_seeded";
const force = process.argv.includes("--force");

async function main() {
  await initSchema();
  const names = NAMES.map((n) => n.trim().replace(/\s+/g, " ")).filter(Boolean);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(727001)"); // serialise concurrent runs
    const { rows } = await client.query(
      "SELECT 1 FROM app_meta WHERE key = $1",
      [FLAG],
    );
    if (rows.length && !force) {
      await client.query("ROLLBACK");
      console.log(
        "Already seeded - nothing to do. (Use --force to insert the list again.)",
      );
      return;
    }
    await client.query(
      `INSERT INTO participants (name, amount_paid)
       SELECT n, 0 FROM unnest($1::text[]) WITH ORDINALITY AS t(n, ord) ORDER BY ord`,
      [names],
    );
    await client.query(
      `INSERT INTO app_meta (key, value) VALUES ($1, 'true')
       ON CONFLICT (key) DO UPDATE SET value = 'true'`,
      [FLAG],
    );
    await client.query("COMMIT");
    console.log(`Seeded ${names.length} participants (amount paid = 0).`);
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

main()
  .catch((err) => {
    console.error("Seed failed:", err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
