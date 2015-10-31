'use strict';

var assert = require('assert'),
	utils = require('./test-utils'),
	AskNicely = require('../AskNicely'),
	root = new AskNicely(),
	assertPromiseExecutionEqual = utils.assertPromiseExecutionEqual.bind(undefined, root);

function returnRequestData (req) {
	return req;
}

root
	.addCommand(new root.Command('a', returnRequestData))
		.addPreController((req) => {
			req.firstPreController = true;
		})
		.addCommand('aa', returnRequestData)
			.addPreController((req) => {
				req.secondPreController = true;
			});
root
	.addCommand('b', returnRequestData)
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

	it('returning FALSE prevents executing consecutive (pre) controllers', (done) => {
		assertPromiseExecutionEqual('b', done, (req) => {
			assert.strictEqual(req.first, true);
			assert.strictEqual(req.second, undefined);
		});
	});
});