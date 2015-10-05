'use strict';

var Command = require('./Command'),
	Option = require('./Option');

class IsolatedOption extends Option {
	constructor (name) {
		super(name);
	}

	// By resetting all tiers there are no "unresolved" syntax parts
	updateTiersAfterMatch (tiers) {
		tiers = [];
		tiers._ = [];
		return tiers;
	}

	// By emptying out parts there should be no further attempts to match
	spliceInputFromParts (parts) {
		var input = Option.prototype.spliceInputFromParts.apply(this, arguments);

		parts.splice(0, parts.length);

		return input;
	}

	// By resetting the results to just the command and this instance
	updateInputSpecsAfterMatch (resolvedInputSpecs, inputValue) {
		resolvedInputSpecs = [resolvedInputSpecs.reverse().find(function (inputSpec) {
			return inputSpec[0] instanceof Command;
		})];

		resolvedInputSpecs.push([this, inputValue]);

		return resolvedInputSpecs;
	}
}

module.exports = IsolatedOption;