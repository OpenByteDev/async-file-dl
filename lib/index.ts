import axios from 'axios';
import filenamify = require('filenamify');
import fs = require('fs');
import path = require('path');
import u = require('url');
const afs = fs.promises;

export = async function download(url: string, directory: string= '.', file: string | null= null): Promise<string> {
    directory = path.resolve(directory);

    await afs.access(directory);

    const stat = await afs.lstat(directory);
    if (!stat.isDirectory())
        return Promise.reject(new TypeError('Invalid directory specified'));

    if (typeof file !== 'string') {
        const pathname = u.parse(url).pathname;
        if (typeof pathname !== 'undefined')
            file = path.basename(pathname) as string;
        else return Promise.reject(new TypeError('Unable to extract filename from url'));
    }

    file = filenamify(file);

    const response = await axios({
        method: 'GET',
        url,
        responseType: 'stream'
    });

    const p = path.join(directory, file);

    response.data.pipe(fs.createWriteStream(p));

    return new Promise((resolve, reject) => {
        response.data.on('end', () => resolve(p));
        response.data.on('error', () => reject());
    }) as Promise<string>;
};
