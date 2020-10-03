export function isIterable<T>(obj: any): obj is Iterable<T> {
	// checks for null and undefined
	if (obj == null) {
		return false;
	}
	return typeof obj[Symbol.iterator] === 'function';
}
