module.exports = {
	assertPromiseEqual: assertPromiseEqual
};

function assertPromiseEqual(app, str, done, cb, errcb) {
	app.interpret(str)
		.then(function (req) {
			if(cb)
				cb(req);
			else {
				console.log('Running while it shouldnt');
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