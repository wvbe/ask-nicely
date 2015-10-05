var q = require('q');

/**
 * @param {String} root
 * @param {Array.<String>} [route]
 * @param {Object} [options]
 * @constructor
 */
function Request() {
}

Request.prototype.assign = function (obj) {
	return Object.assign(this, obj);
};


/**
 * Create a request object for a descendant command specified with query pieces (argv)
 * @param root
 * @param pieces
 * @returns {Request}
 */

function resolveInputSpecs (root, parts) {
	if(typeof parts === 'string')
		parts = parts.match(/(".*?"|[^"\s]+)+(?=\s*|\s*$)/g).map(function (str) {
			return str.replace(/['"]+/g, '');
		});

	var scopes = [root],
		resolvedInputSpecs = [[root,root]];

	scopes._ = [];

	root.updateTiersAfterMatch(scopes, root);

	// Match and validate syntax parts based on input
	while (parts.length) {
		var expectedScopes = scopes._.concat(scopes);
		var matchingScope = expectedScopes.find(function (scope) {
			return scope.match(parts[0]);
		});

		if(!matchingScope) {
			throw new Error('Could not find a match for input "' + parts[0] + '"');
		}

		var matchingValue = matchingScope.spliceInputFromParts(parts);

		resolvedInputSpecs = matchingScope.updateInputSpecsAfterMatch(resolvedInputSpecs, matchingValue);

		scopes = matchingScope.updateTiersAfterMatch(scopes, matchingValue);
	}

	// Find everything that is still open to match, and map it to the same format as resolvedScopeValues
	var unresolvedInputSpecs = scopes._.concat(scopes)
		.reduce(function (leftovers, tierOptions) {
			return leftovers.concat(tierOptions);
		}, [])
		.filter(function (syntaxPart) {
			return !resolvedInputSpecs.find(function (match) { return match[0] === syntaxPart });
		})
		.map(function (unmatch) {
			return [unmatch, undefined];
		});

	return resolvedInputSpecs.concat(unresolvedInputSpecs);
}

function resolveValueSpecs(request, inputSpecs) {
	try {
		inputSpecs.forEach(function (inputSpec) {
			inputSpec[0].validateInput(inputSpec[1]);
		});
	} catch (e) {
		return q.reject(e);
	}

	return q.all(inputSpecs.map(function (inputSpec) {
			return !inputSpec[0].resolver
				? inputSpec
				: q.resolve(inputSpec[0].resolver(inputSpec[1]))
					.then(function (input) {
						return [inputSpec[0], input];
					});
		}))
		.then(function (valueSpecs) {
			valueSpecs.forEach(function (valueSpec) {
				valueSpec[0].validateValue(valueSpec[1]);

				// @TODO rename `exportWithInput` method
				request.assign(valueSpec[0].exportWithInput(request, valueSpec[1]));
			});
			return request;
		});
}

Request.resolve = function (root, parts) {
	try {
		return resolveValueSpecs(new Request(), resolveInputSpecs(root, parts));
	} catch (e) {
		return q.reject(e);
	}
};

/**
 * Execute command controller, or reject if errors were found
 * @param {*} ... Zero or many arguments to pass on to controller
 * @returns {Promise}
 */
Request.prototype.execute = function() {
	var args = Array.prototype.slice.call(arguments);

	return this.command.execute.apply(
		this.command,
		[this].concat(args)
	);
};

module.exports = Request;