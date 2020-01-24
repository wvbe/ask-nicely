'use strict';

import symbols from './symbols';
import InputError from './InputError';

/**
 * @param {Command} root
 * @param {String|Array<String>} [parts]
 * @return {Array<[]>}
 */
function matchInputToSyntaxPaths(root, parts) {
	if (!parts) parts = [];

	if (typeof parts === 'string')
		parts = parts.match(/(".*?"|[^"\s]+)+(?=\s*|\s*$)/g).map(str => str.replace(/['"]+/g, ''));

	// Tiers are two collections of syntax parts; ordered ones need to be written in order by the user, unordered syntax
	// parts may occur at any point in a command line input
	let tiers = {
		// Commands, parameters
		ordered: [root],
		// Options
		unordered: []
	};

	//
	root[symbols.updateTiersAfterMatch](tiers, root);

	// Match and validate syntax parts based on input
	let resolvedInputSpecs = [
		{
			// The root command represents having invoked ask-nicely in the first place,
			// or in other words, it's what happens if you were to run your script without any input
			syntax: root,
			input: root,
			isUndefined: false
		}
	];
	while (parts.length) {
		const expectedScopes = [...tiers.unordered].concat(tiers.ordered),
			matchingScope = expectedScopes.find(scope => scope[symbols.isMatchForPart](parts[0]));

		if (!matchingScope) {
			throw new InputError(`EINVAL: The input "${parts[0]}" was not expected`);
		}

		// Allow the SyntaxPart to modify the string that is being evaluated
		//   eg. allow an Option to change "-abc" to "-bc" for following SyntaxParts
		// @DEBT returns a modified matchingScope _and_ changes by reference `parts`
		const matchingValue = matchingScope[symbols.spliceInputFromParts](parts);

		// Update the collection of parsed values (each coupled to their matchign SyntaxPart)
		resolvedInputSpecs = matchingScope[symbols.updateInputSpecsAfterMatch](
			resolvedInputSpecs,
			matchingValue
		);

		// Update the tiers (ordered/unordered) for whatever is left to parse
		tiers = matchingScope[symbols.updateTiersAfterMatch](tiers, matchingValue);
	}

	// Find everything that is still open to match, and map it to the same format as resolvedScopeValues
	// This information is needed so that parts (like an --option) can set itself to a default conditionally of being
	// used, or not
	const unresolvedInputSpecs = [...tiers.ordered, ...tiers.unordered]
		.reduce((leftovers, tierOptions) => leftovers.concat(tierOptions), [])
		.filter(syntaxPart => !resolvedInputSpecs.find(match => match.syntax === syntaxPart))
		.map(unmatch => ({
			syntax: unmatch,
			input: undefined,
			isUndefined: true
		}));

	return [resolvedInputSpecs, unresolvedInputSpecs];
}

/**
 *
 * @param {Request} request
 * @param {Array<[]>} inputSpecs
 * @param {Array<*>} rest
 * @return {Promise}
 */
export default function interpreter(root, parts, request, ...rest) {
	const [resolvedInputSpecs, unresolvedInputSpecs] = matchInputToSyntaxPaths(root, parts);
	return (
		[
			...resolvedInputSpecs.map(valueSpec => {
				// Maybe set the default
				valueSpec.input = valueSpec.syntax[symbols.applyDefault](
					valueSpec.input,
					valueSpec.isUndefined
				);
				valueSpec.syntax[symbols.validateInput](valueSpec.input);
				return valueSpec;
			}),
			...unresolvedInputSpecs
				.map(valueSpec => {
					// Maybe set the default
					valueSpec.input = valueSpec.syntax[symbols.applyDefault](
						valueSpec.input,
						valueSpec.isUndefined
					);
					valueSpec.syntax[symbols.validateInput](valueSpec.input);

					return valueSpec;
				})
				.reverse()
		]
			// Resolve the valueSpecs in sequence with each given the output of their predecessor
			.reduce(async (asyncLast, valueSpec) => {
				// Run the Command#addResolver configuration
				if (valueSpec.syntax.resolver) {
					valueSpec.input = await valueSpec.syntax.resolver(valueSpec.input, ...rest);
				}

				// Run the Command#addValidator configuration
				await valueSpec.syntax.validateValue(valueSpec.input);

				const mergedRequestObject = await asyncLast;

				// This is the object a syntax part generated, to be spliced into the Request object
				// eg. { options: { foo: 'bar' }}
				const contribution =
					(await valueSpec.syntax[symbols.createContributionToRequestObject](
						mergedRequestObject,
						valueSpec.input,
						valueSpec.isUndefined
					)) || {};

				// Merge the contribution into the original Request object
				// eg. { command: Command, options: { foo: 'bar', 'boo': 'baz' }}
				return Object.keys(contribution).reduce((merged, key) => {
					if (key === 'command') merged[key] = contribution[key];
					else merged[key] = Object.assign(merged[key] || {}, contribution[key]);
					return merged;
				}, mergedRequestObject);
			}, request || {})
	);
}
