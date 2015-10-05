var assert = require('assert'),
	utils = require('./test-utils'),
	AskNicely = require('../AskNicely'),
	root = new AskNicely(),
	assertPromiseExecutionEqual = utils.assertPromiseExecutionEqual.bind(undefined, root);

function returnRequestData (req) {
	return req;
}
root
	.addCommand('a', returnRequestData)
		.addPreController(function (req) {
			req.firstPreController = true;
		})
		.addCommand('aa', returnRequestData)
			.addPreController(function (req) {
				req.secondPreController = true;
			});
root
	.addCommand('b', returnRequestData)
		.addPreController(function (req) {
			req.first = true;
			return false;
		})
		.addPreController(function (req) {
			req.second = true;
		});

describe('execute', function () {
	it('precontrollers are ran for all parents before the actual controller', function (done) {
		assertPromiseExecutionEqual('a aa', done, function (req) {
			assert.strictEqual(req.firstPreController, true);
			assert.strictEqual(req.secondPreController, true);
		});
	});
	it('returning FALSE prevents executing consecutive (pre) controllers', function (done) {
		assertPromiseExecutionEqual('b', done, function (req) {
			assert.strictEqual(req.first, true);
			assert.strictEqual(req.second, undefined);
		});
	});
});