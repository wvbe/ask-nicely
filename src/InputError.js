'use strict';

export default class AskNicelyInputError extends Error {
	constructor(message, solution) {
		super(message);

		this.name = this.constructor.name;
		this.solution = solution;
	}
}
