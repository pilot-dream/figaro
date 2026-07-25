const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:125807abcD%40@db.pwrwustjaghywdzghkbh.supabase.co:5432/postgres'
});

client.connect()
  .then(() => {
    console.log('Connected successfully!');
    client.end();
  })
  .catch(err => {
    console.error('Connection error:', err.message);
    client.end();
  });
