const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.pwrwustjaghywdzghkbh:125807abcD%40@aws-0-sa-east-1.pooler.supabase.com:5432/postgres'
});

async function main() {
  await client.connect();
  console.log('Connected');
  try {
    await client.query(`ALTER TABLE "public"."Service" ADD COLUMN "image_url" TEXT;`);
    console.log('Added image_url to Service');
  } catch (e) {
    console.error('Error on Service:', e.message);
  }
  
  try {
    await client.query(`ALTER TABLE "public"."services" ADD COLUMN "image_url" TEXT;`);
    console.log('Added image_url to services');
  } catch (e) {
    console.error('Error on services:', e.message);
  }
  
  // Reload schema cache for PostgREST
  try {
    await client.query(`NOTIFY pgrst, 'reload schema';`);
    console.log('Reloaded schema cache');
  } catch (e) {
    console.error('Error reloading schema:', e.message);
  }
  
  await client.end();
}
main();
