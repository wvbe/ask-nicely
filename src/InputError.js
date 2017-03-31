'use strict';

class AskNicelyInputError extends Error {
	constructor(message, solution) {
		super(message);

		this.name = this.constructor.name;
		this.solution = solution;
	}
}

module.exports = AskNicelyInputError;
