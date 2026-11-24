// Deja en index.html el HTML en ingles (para quien no tiene JavaScript) a partir de data/progreso.json.
// Uso: node tools/prerender.js   (correrlo despues de agregar un Day al JSON)
const fs = require('fs');
const WZ = require('../js/app.js');
const data = JSON.parse(fs.readFileSync(__dirname + '/../data/progreso.json', 'utf8'));
let html = fs.readFileSync(__dirname + '/../index.html', 'utf8');
for (const [name, view] of Object.entries(WZ.views)) {
  const re = new RegExp('<!--wz:' + name + '-->[\s\S]*?<!--/wz:' + name + '-->');
  if (!re.test(html)) throw new Error('falta marcador ' + name);
  html = html.replace(re, () => '<!--wz:' + name + '-->' + view(data, 'en') + '<!--/wz:' + name + '-->');
}
fs.writeFileSync(__dirname + '/../index.html', html);
console.log('ok');
