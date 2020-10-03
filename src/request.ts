import http from 'http';
import { URL } from 'url';
import Headers, { fromRawHeaders } from './headers';
import { RequestSymbol } from './types';

export default class Request {
	readonly method: string;
	readonly url: URL;
	readonly headers: Headers;
	readonly [RequestSymbol]: http.IncomingMessage;

	constructor(req: http.IncomingMessage) {
		this[RequestSymbol] = req;
		const proto = req.headers['x-forwarded-proto'] || 'http';
		const host =
			req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
		this.url = new URL(req.url || '/', `${proto}://${host}`);
		this.method = req.method || 'GET';
		this.headers = fromRawHeaders(req.rawHeaders);
	}

	async buffer(): Promise<Buffer> {
		let bytes = 0;
		const req = this[RequestSymbol];
		const buffers: Buffer[] = [];
		return new Promise((resolve, reject) => {
			let data = '';
			req.on('data', (b) => { buffers.push(b); bytes += b.length });
			req.once('error', reject);
			req.once('end', () => {
				resolve(Buffer.concat(buffers, bytes));
			});
		});
	}

	async text(encoding: BufferEncoding = 'utf8'): Promise<string> {
		const body = await this.buffer();
		return body.toString(encoding);
	}

	async json(encoding: BufferEncoding = 'utf8'): Promise<unknown> {
		const text = await this.text();
		if (text) {
			return JSON.parse(text);
		}
	}
}
