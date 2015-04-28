var q = require('q');

function Command(name, controller) {
	if(typeof name !== 'string')
		throw new Error('Command name must be a string');

	this.name = name;
	this.options = [];
	this.parameters = [];

	this._controller = controller;
}

/**
 * Either throws an error or executes le command and returns a promise for it's result
 * @param request
 * @returns {Promise}
 */
Command.prototype.execute = function(request) {
	if(!this.hasController())
		return q.resolve();

	var response = this._controller.apply(this, arguments);

	if(!isPromised(response))
		return q.resolve(response);

	return response;
};

Command.prototype.validateOptions = function (options) {
	this.options.forEach(function(option) {
		if(option.required && options[option.long] === undefined)
			// Not just programmers may get this error, thus make a human speech effort
			// @TODO: Do that
			throw new Error('Wrong argument, option "'+option.long+'" can not be undefined.');
	});

	return true;
};

Command.prototype.listCommands = function() {
	return this.children ? Object.keys(this.children).map(function(key) {
		return this.children[key];
	}.bind(this)) : [];
};

Command.prototype.getCommandByName = function(name) {
	return this.children ? this.children[name] : undefined;
};


Command.prototype.getCommandsByMatchingName = function(name) {
	if(!name)
		return [];

	return this.listCommands().filter(function(command) {
		return command.name.indexOf(name) === 0;
	});
};

Command.prototype.getCommandForRoute = function(route, returnClosestMatch) {
	var parentCommand = this,
		lastCommand = null,
		stashedParameters = 0;


	for (var i = 0; i < route.length; ++i) {
		var routePiece = route[i];
		if(!routePiece)
			continue; // skip

		if(parentCommand.parameters.length > stashedParameters) {
			++stashedParameters;
			continue;
		}

		lastCommand = parentCommand.getCommandByName(routePiece);

		if(!lastCommand) {

			if (returnClosestMatch)
				break; // End loop peacefully

			var parentRoute = parentCommand.getRoute();

			// Not just programmers may get this error, thus make a human speech effort
			throw new Error('Could not find command "' + route[i] + '"' + (
				parentRoute.length > 0
					? ' in "' + parentRoute.join(' ') + '"'
					: ''
			));
		}


		parentCommand = lastCommand;
		stashedParameters = 0;
		if(parentCommand.greedy)
			break;

	}

	return parentCommand || this;
};

Command.prototype.parseParametersFromRoute = function (route) {

	var indexRoute = 0;
	return this.getLineage().reduce(function (parameters, command, index) {
			command.parameters.forEach(function (paramDesc) {
				parameters[paramDesc.name] = route[indexRoute];

				++indexRoute;
			});
			++indexRoute;
			return parameters;
		}, {});
};

//Command.prototype.getAllParameters = function () {
//	return this.getLineage().reduce(function (parameters, ancestor) {
//		return parameters.concat(ancestor.parameters);
//	}, []);
//};

Command.prototype.getLineage = function() {
	var lineage = [],
		self = this; // highest-level parents first, closest last
	do {
		lineage.unshift(self);
	} while(self = self.getParent());

	return lineage;
};

Command.prototype.getRoute = function() {
	return this.getLineage().slice(1).map(function(command) {
		return command.name;
	})
};

Command.prototype.setParent = function(command) {
	// Combat programmers who are goofing around
	if(!command instanceof Command)
		throw new Error('Parent for "' + this.name + '" is of wrong type');

	this.parent = command;

	return this;
};

Command.prototype.getParent = function() {
	return this.parent;
};

// wether or not all succeeding route words are swallowed by this command, meaning
// traversing into a tree stops at this node.
Command.prototype.isGreedy = function(isGreedy) {
	this.greedy = isGreedy === undefined ? true : !!isGreedy;

	return this;
};

// wether or not request options that are not described with addOption() are normalized
// away in normalizeOptions()
Command.prototype.isHungry = function(isHungry) {
	this.hungry = isHungry === undefined ? true : !!isHungry;

	return this;
};

Command.prototype.addDescription = function(description) {
	this.description = description;

	return this;
};

Command.prototype.hasController = function () {
	return typeof this._controller === 'function';
};
/**
 *
 * @param long
 * @param [short]
 * @param [description]
 * @param [required]
 * @returns {Command}
 */
Command.prototype.addOption = function(long, short, description, required) {

	// Combat programmers who are goofing around
	if(this.options.length && this.options.some(function(opt) {
		return opt.long === long || (short && short === opt.short);
	}))
		throw new Error('Already an option with either this long "' + long + '" or short  "' + short + '"');

	this.options.push({
		long: long,
		short: short,
		description: description,
		required: !!required
	});

	return this;
};

/**
 * Says the next subcommand call is really a (named) parameter of this command.
 * @param name
 */
Command.prototype.addParameter = function (name, description) {
	this.parameters.push({
		name: name,
		description: description
		//required: required
	});

	return this;
};

Command.prototype.addCommand = function(name, controller) {

	var child = name instanceof Command ? name : new Command(name, controller);

	if(this.children && this.children[child.name])
		throw Error('Child command "' + name + '" already exists, cannot be re-registered.');

	child.setParent(this);

	if(!this.children)
		this.children = {};

	this.children[name] = child;

	return child;
};


Command.prototype.getSuggestedCommandsForInput = function(value) {
	var parentCommand = this.getCommandForRoute(value.route, true),
		needsAllSuggestion = value.route[value.route.length-1] === ''; // last character is a space

	return parentCommand.greedy ? [] : (needsAllSuggestion
			? parentCommand.listCommands()
			: parentCommand.getCommandsByMatchingName(value.route[value.route.length-1]));
};

Command.prototype.normalizeOptions = function(dirty) {
	if(!dirty)
		return {};

	var clean = {},
		dirtyKeys = Object.keys(dirty),
		allowUnknownOptions = this.hungry;

	// normalize (delete) short flags for their long counterparts
	this.options.forEach(function(option) {
		if (dirty[option.long] !== undefined) {
			clean[option.long] = dirty[option.long];
		} else if (dirty[option.short] !== undefined) {
			clean[option.long] = dirty[option.short];
		}

		if(!allowUnknownOptions)
			return;

		if(dirtyKeys.indexOf(option.long) >= 0)
			dirtyKeys.splice(dirtyKeys.indexOf(option.long), 1);
		if(option.short && dirtyKeys.indexOf(option.short) >= 0)
			dirtyKeys.splice(dirtyKeys.indexOf(option.short), 1);
	});

	if(!allowUnknownOptions || !dirtyKeys.length)
		return clean;

	dirtyKeys.forEach(function(dirtyKey) {
		clean[dirtyKey] = dirty[dirtyKey];
	});

	return clean;
};


function isPromised(promise) {
	if(promise instanceof q.Promise)
		return true;
	if(!promise)
		return false;
	if(promise.then || typeof promise.then !== 'function')
		return false;
	if(promise.catch || typeof promise.catch !== 'function')
		return false;
	if(promise.finally || typeof promise.finally !== 'function')
		return false;

	return true;
}


module.exports = Command;