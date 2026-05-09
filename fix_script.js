const fs = require('fs');
const path = './components/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(
  /<\/div>\n\s+<\/div>\n\s+<\/div>\n\s+{activeTab === 'connections' && renderTable\(/,
  "</div>\n                      </div>\n                   </div>\n                )}\n\n              {activeTab === 'connections' && renderTable("
);
fs.writeFileSync(path, content);
console.log('Fixed!');
