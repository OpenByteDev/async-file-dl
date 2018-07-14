import axios, { AxiosRequestConfig } from 'axios';
import filenamify = require('filenamify');
import fs = require('fs');
import path = require('path');
import { Readable } from "stream";
import trim = require("trim-character");
import u = require('url');
const afs = fs.promises;

export interface AxiosRequestConfigWithUrl extends AxiosRequestConfig {
    url: string;
};
export let defaultConfig: AxiosRequestConfig = {
    method: 'get'
};
export async function download(urlOrConfig: string | AxiosRequestConfigWithUrl, directory: string= '.', file: string | null= null): Promise<string> {
    directory = path.resolve(directory);
    await afs.access(directory);
    const stat = await afs.lstat(directory);
    if (!stat.isDirectory())
        return Promise.reject(new TypeError('Invalid directory specified'));

    const config = Object.assign(defaultConfig,
        typeof urlOrConfig === 'string' ? { url: urlOrConfig } : urlOrConfig,
        { responseType: 'stream' });
    const url = (config.baseURL || '') + config.url;

    if (typeof file !== 'string') {
        let pathname = u.parse(url).pathname;
        if (typeof pathname !== 'undefined') {
            let basename = trim(path.basename(pathname).trim(), '/');
            if (basename !== '')
                file = path.basename(pathname as string);
            else return Promise.reject(new TypeError('Unable to extract filename from url'));
        }
        else return Promise.reject(new TypeError('Unable to extract filename from url'));
    }
    file = filenamify(file);

    const response = await axios(config);

    const p = path.join(directory, file);

    const dataStream = response.data as Readable;
    const fileStream = fs.createWriteStream(p);
    dataStream.pipe(fileStream);

    return new Promise((resolve, reject) => {
        dataStream.on('end', () => resolve(p));
        dataStream.on('error', e => reject(e));
        fileStream.on('error', e => reject(e));
    }) as Promise<string>;
};
