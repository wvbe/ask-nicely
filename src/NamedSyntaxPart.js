'use strict';

import symbols from './symbols';

export default class NamedSyntaxPart {
	/**
	 * @param {string} name
	 */
	constructor(name) {
		this.name = name;
		this.description = null;
	}

	/**
	 * Signals the parser that an input part matches this NamedSyntaxPart definition.
	 * @param part
	 * @return {boolean}
	 */
	[symbols.isMatchForPart](part) {
		throw new Error('Not implemented.');
	}

	/**
	 * Describes how the value should be temporarily stored together with it's defining NamedSyntaxPart
	 * @param {NamedSyntaxPart} resolvedInputSpecs
	 * @param {*} inputValue
	 * @return {Array}
	 */
	[symbols.updateInputSpecsAfterMatch](resolvedInputSpecs, inputValue) {
		resolvedInputSpecs.push({
			syntax: this,
			input: inputValue
		});
		return resolvedInputSpecs;
	}

	/**
	 * Describes how to extract an input value from input parts. Is expected to mutate `parts`, and return (a temporary)
	 * input value.
	 * @param parts
	 * @return {*}
	 */
	[symbols.spliceInputFromParts](parts) {
		throw new Error('Not implemented.');
	}

	/**
	 * Describes how a temporarily stored input value (from `spliceInputFromParts`) is written to the Request object.
	 * Is not expected to return anything.
	 * @param {Request} request
	 * @param {*} input
	 */
	[symbols.createContributionToRequestObject](accumulated, input) {
		throw new Error('Not implemented.');
	}

	[symbols.applyDefault](value, isUndefined) {
		return value;
	}

	/**
	 * Validates input before it is resolved. Expected to throw an error if something is awry, return undefined
	 * otherwise.
	 * @param input
	 * @return {boolean}
	 */
	[symbols.validateInput](input) {}

	/**
	 * Explains to the system which type of syntax it is, eg. what other syntax parts it may compete with
	 */
	'getType'() {
		throw new Error('Not implemented.');
	}

	/**
	 * Validates a value after it is resolved. Expected to throw an error if something is awry, return undefined
	 * otherwise.
	 * @param input
	 */
	'validateValue'(value) {}

	/**
	 * Returns the new scope of NamedSyntaxParts to parse through after this is parsed.
	 * @param {Array} tiers
	 * @return {Array}
	 */
	[symbols.updateTiersAfterMatch](tiers) {
		throw new Error('Not implemented.');
	}

	/**
	 * Stored a descriptive string for the NamedSyntaxPart definition, or whatever it is to the end-user
	 * @param {string} description
	 * @return {NamedSyntaxPart}
	 */
	'setDescription'(description) {
		this.description = description;
		return this;
	}
}
