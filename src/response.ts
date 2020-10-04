import http from 'http';
import { Readable } from 'stream';
import Headers from './headers';
import { ResponseSymbol } from './types';

export default class Response {
	readonly headers: Headers;
	status: number;
	body?: string | Buffer | Readable | any;
	[ResponseSymbol]: http.ServerResponse;

	constructor(res: http.ServerResponse) {
		this.status = 200;
		this.headers = new Headers();
		this.body = undefined;
		this[ResponseSymbol] = res;
	}

	get ok(): boolean {
		return true;
	}

	send() {
		const res = this[ResponseSymbol];
		if (res.headersSent) return;

		res.statusCode = this.status;
		for (const [ name, value ] of this.headers) {
			res.setHeader(name, value);
		}
		if (Buffer.isBuffer(this.body) || typeof this.body === 'string') {
			if (!this.headers.has('content-type')) {
				res.setHeader('content-type', 'text/plain; charset=utf8');
			}
			res.end(this.body);
		} else if (this.body instanceof Readable) {
			this.body.pipe(res);
		} else if (typeof this.body !== 'undefined') {
			if (!this.headers.has('content-type')) {
				res.setHeader('content-type', 'application/json; charset=utf8');
			}
			res.end(JSON.stringify(this.body));
		} else {
			res.end();
		}
	}
}
