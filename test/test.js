const download = require('../dist/index');
const fs = require('fs').promises;

download('https://github.com/OpenByteDev/async-file-dl').then(file => fs.unlink(file)).catch(() => process.exit(1));