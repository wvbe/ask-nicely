'use strict';

export default class Request {
	constructor () {
		this.command = null;
		this.options = {};
		this.parameters = {};
	}

	/**
	 * Execute command controller, or reject if errors were found
	 * @param {*} ... Zero or many arguments to pass on to controller
	 * @returns {Promise}
	 */
	execute() {
		let args = Array.prototype.slice.call(arguments);

		return this.command.execute.apply(
			this.command,
			[this].concat(args)
		);
	}
}
