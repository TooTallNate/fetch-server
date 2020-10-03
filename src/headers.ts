/**
 * Headers.js
 *
 * Headers class offers convenient helpers
 */

import http from 'http';
import { types } from 'util';
import { isIterable } from './util';
import { HeaderPair, HeadersInit } from './types';
import { URLSearchParams } from 'url';

const validateHeaderName =
	//typeof http.validateHeaderName === 'function'
	//	? http.validateHeaderName
	//	: (name) => {
	(name: string) => {
		if (!/^[\^`\-\w!#$%&'*+.|~]+$/.test(name)) {
			const err = new TypeError(
				`Header name must be a valid HTTP token [${name}]`
			);
			Object.defineProperty(err, 'code', {
				value: 'ERR_INVALID_HTTP_TOKEN',
			});
			throw err;
		}
	};

const validateHeaderValue =
	//typeof http.validateHeaderValue === 'function'
	//	? http.validateHeaderValue
	//	: (name, value) => {
	(name: string, value: string) => {
		if (/[^\t\u0020-\u007E\u0080-\u00FF]/.test(value)) {
			const err = new TypeError(
				`Invalid character in header content ["${name}"]`
			);
			Object.defineProperty(err, 'code', {
				value: 'ERR_INVALID_CHAR',
			});
			throw err;
		}
	};

/**
 * This Fetch API interface allows you to perform various actions on HTTP request and response headers.
 * These actions include retrieving, setting, adding to, and removing.
 * A Headers object has an associated header list, which is initially empty and consists of zero or more name and value pairs.
 * You can add to this using methods like append() (see Examples.)
 * In all methods of this interface, header names are matched by case-insensitive byte sequence.
 */
export default class Headers extends URLSearchParams {
	constructor(init?: HeadersInit) {
		// Validate and normalize init object in [name, value(s)][]
		let result: [string, string][] = [];
		if (init instanceof Headers) {
			const raw = init.raw();
			for (const [name, values] of Object.entries(raw)) {
				for (const value of values) {
					result.push([name, value]);
				}
			}
		} else if (init == null) {
			// eslint-disable-line no-eq-null, eqeqeq
			// No op
		} else if (typeof init === 'object' && !types.isBoxedPrimitive(init)) {
			if (isIterable<HeaderPair>(init)) {
				// Sequence<sequence<ByteString>>
				// Note: per spec we have to first exhaust the lists then process them
				result = [...init].map((pair) => {
					if (
						typeof pair !== 'object' ||
						types.isBoxedPrimitive(pair)
					) {
						throw new TypeError(
							'Each header pair must be an iterable object'
						);
					}

					const p = [...pair];
					if (p.length !== 2) {
						throw new TypeError(
							'Each header pair must be a name/value tuple'
						);
					}
					return [p[0], p[1]];
				});
			} else {
				// Record<ByteString, ByteString>
				for (const [name, value] of Object.entries(init)) {
					if (typeof value === 'string') {
						result.push([name, value]);
					} else {
						for (const v of value) {
							result.push([name, v]);
						}
					}
				}
			}
		} else {
			throw new TypeError(
				"Failed to construct 'Headers': The provided value is not of type '(sequence<sequence<ByteString>> or record<ByteString, ByteString>)"
			);
		}

		// Validate and lowercase
		result = result.map(([name, value]) => {
			validateHeaderName(name);
			validateHeaderValue(name, String(value));
			return [String(name).toLowerCase(), String(value)];
		});

		super(result);
	}

	append(name: string, value: string) {
		validateHeaderName(name);
		validateHeaderValue(name, String(value));
		return super.append(String(name).toLowerCase(), String(value));
	}

	set(name: string, value: string) {
		validateHeaderName(name);
		validateHeaderValue(name, String(value));
		return super.set(String(name).toLowerCase(), String(value));
	}

	delete(name: string) {
		validateHeaderName(name);
		return super.delete(String(name).toLowerCase());
	}

	has(name: string) {
		validateHeaderName(name);
		return super.has(String(name).toLowerCase());
	}

	getAll(name: string) {
		validateHeaderName(name);
		return super.getAll(String(name).toLowerCase());
	}

	get [Symbol.toStringTag]() {
		return this.constructor.name;
	}

	toString() {
		return Object.prototype.toString.call(this);
	}

	get(name: string): string | null {
		const values = this.getAll(name);
		if (values.length === 0) {
			return null;
		}

		let value = values.join(', ');
		if (/^content-encoding$/i.test(name)) {
			value = value.toLowerCase();
		}

		return value;
	}

	forEach(
		callback: (value: string, name: string, searchParams: this) => void
	) {
		for (const name of this.keys()) {
			const value = this.get(name) || '';
			callback(value, name, this);
		}
	}

	keys(): IterableIterator<string> {
		this.sort();
		return new Set(super.keys()).keys();
	}

	*values(): IterableIterator<string> {
		for (const name of this.keys()) {
			const value = this.get(name) || '';
			yield value;
		}
	}

	*entries(): IterableIterator<[string, string]> {
		for (const name of this.keys()) {
			const value = this.get(name) || '';
			yield [name, value];
		}
	}

	[Symbol.iterator]() {
		return this.entries();
	}

	/**
	 * Node-fetch non-spec method
	 * returning all headers and their values as array
	 */
	raw(): { [name: string]: string[] } {
		return [...this.keys()].reduce((result, key) => {
			result[key] = this.getAll(key);
			return result;
		}, {} as { [name: string]: string[] });
	}
}

/**
 * Re-shaping object for Web IDL tests
 * Only need to do it for overridden methods
 */
/*
Object.defineProperties(
	Headers.prototype,
	['get', 'entries', 'forEach', 'values'].reduce((result, property) => {
		result[property] = { enumerable: true };
		return result;
	}, {})
);
*/

/**
 * Create a Headers object from an http.IncomingMessage.rawHeaders,
 * ignoring those that do not conform to HTTP grammar productions.
 */
export function fromRawHeaders(
	headers: http.IncomingMessage['rawHeaders'] = []
) {
	const init = headers
		// Split into pairs
		.reduce((result, value, index) => {
			if (index % 2 === 0) {
				const s = headers.slice(index, index + 2);
				result.push(s);
			}
			return result;
		}, [] as string[][])
		.filter(([name, value]) => {
			try {
				validateHeaderName(name);
				validateHeaderValue(name, String(value));
				return true;
			} catch {
				return false;
			}
		});
	return new Headers(init);
}
