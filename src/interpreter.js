'use strict';

let symbols = require('./symbols');

/**
 * @param {Command} root
 * @param {String|Array<String>} [parts]
 * @returns {Array<[]>}
 */
function interpretInputSpecs (root, parts) {
	if (!parts)
		parts = [];

	if(typeof parts === 'string')
		parts = parts.match(/(".*?"|[^"\s]+)+(?=\s*|\s*$)/g).map(str => str.replace(/['"]+/g, ''));

	let scopes = [root],
		resolvedInputSpecs = [[root,root]];

	scopes._ = [];

	root[symbols.updateTiersAfterMatch](scopes, root);

	// Match and validate syntax parts based on input
	while (parts.length) {
		let expectedScopes = scopes._.concat(scopes),
			matchingScope = expectedScopes.find(scope => scope[symbols.isMatchForPart](parts[0]));

		if(!matchingScope)
			throw new Error(`Could not find a match for input "${parts[0]}"`);

		let matchingValue = matchingScope[symbols.spliceInputFromParts](parts);

		resolvedInputSpecs = matchingScope[symbols.updateInputSpecsAfterMatch](resolvedInputSpecs, matchingValue);

		scopes = matchingScope[symbols.updateTiersAfterMatch](scopes, matchingValue);
	}

	// Find everything that is still open to match, and map it to the same format as resolvedScopeValues
	let unresolvedInputSpecs = scopes._.concat(scopes)
		.reduce((leftovers, tierOptions) => leftovers.concat(tierOptions), [])
		.filter(syntaxPart => !resolvedInputSpecs.find(match => match[0] === syntaxPart))
		.map(unmatch => [unmatch, undefined, true]);

	return resolvedInputSpecs.concat(unresolvedInputSpecs);
}

/**
 *
 * @param {Request} request
 * @param {Array<[]>} inputSpecs
 * @returns {Promise}
 */
function resolveValueSpecs(request, inputSpecs) {
	inputSpecs.forEach(inputSpec => inputSpec[0][symbols.validateInput](inputSpec[1]));

	return Promise.all(inputSpecs.map(inputSpec => !inputSpec[0].resolver
			? inputSpec
			: Promise.resolve(inputSpec[0].resolver(inputSpec[1]))
		.then(input => [inputSpec[0], input])))
		.then(valueSpecs => {
			valueSpecs.forEach(valueSpec => valueSpec[0].validateValue(valueSpec[1]));
			return valueSpecs.reduce(
				(req, valueSpec) => Object.assign(req, valueSpec[0][symbols.exportWithInput](request, valueSpec[1], valueSpec[2])),
				request
			);
		});
}

module.exports = function interpreter (root, parts, request) {
	try {
		return resolveValueSpecs(request || {}, interpretInputSpecs(root, parts));
	} catch (e) {
		return Promise.reject(e);
	}
};