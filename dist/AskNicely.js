'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

(function (global, factory) {
	(typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) === 'object' && typeof module !== 'undefined' ? factory(exports) : typeof define === 'function' && define.amd ? define(['exports'], factory) : factory(global['ask-nicely'] = global['ask-nicely'] || {});
})(undefined, function (exports) {
	'use strict';

	var symbols = {
		isMatchForPart: Symbol('_isMatchForPart'),
		spliceInputFromParts: Symbol('_spliceInputFromParts'),
		updateInputSpecsAfterMatch: Symbol('_updateInputSpecsAfterMatch'),
		updateTiersAfterMatch: Symbol('_updateTiersAfterMatch'),
		applyDefault: Symbol('_applyDefault'),
		validateInput: Symbol('_validateInput'),
		exportWithInput: Symbol('_exportWithInput')
	};

	var AskNicelyInputError = function (_Error) {
		_inherits(AskNicelyInputError, _Error);

		function AskNicelyInputError(message, solution) {
			_classCallCheck(this, AskNicelyInputError);

			var _this = _possibleConstructorReturn(this, (AskNicelyInputError.__proto__ || Object.getPrototypeOf(AskNicelyInputError)).call(this, message));

			_this.name = _this.constructor.name;
			_this.solution = solution;
			return _this;
		}

		return AskNicelyInputError;
	}(Error);

	/**
  * @param {Command} root
  * @param {String|Array<String>} [parts]
  * @returns {Array<[]>}
  */


	function interpretInputSpecs(root, parts) {
		if (!parts) parts = [];

		if (typeof parts === 'string') parts = parts.match(/(".*?"|[^"\s]+)+(?=\s*|\s*$)/g).map(function (str) {
			return str.replace(/['"]+/g, '');
		});

		var resolvedInputSpecs = [{
			syntax: root,
			input: root
		}];

		var tiers = {
			ordered: [root],
			unordered: []
		};

		root[symbols.updateTiersAfterMatch](tiers, root);

		// Match and validate syntax parts based on input
		while (parts.length) {
			var expectedScopes = tiers.unordered.concat(tiers.ordered),
			    matchingScope = expectedScopes.find(function (scope) {
				return scope[symbols.isMatchForPart](parts[0]);
			});

			if (!matchingScope) throw new AskNicelyInputError('Could not find a match for input "' + parts[0] + '"');

			var matchingValue = matchingScope[symbols.spliceInputFromParts](parts);

			resolvedInputSpecs = matchingScope[symbols.updateInputSpecsAfterMatch](resolvedInputSpecs, matchingValue);

			tiers = matchingScope[symbols.updateTiersAfterMatch](tiers, matchingValue);
		}

		// Find everything that is still open to match, and map it to the same format as resolvedScopeValues
		var unresolvedInputSpecs = tiers.unordered.concat(tiers.ordered).reduce(function (leftovers, tierOptions) {
			return leftovers.concat(tierOptions);
		}, []).filter(function (syntaxPart) {
			return !resolvedInputSpecs.find(function (match) {
				return match.syntax === syntaxPart;
			});
		}).map(function (unmatch) {
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
		inputSpecs.map(function (inputSpec) {
			inputSpec.input = inputSpec.syntax[symbols.applyDefault](inputSpec.input, inputSpec.undefined);

			return inputSpec;
		}).forEach(function (inputSpec) {
			inputSpec.syntax[symbols.validateInput](inputSpec.input);
		});

		return Promise.all(inputSpecs.map(function (inputSpec) {
			return typeof inputSpec.syntax.resolver !== 'function' ? inputSpec : Promise.resolve(inputSpec.syntax.resolver.apply(inputSpec.syntax, [inputSpec.input].concat(rest))).then(function (input) {
				inputSpec.input = input;
				return inputSpec;
			});
		})).then(function (valueSpecs) {
			return valueSpecs.reduce(function (req, valueSpec) {
				valueSpec.syntax.validateValue(valueSpec.input);

				return Object.assign(req, valueSpec.syntax[symbols.exportWithInput](request, valueSpec.input, valueSpec.undefined));
			}, request);
		});
	}

	function interpreter(root, parts, request, rest) {
		try {
			return resolveValueSpecs(request || {}, interpretInputSpecs(root, parts), rest);
		} catch (e) {
			return Promise.reject(e);
		}
	}

	var NamedSyntaxPart = function () {
		/**
   * @param {String} name
   */
		function NamedSyntaxPart(name) {
			_classCallCheck(this, NamedSyntaxPart);

			this.name = name;
			this.description = null;
		}

		/**
   * Signals the parser that an input part matches this NamedSyntaxPart definition.
   * @param part
   * @returns {Boolean}
   */


		_createClass(NamedSyntaxPart, [{
			key: symbols.isMatchForPart,
			value: function value(part) {
				throw new Error('Not implemented.');
			}

			/**
    * Describes how the value should be temporarily stored together with it's defining NamedSyntaxPart
    * @param {NamedSyntaxPart} resolvedInputSpecs
    * @param {*} inputValue
    * @returns {Array}
    */

		}, {
			key: symbols.updateInputSpecsAfterMatch,
			value: function value(resolvedInputSpecs, inputValue) {
				resolvedInputSpecs.push({
					syntax: this,
					input: inputValue
				});
				return resolvedInputSpecs;
			}

			/**
    * Describes how to extract an input value from input parts. Is expected to mutate `parts`, and return (a temporary)
    * input value.
    * @param parts
    * @returns {*}
    */

		}, {
			key: symbols.spliceInputFromParts,
			value: function value(parts) {
				throw new Error('Not implemented.');
			}

			/**
    * Describes how a temporarily stored input value (from `spliceInputFromParts`) is written to the Request object.
    * Is not expected to return anything.
    * @param {Request} request
    * @param {*} input
    */

		}, {
			key: symbols.exportWithInput,
			value: function value(request, input) {
				throw new Error('Not implemented.');
			}
		}, {
			key: symbols.applyDefault,
			value: function value(_value, isUndefined) {
				return _value;
			}

			/**
    * Validates input before it is resolved. Expected to throw an error if something is awry, return undefined
    * otherwise.
    * @param input
    * @returns {boolean}
    */

		}, {
			key: symbols.validateInput,
			value: function value(input) {}

			/**
    * Validates a value after it is resolved. Expected to throw an error if something is awry, return undefined
    * otherwise.
    * @param input
    */

		}, {
			key: 'validateValue',
			value: function validateValue(value) {}

			/**
    * Returns the new scope of NamedSyntaxParts to parse through after this is parsed.
    * @param {Array} tiers
    * @returns {Array}
    */

		}, {
			key: symbols.updateTiersAfterMatch,
			value: function value(tiers) {
				throw new Error('Not implemented.');
			}

			/**
    * Stored a descriptive string for the NamedSyntaxPart definition, or whatever it is to the end-user
    * @param {String} description
    * @returns {NamedSyntaxPart}
    */

		}, {
			key: 'setDescription',
			value: function setDescription(description) {
				this.description = description;
				return this;
			}
		}]);

		return NamedSyntaxPart;
	}();

	var VariableSyntaxPart = function (_NamedSyntaxPart) {
		_inherits(VariableSyntaxPart, _NamedSyntaxPart);

		/**
   * @param {String} name
   */
		function VariableSyntaxPart(name) {
			_classCallCheck(this, VariableSyntaxPart);

			var _this2 = _possibleConstructorReturn(this, (VariableSyntaxPart.__proto__ || Object.getPrototypeOf(VariableSyntaxPart)).call(this, name));

			_this2.validators = [];
			return _this2;
		}

		/**
   * @param {boolean|Function} required - If this is a function, acts as a short-hand for addValidator() as well
   * @returns {VariableSyntaxPart}
   */


		_createClass(VariableSyntaxPart, [{
			key: 'isRequired',
			value: function isRequired(required) {
				this.required = !!required;

				return typeof required === 'function' ? this.addValidator(required) : this;
			}

			/**
    * Add a validator function that would check the resolved value and is expected to throw if something's awry.
    * @param {Function} validator
    * @returns {VariableSyntaxPart}
    */

		}, {
			key: 'addValidator',
			value: function addValidator(validator) {
				this.validators.push(validator);
				return this;
			}

			/**
    * Define a callback that can (asynchronously) resolve user input to a value. `resolver` can return any value
    * synchronously or a Promise for that value.
    * @param {Function} resolver
    * @returns {VariableSyntaxPart}
    */

		}, {
			key: 'setResolver',
			value: function setResolver(resolver) {
				this.resolver = resolver;
				return this;
			}

			/**
    * Set a value to fall back to in case VariableSyntaxPart was not defined (and not required)
    * @param {*} value
    * @returns {VariableSyntaxPart}
    */

		}, {
			key: 'setDefault',
			value: function setDefault(value) {
				this.default = value;
				return this;
			}
		}, {
			key: symbols.applyDefault,
			value: function value(_value2, isUndefined) {
				return isUndefined ? this.cloneDefault() : _value2;
			}
			// @TODO: Find a better way to clone objects, since Object.assign does not seem to do the job
			// If clone is not done properly, actual usage of a default property could overwrite it for later usages

		}, {
			key: 'cloneDefault',
			value: function cloneDefault() {
				return this.default && _typeof(this.default) === 'object' && !Array.isArray(this.default) ? JSON.parse(JSON.stringify(this.default || {})) : this.default;
			}
		}, {
			key: symbols.validateInput,
			value: function value(input) {
				if (this.required && input === undefined) throw new AskNicelyInputError('"' + this.name + '" can not be undefined.');
			}
		}, {
			key: 'validateValue',
			value: function validateValue(value) {
				this.validators.forEach(function (validator) {
					return validator(value);
				});
			}
		}]);

		return VariableSyntaxPart;
	}(NamedSyntaxPart);

	var Option = function (_VariableSyntaxPart) {
		_inherits(Option, _VariableSyntaxPart);

		function Option(name) {
			_classCallCheck(this, Option);

			return _possibleConstructorReturn(this, (Option.__proto__ || Object.getPrototypeOf(Option)).call(this, name));
		}

		_createClass(Option, [{
			key: symbols.isMatchForPart,
			value: function value(_value3) {
				// return true if value is a (grouped) short, or long notation
				return _value3.indexOf('-') !== 0 ? false : this.short && _value3.charAt(1) === this.short || _value3 === '--' + this.name;
			}
		}, {
			key: symbols.updateTiersAfterMatch,
			value: function value(tiers) {
				// do not change tiers because options are always recognizable, and may occur in input again
				return tiers;
			}
		}, {
			key: symbols.spliceInputFromParts,
			value: function value(parts) {
				// if this is a short notation (for one or more flags)
				if (this.short && parts[0].charAt(1) === this.short) {
					// remove the flag signifier from group
					parts[0] = '-' + parts[0].substr(2); //replace(this.short, '');

					// if the group is not empty, stop parsing this option
					if (parts[0] !== '-') return;
				}

				// Stop caring about the flag signifier
				parts.shift();

				// if value is a dash, stop parsing
				if (parts[0] === '-') {
					parts.shift();
					return;
				}

				// use next input part if it is not another option
				if (parts[0] && parts[0].charAt(0) !== '-') return parts.shift();
			}
		}, {
			key: symbols.applyDefault,
			value: function value(_value4, isUndefined) {
				if (this.required && isUndefined) return undefined;

				if (_value4 === undefined) {
					if (this.useDefaultIfFlagMissing || !isUndefined) {
						return this.cloneDefault() || true;
					}
				}
				return _value4;
			}
		}, {
			key: symbols.exportWithInput,
			value: function value(request, _value5, isUndefined) {
				request.options[this.name] = _value5;
			}

			/**
    *
    * @param value
    * @param {Boolean} [useDefaultIfFlagMissing] - Ignored when option is also required -- will fail validation
    * @returns {Option}
    */

		}, {
			key: 'setDefault',
			value: function setDefault(value, useDefaultIfFlagMissing) {
				this.default = value;
				this.useDefaultIfFlagMissing = !!useDefaultIfFlagMissing;
				return this;
			}

			/**
    * Set a one-letter alias for a flag.
    * @param {String} short
    * @returns {Option}
    */

		}, {
			key: 'setShort',
			value: function setShort(short) {
				this.short = short;
				return this;
			}
		}]);

		return Option;
	}(VariableSyntaxPart);

	var Parameter = function (_VariableSyntaxPart2) {
		_inherits(Parameter, _VariableSyntaxPart2);

		function Parameter(name) {
			_classCallCheck(this, Parameter);

			return _possibleConstructorReturn(this, (Parameter.__proto__ || Object.getPrototypeOf(Parameter)).call(this, name));
		}

		_createClass(Parameter, [{
			key: symbols.isMatchForPart,
			value: function value(_value6) {
				return _value6 === '-' || _value6.substr(0, 1) !== '-';
			}
		}, {
			key: symbols.updateTiersAfterMatch,
			value: function value(tiers) {
				tiers.ordered.shift();
				return tiers;
			}
		}, {
			key: symbols.spliceInputFromParts,
			value: function value(parts) {
				var value = parts.shift();
				return value === '-' ? undefined : value;
			}
		}, {
			key: symbols.exportWithInput,
			value: function value(request, _value7) {
				request.parameters[this.name] = _value7 === undefined ? this.cloneDefault() : _value7;
			}
		}]);

		return Parameter;
	}(VariableSyntaxPart);

	var CHILD_CLASS = Symbol('child command class definition');

	var Command = function (_NamedSyntaxPart2) {
		_inherits(Command, _NamedSyntaxPart2);

		function Command(name, controller) {
			_classCallCheck(this, Command);

			var _this5 = _possibleConstructorReturn(this, (Command.__proto__ || Object.getPrototypeOf(Command)).call(this, name));

			_this5.parent = null;
			_this5.controller = null;
			_this5.children = [];
			_this5.aliases = [];
			_this5.options = [];
			_this5.parameters = [];
			_this5.preControllers = [];

			_this5.setNewChildClass(Command);
			_this5.setController(controller);
			return _this5;
		}

		_createClass(Command, [{
			key: symbols.isMatchForPart,
			value: function value(_value8) {
				return !!this.getCommandByName(_value8);
			}
		}, {
			key: symbols.updateTiersAfterMatch,
			value: function value(tiers, match) {
				tiers.ordered.splice(tiers.ordered.indexOf(this), 1);

				if (match instanceof Command) {
					tiers.ordered.splice.apply(tiers.ordered, [0, 0].concat(match.parameters).concat(match));
					tiers.unordered.splice.apply(tiers.unordered, [0, 0].concat(match.options));
				}

				return tiers;
			}
		}, {
			key: symbols.spliceInputFromParts,
			value: function value(parts) {
				return this.getCommandByName(parts.shift());
			}
		}, {
			key: symbols.exportWithInput,
			value: function value(request, _value9) {
				if (_value9) request.command = _value9;
			}
		}, {
			key: 'executePreControllers',
			value: function executePreControllers() {
				var args = Array.prototype.slice.call(arguments);
				return this.preControllers.reduce(function (res, preController) {
					return res.then(function (previousVal) {
						return previousVal === false ? previousVal : preController.apply(null, args);
					});
				}, this.parent ? this.parent.executePreControllers.apply(this.parent, args) : Promise.resolve(true));
			}

			/**
    * @todo Use rest parameters
    * @returns {Promise}
    */

		}, {
			key: 'execute',
			value: function execute() {
				var _this6 = this;

				var args = Array.prototype.slice.call(arguments);

				return this.executePreControllers.apply(this, args).then(function (previousValue) {
					return previousValue === false || typeof _this6.controller !== 'function' ? previousValue : _this6.controller.apply(null, args);
				});
			}

			/**
    * Look up a child command by it's name
    * @param {String} name
    * @returns {Command|undefined}
    */

		}, {
			key: 'getCommandByName',
			value: function getCommandByName(name) {
				return this.children.find(function (child) {
					return child.name === name || child.aliases.indexOf(name) >= 0;
				});
			}

			/**
    * Set the main controller
    * @param {Function} cb
    * @returns {Command}
    */

		}, {
			key: 'setController',
			value: function setController(cb) {
				this.controller = cb;

				return this;
			}

			/**
    * Defines what class new child instances should have if they're being instantiated by this object
    * @param ClassObject
    * @returns {Command}
    */

		}, {
			key: 'setNewChildClass',
			value: function setNewChildClass(ClassObject) {
				this[CHILD_CLASS] = ClassObject;

				return this;
			}
			/**
    * Add a precontroller function that is ran before its own controller, or any of it's descendants precontrollers
    * @param {Function} cb
    * @returns {Command}
    */

		}, {
			key: 'addPreController',
			value: function addPreController(cb) {
				this.preControllers.push(cb);

				return this;
			}

			/**
    * Give command an alternative name
    * @param {String} name
    * @returns {Command}
    */

		}, {
			key: 'addAlias',
			value: function addAlias(name) {
				this.aliases.push(name);

				return this;
			}

			/**
    * Describe an option
    * @param {Option|String} long - The identifying name of this option, unique for its ancestry
    * @param {String} [short] - A one-character alias of this option, unique for its ancestry
    * @param {String} [description]
    * @param {Boolean} [required] - If true, an omittance would throw an error
    * @returns {Command}
    */

		}, {
			key: 'addOption',
			value: function addOption(long, short, description, required) {
				this.options.push(long instanceof Option ? long : new Option(long).setShort(short).setDescription(description).isRequired(required));

				return this;
			}

			/**
    * Describes a parameter. Notice tat if a command has child commands, *required is implied for all ancestor parameters
    * (and child cmd names will be mistaken for parameters if some is missing)
    * @param {Parameter|String} name
    * @param {String} [description]
    * @param {Boolean} [required]
    * @returns {Command}
    */

		}, {
			key: 'addParameter',
			value: function addParameter(name, description, required) {
				this.parameters.push(name instanceof Parameter ? name : new Parameter(name).setDescription(description).isRequired(required));

				return this;
			}

			/**
    * Register a command as a child of this, and register this as parent of the child
    * @TODO: Check if child is not in lineage of command, to avoid circularness
    * @param {String|Command} name
    * @param {Function} [controller]
    * @returns {Command} The child command
    */

		}, {
			key: 'addCommand',
			value: function addCommand(name, controller) {
				var child = name instanceof Command ? name : new this[CHILD_CLASS](name, controller);

				child.parent = this;

				this.children.push(child);

				return child;
			}
		}]);

		return Command;
	}(NamedSyntaxPart);

	var Request = function () {
		function Request() {
			_classCallCheck(this, Request);

			this.command = null;
			this.options = {};
			this.parameters = {};
		}

		/**
   * Execute command controller, or reject if errors were found
   * @param {*} ... Zero or many arguments to pass on to controller
   * @returns {Promise}
   */


		_createClass(Request, [{
			key: 'execute',
			value: function execute() {
				var args = Array.prototype.slice.call(arguments);

				return this.command.execute.apply(this.command, [this].concat(args));
			}
		}]);

		return Request;
	}();

	var breakPartsOnPart = Symbol();
	var breakPartsDefaultPattern = /^[-.*]/;

	var MultiOption = function (_Option) {
		_inherits(MultiOption, _Option);

		function MultiOption(name) {
			_classCallCheck(this, MultiOption);

			var _this7 = _possibleConstructorReturn(this, (MultiOption.__proto__ || Object.getPrototypeOf(MultiOption)).call(this, name));

			_this7.isInfinite();
			return _this7;
		}

		// @todo: infinite arg as a callback


		_createClass(MultiOption, [{
			key: 'isInfinite',
			value: function isInfinite(infinite) {
				this[breakPartsOnPart] = !!infinite ? function (part) {
					return false;
				} : function (part) {
					return part.charAt(0) === '-';
				};

				return this;
			}
		}, {
			key: breakPartsOnPart,
			value: function value(part) {
				return part.match(breakPartsDefaultPattern);
			}
		}, {
			key: symbols.spliceInputFromParts,
			value: function value(parts) {
				if (this.short && parts[0].charAt(1) === this.short) {
					parts[0] = '-' + parts[0].substr(2);

					if (parts[0] !== '-') return [];
				}

				parts.shift();

				var input = [];

				do {
					if (parts[0] === '-') {
						parts.shift();
						break;
					}
					if (!parts[0] || this[breakPartsOnPart](parts[0])) break;

					input.push(parts.shift());
				} while (parts.length > 0);

				return input;
			}
		}, {
			key: symbols.applyDefault,
			value: function value(_value10, isUndefined) {
				if (_value10 === undefined || !_value10.length) {
					if (this.useDefaultIfFlagMissing || !isUndefined) {
						_value10 = this.cloneDefault() || [];
					}
				}

				if (this.required && (isUndefined || !_value10 || !_value10.length)) return undefined;

				return _value10 || [];
			}
		}, {
			key: symbols.exportWithInput,
			value: function value(request, _value11, isUndefined) {
				request.options[this.name] = (request.options[this.name] || []).concat(_value11);
			}
		}]);

		return MultiOption;
	}(Option);

	function getValueFromPath(nameParts, obj) {
		return nameParts.reduce(function (o, part) {
			return o && o[part] ? o[part] : undefined;
		}, obj);
	}

	function assignValueToPath(nameParts, resultObj, value) {
		var name = nameParts.shift();

		resultObj[name] = nameParts.length ? assignValueToPath(nameParts, resultObj[name] || {}, value) : value;

		return resultObj;
	}

	var DeepSyntaxPart = function () {
		function DeepSyntaxPart() {
			_classCallCheck(this, DeepSyntaxPart);
		}

		_createClass(DeepSyntaxPart, null, [{
			key: symbols.spliceInputFromParts,
			value: function value(parts) {
				var deepName = parts.shift();

				deepName = deepName.substr(deepName.indexOf('.') + 1);

				// if value is a dash, set actual value to TRUE
				if (parts[0] === '-') {
					parts.shift();
					return [deepName, getValueFromPath(deepName.split('.'), this.cloneDefault()) || true];
				}

				return parts[0] && parts[0].indexOf('-') !== 0 ? [deepName, parts.shift()] : [deepName, getValueFromPath(deepName.split('.'), this.cloneDefault()) || true];
			}
		}, {
			key: symbols.exportWithInput,
			value: function value(propertyName, request, _value12) {
				if (!request[propertyName]) request[propertyName] = {};

				if (!request[propertyName][this.name]) request[propertyName][this.name] = this.cloneDefault() || {};

				if (_value12 === undefined) {
					return;
				}

				request[propertyName][this.name] = assignValueToPath(_value12[0].split('.'), request[propertyName][this.name], _value12[1]);
			}
		}]);

		return DeepSyntaxPart;
	}();

	var DeepOption = function (_Option2) {
		_inherits(DeepOption, _Option2);

		function DeepOption(name) {
			_classCallCheck(this, DeepOption);

			return _possibleConstructorReturn(this, (DeepOption.__proto__ || Object.getPrototypeOf(DeepOption)).call(this, name));
		}

		_createClass(DeepOption, [{
			key: symbols.isMatchForPart,
			value: function value(_value13) {
				return _value13.indexOf('--' + this.name + '.') === 0;
			}
		}, {
			key: symbols.spliceInputFromParts,
			value: function value(parts) {
				return DeepSyntaxPart[symbols.spliceInputFromParts].call(this, parts);
			}
		}, {
			key: symbols.exportWithInput,
			value: function value(request, _value14) {
				return DeepSyntaxPart[symbols.exportWithInput].call(this, 'options', request, _value14);
			}
		}]);

		return DeepOption;
	}(Option);

	var IsolatedOption = function (_Option3) {
		_inherits(IsolatedOption, _Option3);

		function IsolatedOption(name) {
			_classCallCheck(this, IsolatedOption);

			return _possibleConstructorReturn(this, (IsolatedOption.__proto__ || Object.getPrototypeOf(IsolatedOption)).call(this, name));
		}

		// By resetting all tiers there are no "unresolved" syntax parts


		_createClass(IsolatedOption, [{
			key: symbols.updateTiersAfterMatch,
			value: function value(tiers) {
				tiers = {
					ordered: [],
					unordered: []
				};
				return tiers;
			}

			// By emptying out parts there should be no further attempts to match

		}, {
			key: symbols.spliceInputFromParts,
			value: function value(parts) {
				var input = Option.prototype[symbols.spliceInputFromParts].apply(this, arguments);

				parts.splice(0, parts.length);

				return input;
			}

			// By resetting the results to just the command and this instance the Request object stays clean

		}, {
			key: symbols.updateInputSpecsAfterMatch,
			value: function value(resolvedInputSpecs, inputValue) {
				resolvedInputSpecs = [resolvedInputSpecs.reverse().find(function (inputSpec) {
					return inputSpec.input instanceof Command;
				}), {
					syntax: this,
					input: inputValue
				}];

				return resolvedInputSpecs;
			}
		}]);

		return IsolatedOption;
	}(Option);

	var DeepParameter = function (_Parameter) {
		_inherits(DeepParameter, _Parameter);

		function DeepParameter(name) {
			_classCallCheck(this, DeepParameter);

			return _possibleConstructorReturn(this, (DeepParameter.__proto__ || Object.getPrototypeOf(DeepParameter)).call(this, name));
		}

		_createClass(DeepParameter, [{
			key: symbols.isMatchForPart,
			value: function value(_value15) {
				return _value15.indexOf(this.name + '.') === 0;
			}
		}, {
			key: symbols.updateTiersAfterMatch,
			value: function value(tiers) {
				return tiers;
			}
		}, {
			key: symbols.spliceInputFromParts,
			value: function value(parts) {
				return DeepSyntaxPart[symbols.spliceInputFromParts].call(this, parts);
			}
		}, {
			key: symbols.exportWithInput,
			value: function value(request, _value16) {
				return DeepSyntaxPart[symbols.exportWithInput].call(this, 'parameters', request, _value16);
			}
		}]);

		return DeepParameter;
	}(Parameter);

	var Root = function (_Command) {
		_inherits(Root, _Command);

		/**
   * @param {String} [name]
   * @param {Function} [controller]
   * @constructor
   */
		function Root(name, controller) {
			_classCallCheck(this, Root);

			return _possibleConstructorReturn(this, (Root.__proto__ || Object.getPrototypeOf(Root)).call(this, name, controller));
		}

		/**
   * @param {String|Array<String>} [parts]
   * @param {Object} [request] An existing Request, if you do not want to make a new one if you want to re-use it
   * @returns {Promise}
   */


		_createClass(Root, [{
			key: 'interpret',
			value: function interpret(parts, request) {
				for (var _len = arguments.length, args = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
					args[_key - 2] = arguments[_key];
				}

				return interpreter(this, parts, request || new Request(), args);
			}
		}]);

		return Root;
	}(Command);

	exports.Root = Root;
	exports.Command = Command;
	exports.Request = Request;
	exports.Option = Option;
	exports.MultiOption = MultiOption;
	exports.DeepOption = DeepOption;
	exports.IsolatedOption = IsolatedOption;
	exports.Parameter = Parameter;
	exports.DeepParameter = DeepParameter;
	exports.InputError = AskNicelyInputError;

	Object.defineProperty(exports, '__esModule', { value: true });
});

