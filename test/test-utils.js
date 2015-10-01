module.exports = {
	assertPromiseEqual: assertPromiseEqual,
	assertPromiseExecutionEqual: assertPromiseExecutionEqual
};
function assertPromiseExecutionEqual(app, str, done, cb, errcb) {
	app.interpret(str)
		.then(function (req) {
			return req.execute().then(function () {
				return req;
			});
		})
		.then(function (req) {
			if(cb)
				cb(req);
			else {
				assert.ok(false, 'Should not run');
			}

			done();
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
			if(cb)
				cb(req);
			else {
				assert.ok(false, 'Should not run');
			}

			done();
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