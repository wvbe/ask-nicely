'use strict';

import symbols from './symbols';
import InputError from './InputError';

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

	let resolvedInputSpecs = [{
			syntax: root,
			input: root
		}];

	let tiers = {
		ordered: [root],
		unordered: []
	};

	root[symbols.updateTiersAfterMatch](tiers, root);

	// Match and validate syntax parts based on input
	while (parts.length) {
		let expectedScopes = tiers.unordered.concat(tiers.ordered),
			matchingScope = expectedScopes.find(scope => scope[symbols.isMatchForPart](parts[0]));

		if(!matchingScope)
			throw new InputError(`Could not find a match for input "${parts[0]}"`);

		let matchingValue = matchingScope[symbols.spliceInputFromParts](parts);

		resolvedInputSpecs = matchingScope[symbols.updateInputSpecsAfterMatch](resolvedInputSpecs, matchingValue);

		tiers = matchingScope[symbols.updateTiersAfterMatch](tiers, matchingValue);
	}

	// Find everything that is still open to match, and map it to the same format as resolvedScopeValues
	let unresolvedInputSpecs = tiers.unordered.concat(tiers.ordered)
		.reduce((leftovers, tierOptions) => leftovers.concat(tierOptions), [])
		.filter(syntaxPart => !resolvedInputSpecs.find(match => match.syntax === syntaxPart))
		.map(unmatch => {
			return {
				syntax: unmatch,
				input: undefined,
				undefined: true
			};
		});
	return resolvedInputSpecs.concat(unresolvedInputSpecs);
}

/**
 *
 * @param {Request} request
 * @param {Array<[]>} inputSpecs
 * @param {Array<*>} rest
 * @returns {Promise}
 */
function resolveValueSpecs(request, inputSpecs, rest) {
	inputSpecs
		.map(inputSpec => {
			inputSpec.input = inputSpec.syntax[symbols.applyDefault](inputSpec.input, inputSpec.undefined);

			return inputSpec;
		})
		.forEach(inputSpec => {
			inputSpec.syntax[symbols.validateInput](inputSpec.input);
		});

	return Promise.all(inputSpecs.map(inputSpec => typeof inputSpec.syntax.resolver !== 'function'
			? inputSpec
			: Promise.resolve(inputSpec.syntax.resolver.apply(inputSpec.syntax, [inputSpec.input].concat(rest)))
				.then(input => {
					inputSpec.input = input;
					return inputSpec
				})))
		.then(valueSpecs => {
			return valueSpecs.reduce((req, valueSpec) => {
				valueSpec.syntax.validateValue(valueSpec.input);

				return Object.assign(req, valueSpec.syntax[symbols.exportWithInput](request, valueSpec.input, valueSpec.undefined))
			}, request);
		});
}

export default function interpreter (root, parts, request, rest) {
	try {
		return resolveValueSpecs(request || {}, interpretInputSpecs(root, parts), rest);
	} catch (e) {
		return Promise.reject(e);
	}
};
