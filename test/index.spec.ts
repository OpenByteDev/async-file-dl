import { download } from '../lib';

import chai = require('chai');
import 'mocha';

import * as fs from 'fs';
import * as path from 'path';
const afs = fs.promises;

chai.should();

const deleteFolderRecursive = async path =>  {
    if (fs.existsSync(path)) {
        for (let entry of await afs.readdir(path)) {
            const curPath = path + "/" + entry;
            if ((await afs.lstat(curPath)).isDirectory())
                await deleteFolderRecursive(curPath);
            else await afs.unlink(curPath);
        }
        await afs.rmdir(path);
    }
};
const testDir = path.resolve('./test/download');
beforeEach(async () => {
    if (fs.existsSync(testDir))
        return;
    await afs.mkdir(testDir);
});
afterEach(() => deleteFolderRecursive(testDir));
describe('download', () => {
    it('should return a string promise', async () => {
        const promise = download('https://github.com/OpenByteDev/async-file-dl', 'test/download');
        promise.should.be.instanceof(Promise);
        const p = await promise;
        p.should.be.a('string');
    });
    it('should create a file in the specified directory and the specified name', async () => {
        await download({ url: 'http://example.com/' }, 'test/download', 'example.html');
        fs.existsSync(path.join(testDir, 'example.html')).should.be.true;
    });
    it('should return the filename of the created file', async () => {
        const p = await download({ url: 'http://example.com/' }, 'test/download', 'example.html');
        p.should.equal(path.join(testDir, 'example.html'));
    });
});
