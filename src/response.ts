import http from 'http';
import { Readable } from 'stream';
import Headers from './headers';
import { ResponseSymbol } from './types';

export default class Response {
	readonly headers: Headers;
	status: number;
	finished: boolean;
	body?: string | Buffer | Readable;
	[ResponseSymbol]: http.ServerResponse;

	constructor(res: http.ServerResponse) {
		this.status = 200;
		this.headers = new Headers();
		this.body = undefined;
		this.finished = false;
		this[ResponseSymbol] = res;
	}

	get ok(): boolean {
		return true;
	}

	flush() {
		const res = this[ResponseSymbol];
		res.statusCode = this.status;
		for (const [ name, value ] of this.headers) {
			res.setHeader(name, value);
		}
		if (Buffer.isBuffer(this.body) || typeof this.body === 'string') {
			res.end(this.body);
		}
		this.finished = true;
	}
}
