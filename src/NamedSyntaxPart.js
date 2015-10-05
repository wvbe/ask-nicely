'use strict';

class NamedSyntaxPart {
	/**
	 * @param {String} name
	 */
	constructor (name) {
		this.name = name;
	}

	/**
	 * Signals the parser that an input part matches this NamedSyntaxPart definition.
	 * @param part
	 * @returns {Boolean}
	 */
	match (part) {
		throw new Error('Not implemented.');
	}

	/**
	 * Describes how the value should be temporarily stored together with it's defining NamedSyntaxPart
	 * @param {NamedSyntaxPart} resolvedInputSpecs
	 * @param {*} inputValue
	 * @returns {Array}
	 */
	updateInputSpecsAfterMatch (resolvedInputSpecs, inputValue) {
		resolvedInputSpecs.push([this, inputValue]);
		return resolvedInputSpecs;
	}

	/**
	 * Describes how to extract an input value from input parts. Is expected to mutate `parts`, and return (a temporary)
	 * input value.
	 * @param parts
	 * @returns {*}
	 */
	spliceInputFromParts (parts) {
		throw new Error('Not implemented.');
	}

	/**
	 * Describes how a temporarily stored input value (from `spliceInputFromParts`) is written to the Request object.
	 * Is not expected to return anything.
	 * @param {Request} request
	 * @param {*} input
	 */
	exportWithInput (request, input) {
		throw new Error('Not implemented.');
	}

	/**
	 * Validates input before it is resolved. Expected to throw an error if something is awry, return undefined
	 * otherwise.
	 * @param input
	 * @returns {boolean}
	 */
	validateInput (input) {

	}

	/**
	 * Validates a value after it is resolved. Expected to throw an error if something is awry, return undefined
	 * otherwise.
	 * @param input
	 */
	validateValue (input) {

	}

	/**
	 * Returns the new scope of NamedSyntaxParts to parse through after this is parsed.
	 * @param {Array} tiers
	 * @returns {Array}
	 */
	updateTiersAfterMatch (tiers) {
		throw new Error('Not implemented.');
	}

	/**
	 * Stored a descriptive string for the NamedSyntaxPart definition.
	 * @param {String} description
	 * @returns {NamedSyntaxPart}
	 */
	setDescription (description) {
		this.description = description;
		return this;
	}
}

module.exports = NamedSyntaxPart;