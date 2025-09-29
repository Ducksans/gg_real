const { mkdirSync, copyFileSync } = require('fs');
const { join } = require('path');

const src = join(__dirname, '..', 'src', 'ui', 'index.html');
const destDir = join(__dirname, '..', 'dist');
const dest = join(destDir, 'ui.html');

mkdirSync(destDir, { recursive: true });
copyFileSync(src, dest);

console.log(`Copied UI to ${dest}`);
