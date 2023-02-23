import http from 'node:http';
import { Readable, Writable } from 'node:stream';

export type Handler = (request: Request) => Response | Promise<Response>;

export default function createFetchServer(handler: Handler) {
	return (req: http.IncomingMessage, res: http.ServerResponse) => {
		const method = req.method || 'GET';
		const headers = new Headers();
		for (const [key, value] of Object.entries(req.headers)) {
			if (Array.isArray(value)) {
				for (const v of value) {
					headers.append(key, v);
				}
			} else if (typeof value === 'string') {
				headers.set(key, value);
			}
		}

		// TODO: determine `https`
		const proto = headers.get('x-forwarded-proto') || 'http';
		const host = headers.get('x-forwarded-host') || headers.get('host');

		const base = `${proto}://${host}`;
		const url = new URL(req.url || '/', base);
		const request = new Request(url.href, {
			method,
			headers,
			// @ts-ignore
			body:
				method === 'GET' || method === 'HEAD'
					? undefined
					: Readable.toWeb(req),
		});

		Promise.resolve()
			.then(() => handler(request))
			.then((response) => {
				res.statusCode = response.status;
				res.statusMessage = response.statusText;
				response.headers.forEach((value, key) => {
					res.setHeader(key, value);
				});
				if (response.body) {
					return writeReadableStreamToWritable(response.body, res);
				} else {
					res.end();
				}
			})
			.catch((err) => {
				console.error(err);
				if (!res.headersSent) {
					res.statusCode = 500;
					res.end('Internal server error\n');
				}
			});
	};
}

async function writeReadableStreamToWritable(
	stream: ReadableStream,
	writable: Writable
) {
	let reader = stream.getReader();

	async function read() {
		let { done, value } = await reader.read();

		if (done) {
			writable.end();
			return;
		}

		writable.write(value);

		// If the stream is flushable, flush it to allow streaming to continue.
		let flushable = writable as { flush?: Function };
		if (typeof flushable.flush === 'function') {
			flushable.flush();
		}

		await read();
	}

	try {
		await read();
	} catch (error: any) {
		writable.destroy(error);
		throw error;
	}
}
