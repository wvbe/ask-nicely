'use strict';

module.exports = {
	assertPromiseEqual: assertPromiseEqual,
	assertPromiseExecutionEqual: assertPromiseExecutionEqual
};

function assertPromiseExecutionEqual(root, str, done, cb, errcb) {
	root.interpret(str)
		.then(function (req) {
			return req.execute().then(function () {
				return req;
			});
		})
		.then(function (req) {
			if(typeof cb === 'function') {
				cb(req);
				done();
			} else {
				done(new Error('Did not throw expected error'));
			}
		})
		.catch(function (err) {
			if (typeof errcb === 'function') {
				errcb(err);
				done();
			} else {
				done(err);
			}

		});
}

function assertPromiseEqual(app, str, done, cb, errcb) {
	app.interpret(str)
		.then(function (req) {
			if(typeof cb === 'function') {
				cb(req);
				done();
			} else {
				done(new Error('Did not throw expected error'));
			}
		})
		.catch(function (err) {
			if (typeof errcb === 'function') {
				errcb(err);
				done();
			} else {
				done(err);
			}

		});
}