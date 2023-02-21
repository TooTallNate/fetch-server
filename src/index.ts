import http from 'node:http';
import { Readable } from 'node:stream';

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
					// @ts-ignore
					Readable.fromWeb(response.body).pipe(res);
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
