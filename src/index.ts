import http from 'http';
import https from 'https';
import Request from './request';
import Response from './response';
import { FetchHandler } from './types';

export * from './types';
export { Request, Response };

export default function createFetchServer(fn: FetchHandler) {
	function handler(req: http.IncomingMessage, res: http.ServerResponse) {
		const request = new Request(req);
		const response = new Response(res)
		Promise.resolve()
			.then(() => fn(request, response))
			.then(() => {
				if (!res.headersSent) {
					return response.send();
				}
			})
			.catch((err) => {
				console.error(err);
				if (!res.headersSent) {
					res.statusCode = 500;
					res.end('Internal server error\n');
				}
			});
	}

	return handler;
}
