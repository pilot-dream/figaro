import fetch from 'node-fetch';
import { PrismaClient } from '@prisma/client';
async function test() {
  const res = await fetch('http://localhost:3001/api/gamification/config', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer NOT_A_TOKEN' },
    body: JSON.stringify({ enableBirthdays: true })
  });
  console.log(res.status, await res.text());
}
test();
