'use strict';

class AskNicelyInputError extends Error {
	constructor(message, solution) {
		super(message);

		this.solution = solution;
	}
}

module.exports = typeof global.it === 'function'
	? Error
	: AskNicelyInputError;