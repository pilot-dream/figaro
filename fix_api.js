const fs = require('fs');
const path = 'client/src/lib/api.ts';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes('export const API_URL')) {
  code = code.replace(
    'export { supabase }', 
    'export { supabase }\n\nexport const API_URL = import.meta.env.PROD ? "/api" : (import.meta.env.VITE_API_URL || "http://localhost:3001/api");'
  );
}

code = code.replace(/\s*const API_URL = import\.meta\.env\.VITE_API_URL \|\| 'http:\/\/localhost:3001\/api'/g, '');
code = code.replace(/\s*const API_URL = import\.meta\.env\.VITE_API_URL \|\| 'http:\/\/localhost:3001'/g, '');

code = code.replace(/\$\{API_URL\}\/api\/team/g, '${API_URL}/team');

fs.writeFileSync(path, code);
console.log('Fixed api.ts');
