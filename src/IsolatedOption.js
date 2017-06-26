'use strict';

import symbols from './symbols';
import Command from './Command';
import Option from './Option';

export default class IsolatedOption extends Option {
	constructor (name) {
		super(name);
	}

	// By resetting all tiers there are no "unresolved" syntax parts
	[symbols.updateTiersAfterMatch] (tiers) {
		tiers = {
			ordered: [],
			unordered: []
		};
		return tiers;
	}

	// By emptying out parts there should be no further attempts to match
	[symbols.spliceInputFromParts] (parts) {
		let input = Option.prototype[symbols.spliceInputFromParts].apply(this, arguments);

		parts.splice(0, parts.length);

		return input;
	}

	// By resetting the results to just the command and this instance the Request object stays clean
	[symbols.updateInputSpecsAfterMatch] (resolvedInputSpecs, inputValue) {
		resolvedInputSpecs = [
			resolvedInputSpecs.reverse().find(inputSpec => inputSpec.input instanceof Command),
			{
				syntax: this,
				input: inputValue
			}
		];

		return resolvedInputSpecs;
	}
}
