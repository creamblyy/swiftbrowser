const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const text = fs.readFileSync(path.join(root, 'legal', 'EULA.txt'), 'utf8');
const escaped = text
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

const html = [
  '<!DOCTYPE html>',
  '<html lang="ru">',
  '<head>',
  '<meta charset="utf-8">',
  '<title>EULA — Swift Browser</title>',
  '<style>',
  "html, body { margin: 0; padding: 0; background: #fff; color: #111; }",
  "body { font-family: 'Segoe UI', Tahoma, sans-serif; font-size: 12px; line-height: 1.45; }",
  'pre { white-space: pre-wrap; word-wrap: break-word; margin: 12px; font-family: inherit; }',
  '</style>',
  '</head>',
  '<body>',
  '<pre>' + escaped + '</pre>',
  '</body>',
  '</html>',
  '',
].join('\n');

const out = path.join(root, 'legal', 'EULA.html');
const bom = Buffer.from([0xef, 0xbb, 0xbf]);
fs.writeFileSync(out, Buffer.concat([bom, Buffer.from(html, 'utf8')]));
console.log('Wrote', out);
