import Request from './request';
import Response from './response';
import Headers from './headers';

export type FetchHandler = (
	req: Request,
	res: Response
) => any | Promise<any>;

export const RequestSymbol = Symbol('RequestSymbol');
export const ResponseSymbol = Symbol('ResponseSymbol');

export type HeaderPair = [string, string];

export type HeadersInit =
	| Headers
	| { [name: string]: string | string[] }
	| Iterable<HeaderPair>
	| Iterable<Iterable<string>>;
