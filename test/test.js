const { download } = require('../dist/index');
const fs = require('fs').promises;

Promise.all([
    download('https://github.com/OpenByteDev/async-file-dl'),
    download({ url: 'http://example.com/' }, '.', 'example.html')
]).then(files => Promise.all(
    files.map(file => {
        console.log(file);
        return fs.unlink(file);
    })
)).catch(e => {
    console.error(e);
    process.exit(1);
});