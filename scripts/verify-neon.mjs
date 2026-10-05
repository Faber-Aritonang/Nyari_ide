import pg from 'pg';
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
const checks = [
  ['"user"', 3], ['account', 0], ['allowed_emails', 5], ['conversations', 27],
  ['messages', 227], ['custom_instructions', 1], ['share_links', 0],
  ['saved_prompts', 0], ['documents', 18], ['document_chunks', 915], ['embeddings', 915],
];
for (const [t, exp] of checks) {
  const { rows } = await pool.query(`SELECT count(*)::int n FROM ${t}`);
  const mark = exp > 0 ? (rows[0].n === exp ? 'OK' : 'MISMATCH') : 'INFO';
  console.log(`${mark.padEnd(8)} ${t}: ${rows[0].n} (harap ${exp})`);
}
// cek FK integrity
const orphans = await pool.query(`SELECT count(*)::int n FROM conversations c LEFT JOIN "user" u ON u.id=c.user_id WHERE u.id IS NULL`);
console.log('orphan conversations.user_id:', orphans.rows[0].n);
const dim = await pool.query(`SELECT vector_dims(embedding) d FROM embeddings LIMIT 1`);
console.log('embedding dims:', dim.rows[0]?.d);
const uid = (await pool.query('SELECT user_id FROM embeddings LIMIT 1')).rows[0]?.user_id;
const fn = await pool.query('SELECT * FROM search_embeddings(array_fill(0.0::real, ARRAY[1536])::vector, 3, -1.0, $1)', [uid]);
console.log(`search_embeddings(user=${uid}):`, fn.rows.length, 'rows;', fn.rows[0] ? 'cols=' + Object.keys(fn.rows[0]).join(',') : 'none');
await pool.end();
