'use strict';

export default class AskNicelyInputError extends Error {
	constructor(message, solution) {
		super(message);

		this.name = this.constructor.name;
		this.solution = solution;

		// A workaround to make `instanceof AskNicelyInputError` work in ES5 after babel transform
		this.constructor = AskNicelyInputError;
		this.__proto__ = AskNicelyInputError.prototype;
	}
}
