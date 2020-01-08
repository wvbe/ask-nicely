'use strict';

import symbols from './symbols';
import InputError from './InputError';

/**
 * @param {Command} root
 * @param {String|Array<String>} [parts]
 * @returns {Array<[]>}
 */
function interpretInputSpecs (root, parts, throwOnFirstError = true) {
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

	//
	root[symbols.updateTiersAfterMatch](tiers, root);

	// Match and validate syntax parts based on input
	while (parts.length) {
		let expectedScopes = tiers.unordered.concat(tiers.ordered),
			matchingScope = expectedScopes.find(scope => scope[symbols.isMatchForPart](parts[0]));

		if(!matchingScope) {
			const error = new InputError(`Could not find a match for input "${parts[0]}"`);
			if (throwOnFirstError) {
				throw error;
			}

			resolvedInputSpecs.push({
				error,
				value: parts.shift()
			});

			continue;
		}

		// Allow the SyntaxPart to modify the string that is being evaluated
		//   eg. allow an Option to change "-abc" to "-bc" for following SyntaxParts
		let matchingValue = matchingScope[symbols.spliceInputFromParts](parts);

		// Update the collection of parsed values (each coupled to their matchign SyntaxPart)
		resolvedInputSpecs = matchingScope[symbols.updateInputSpecsAfterMatch](resolvedInputSpecs, matchingValue);

		// Update the tiers (ordered/unordered) for whatever is left to parse
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
function resolveValueSpecs(request, inputSpecs, ...rest) {
	return Promise.all(inputSpecs
			.filter(inputSpec => !!inputSpec.syntax)
			.map(inputSpec => Object.assign(inputSpec, {
				input: inputSpec.syntax[symbols.applyDefault](inputSpec.input, inputSpec.undefined)
			}))
			.map(inputSpec => {
				inputSpec.syntax[symbols.validateInput](inputSpec.input);

				return typeof inputSpec.syntax.resolver !== 'function'
					? inputSpec
					: Promise.resolve(inputSpec.syntax.resolver(inputSpec.input, ...rest))
						.then(input => {
							inputSpec.input = input;
							return inputSpec
						})
			})
		)
		.then(valueSpecs => {
			const appliedOptionNames = [];
			return valueSpecs
				.filter(function (valueSpec) {
					if (appliedOptionNames.indexOf(valueSpec.syntax.name) !== -1) {
						return false;
					}
					appliedOptionNames.push(valueSpec.syntax.name);
					return true;
				})
				.reduce((req, valueSpec) => {
					valueSpec.syntax.validateValue(valueSpec.input);

					return Object.assign(req, valueSpec.syntax[symbols.exportWithInput](req, valueSpec.input, valueSpec.undefined))
				}, request);
		});
}

export default function interpreter (root, parts, request, throwOnFirstError, rest) {
	try {
		return resolveValueSpecs(request || {}, interpretInputSpecs(root, parts, throwOnFirstError), rest);
	} catch (e) {
		return Promise.reject(e);
	}
};
