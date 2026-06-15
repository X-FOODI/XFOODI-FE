const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/globals.css');
if (fs.existsSync(filePath)) {
  const content = fs.readFileSync(filePath, 'utf8');
  console.log('Last 1000 chars of globals.css:');
  console.log(content.substring(content.length - 1000));
} else {
  console.log('globals.css not found');
}
