const fs = require('fs');
const p = 'c:/Users/Pc/Desktop/Medina/frontend/src/pages/CashDrawerPage.jsx';
const c = fs.readFileSync(p,'utf8');
console.log('bytes:'+ c.length);
