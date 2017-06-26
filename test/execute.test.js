'use strict';

var assert = require('assert'),
	utils = require('./test-utils'),
	askNicely = require('../dist/AskNicely');

var root = new askNicely.Command(),
	assertPromiseExecutionEqual = utils.assertPromiseExecutionEqual.bind(undefined, root);


root
	.addCommand(new askNicely.Command('a', req => req))
		.addAlias('alias')
		.addPreController((req) => {
			req.firstPreController = true;
		})
		.setController((req) => {
			req.commandname = req.command.name;
		})
		.addCommand('aa', req => req)
			.addPreController((req) => {
				req.secondPreController = true;
			});
root
	.addCommand('b', req => req)
		.addPreController((req) => {
			req.first = true;
			return false;
		})
		.addPreController((req) => {
			req.second = true;
		});

describe('execute', () => {
	it('precontrollers are ran for all parents before the actual controller', (done) => {
		assertPromiseExecutionEqual('a aa', done, (req) => {
			assert.strictEqual(req.firstPreController, true);
			assert.strictEqual(req.secondPreController, true);
		});
	});

	it('can use an alias command name', (done) => {
		assertPromiseExecutionEqual('alias', done, (req) => {
			assert.strictEqual(req.firstPreController, true);
			assert.strictEqual(req.commandname, 'a');
		});
	});

	it('returning FALSE prevents executing consecutive (pre) controllers', (done) => {
		assertPromiseExecutionEqual('b', done, (req) => {
			assert.strictEqual(req.first, true);
			assert.strictEqual(req.second, undefined);
		});
	});
});
