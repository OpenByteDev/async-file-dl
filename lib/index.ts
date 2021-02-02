import axios, { AxiosRequestConfig } from 'axios';
import filenamify = require('filenamify');
import fs = require('fs');
import path = require('path');
import { Readable } from 'stream';
import trim = require('trim-character');
const afs = fs.promises;

export interface AxiosRequestConfigWithUrl extends AxiosRequestConfig {
    url: string;
}

export let defaultConfig: AxiosRequestConfig = {
    method: 'get'
};

async function isDirectory(directory: string): Promise<boolean> {
    await afs.access(directory);
    const stat = await afs.lstat(directory);
    return stat.isDirectory();
}

function getFilename(file: string | null, url: string): string | null {
    if (typeof file !== 'string') {
        file = getFilenameFromUrl(url);
        if (file === null)
            return null;
    }
    return filenamify(file);
}

function getFilenameFromUrl(url: string): string | null {
    const pathname = new URL(url).pathname;
    if (typeof pathname !== 'undefined') {
        const basename = trim(path.basename(pathname).trim(), '/');
        if (basename !== '')
            return path.basename(pathname as string);
    }
    return null;
}

export async function download(
    url: string,
    directory?: string,
    file?: string | null): Promise<string>;
export async function download(
    config: AxiosRequestConfigWithUrl,
    directory?: string,
    file?: string | null): Promise<string>;
export async function download(
    urlOrConfig: string | AxiosRequestConfigWithUrl,
    directory: string= '.',
    file: string | null= null): Promise<string> {
    directory = path.resolve(directory);
    if (!(await isDirectory(directory)))
        throw new TypeError('Invalid directory specified');

    const config = {...defaultConfig,
                    ...(typeof urlOrConfig === 'string' ? { url: urlOrConfig } : urlOrConfig),
                    responseType: 'stream'};
    const url = (config.baseURL || '') + config.url;
    file = getFilename(file, url);
    if (file === null)
        throw new TypeError('Unable to get file');

    const response = await axios(config as any);

    const p = path.join(directory, file);

    const dataStream = response.data as Readable;
    const fileStream = fs.createWriteStream(p);
    dataStream.pipe(fileStream);

    return new Promise((resolve, reject) => {
        dataStream.on('end', () => resolve(p));
        dataStream.on('error', e => reject(e));
        fileStream.on('error', e => reject(e));
    }) as Promise<string>;
}
