'use strict';

class NamedSyntaxPart {
	constructor (name) {
		this.name = name;
	}

	match (part) {
		throw new Error('Not implemented.');
	}

	updateTiersAfterMatch (tiers) {
		throw new Error('Not implemented.');
	}

	updateInputSpecsAfterMatch (resolvedInputSpecs, inputValue) {
		resolvedInputSpecs.push([this, inputValue]);
		return resolvedInputSpecs;
	}
	spliceInputFromParts (parts) {
		throw new Error('Not implemented.');
	}
	exportWithInput (request, value) {
		throw new Error('Not implemented.');
	}
	validateInput (input) {
		return true;
	}
	validateValue (input) {
		return true;
	}
	setDescription (description) {
		this.description = description;
		return this;
	}
}

module.exports = NamedSyntaxPart;