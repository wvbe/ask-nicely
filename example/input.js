var util = require('util'),
	Root = require('../Root'),
	root = new Root(),
	inspect = function (data) {
		console.log(util.inspect(data, {
			colors: true,
			depth: 3
		}));
	};


// Register the "test" command, which dumps back the parsed request when called
// This allows you to inspect the results of different input syntaxes
root.addCommand('test', function (request) {
	return request;
})
	.isGreedy() // Command regards all latter route parts as undescribed parameters
	.isHungry(); // Command allows undescribed options


inspect(process.argv);

inspect(root.input(process.argv.slice(2)));