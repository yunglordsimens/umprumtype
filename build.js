const fs = require('fs');
const path = require('path');

function buildIndex(dir, output) {
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json') && f !== 'index.json');
  const items = files.map(f => {
    const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    data._slug = f.replace('.json', '');
    return data;
  });
  fs.writeFileSync(output, JSON.stringify(items, null, 2));
  console.log(`Built ${output} (${items.length} items)`);
}

// Build typefaces index — sorted by order
buildIndex('content/typefaces', 'content/typefaces/index.json');

// Build posts index — sorted by date (newest first)  
buildIndex('content/posts', 'content/posts/index.json');

console.log('Build complete');
