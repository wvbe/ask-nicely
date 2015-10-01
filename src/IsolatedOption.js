var Command = require('./Command'),
	Option = require('./Option');

function IsolatedOption(name) {
	Option.call(this, name);
}

IsolatedOption.prototype = Object.create(Option.prototype);
IsolatedOption.prototype.constructor = IsolatedOption;

// By resetting all tiers there are no "unresolved" syntax parts
IsolatedOption.prototype.updateTiersAfterMatch = function (tiers) {
	tiers = [];
	tiers._ = [];
	return tiers;
};

// By emptying out parts there should be no further attempts to match
IsolatedOption.prototype.spliceInputFromParts = function (parts) {
	var input = Option.prototype.spliceInputFromParts.apply(this, arguments);

	parts.splice(0, parts.length);

	return input;
};

// By resetting the results to just the command and this instance
IsolatedOption.prototype.updateInputSpecsAfterMatch = function(resolvedInputSpecs, inputValue) {
	resolvedInputSpecs = [resolvedInputSpecs.reverse().find(function (inputSpec) {
		return inputSpec[0] instanceof Command;
	})];

	resolvedInputSpecs.push([this, inputValue]);

	return resolvedInputSpecs;
};

module.exports = IsolatedOption;