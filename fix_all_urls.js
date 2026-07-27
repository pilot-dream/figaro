const fs = require('fs');
const glob = require('glob');

const files = [
  'client/src/stores/branch.store.ts',
  'client/src/stores/auth.store.ts',
  'client/src/components/dashboard/tabs/settings/TeamSettings.tsx',
  'client/src/components/dashboard/tabs/TabBooking.tsx',
  'client/src/components/dashboard/tabs/TabSettings.tsx',
  'client/src/components/dashboard/tabs/TabFinancial.tsx'
];

for (const path of files) {
  if (fs.existsSync(path)) {
    let code = fs.readFileSync(path, 'utf8');
    
    code = code.replace(/const API_URL = import\.meta\.env\.VITE_API_URL \|\| 'http:\/\/localhost:3001\/api'/g, 'const API_URL = import.meta.env.PROD ? "/api" : (import.meta.env.VITE_API_URL || "http://localhost:3001/api")');
    code = code.replace(/const API_URL = import\.meta\.env\.VITE_API_URL \|\| 'http:\/\/localhost:3001'/g, 'const API_URL = import.meta.env.PROD ? "" : (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace("/api", "") : "http://localhost:3001")');
    
    fs.writeFileSync(path, code);
    console.log('Fixed ' + path);
  }
}
