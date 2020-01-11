'use strict';

import symbols from './symbols';
import InputError from './InputError';

/**
 * @param {Command} root
 * @param {String|Array<String>} [parts]
 * @returns {Array<[]>}
 */
function interpretInputSpecs(root, parts, throwOnFirstError = true) {
	if (!parts) parts = [];

	if (typeof parts === 'string')
		parts = parts.match(/(".*?"|[^"\s]+)+(?=\s*|\s*$)/g).map((str) => str.replace(/['"]+/g, ''));

	let resolvedInputSpecs = [
		{
			syntax: root,
			input: root
		}
	];

	let tiers = {
		ordered: [ root ],
		unordered: []
	};

	//
	root[symbols.updateTiersAfterMatch](tiers, root);

	// Match and validate syntax parts based on input
	while (parts.length) {
		let expectedScopes = tiers.unordered.concat(tiers.ordered),
			matchingScope = expectedScopes.find((scope) => scope[symbols.isMatchForPart](parts[0]));

		if (!matchingScope) {
			const error = new InputError(`EINVAL: The input "${parts[0]}" was not expected`);
			if (throwOnFirstError) {
				throw error;
			}

			resolvedInputSpecs.push({
				syntax: null,
				error,
				value: parts.shift()
			});

			continue;
		}

		// Allow the SyntaxPart to modify the string that is being evaluated
		//   eg. allow an Option to change "-abc" to "-bc" for following SyntaxParts
		// @DEBT returns a modified matchingScope _and_ changes by reference `parts`
		let matchingValue = matchingScope[symbols.spliceInputFromParts](parts);

		// Update the collection of parsed values (each coupled to their matchign SyntaxPart)
		resolvedInputSpecs = matchingScope[symbols.updateInputSpecsAfterMatch](resolvedInputSpecs, matchingValue);

		// Update the tiers (ordered/unordered) for whatever is left to parse
		tiers = matchingScope[symbols.updateTiersAfterMatch](tiers, matchingValue);
	}

	// Find everything that is still open to match, and map it to the same format as resolvedScopeValues
	// This information is needed so that parts (like an --option) can set itself to a default conditionally of being
	// used, or not
	let unresolvedInputSpecs = tiers.unordered
		.concat(tiers.ordered)
		.reduce((leftovers, tierOptions) => leftovers.concat(tierOptions), [])
		.filter((syntaxPart) => !resolvedInputSpecs.find((match) => match.syntax === syntaxPart))
		.map((unmatch) => ({
			syntax: unmatch,
			input: undefined,
			undefined: true
		}));

	return resolvedInputSpecs.concat(unresolvedInputSpecs);
}

/**
 *
 * @param {Request} request
 * @param {Array<[]>} inputSpecs
 * @param {Array<*>} rest
 * @returns {Promise}
 */
async function resolveValueSpecs(request, inputSpecs, ...rest) {
	const validatedInputSpecs = await Promise.all(
		inputSpecs

		// Do not run for the input specs that had an error
		// Those are also the ones that don't have a `.syntax`
		.filter((inputSpec) => !inputSpec.error)

		.map(async (inputSpec) => {
			// Maybe set the default
			inputSpec.input = inputSpec.syntax[symbols.applyDefault](inputSpec.input, inputSpec.undefined);

			inputSpec.syntax[symbols.validateInput](inputSpec.input);

			if (inputSpec.syntax.resolver) {
				inputSpec.input = await inputSpec.syntax.resolver(inputSpec.input, ...rest);
			}

			return inputSpec;
		})
	);

	// Run the valueSpecs in sequence with each given the output of their predecessor
	return validatedInputSpecs.reduce(async (asyncLast, valueSpec) => {

		// This is the input checking as per Command#addValidator configuration
		await valueSpec.syntax.validateValue(valueSpec.input);

		const mergedRequestObject = await asyncLast;

		const valueSpecContribution =
			(await valueSpec.syntax[symbols.createContributionToRequestObject](
				mergedRequestObject,
				valueSpec.input,
				valueSpec.undefined
			)) || {};

		return Object.keys(valueSpecContribution).reduce((merged, key) => {
			if (key === 'command') merged[key] = valueSpecContribution[key];
			else merged[key] = Object.assign(merged[key] || {}, valueSpecContribution[key]);
			return merged;
		}, mergedRequestObject);
	}, request);
}

export default function interpreter(root, parts, request, throwOnFirstError, rest) {
	try {
		return resolveValueSpecs(request || {}, interpretInputSpecs(root, parts, throwOnFirstError), rest);
	} catch (e) {
		return Promise.reject(e);
	}
}
