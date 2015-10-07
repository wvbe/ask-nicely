'use strict';

module.exports = function helpCommand(req) {
	var command = req.command;
	console.log('Name:');
	console.log('\t' + (command.name || '(no name)'));

	console.log('Description:');
	console.log('\t' + (command.description || '(no description)'));

	if(command.children.length) {
		console.log('Child commands:');

		command.children
			.sort(function(a, b) {
				return a.name < b.name ? -1 : 1;
			})
			.forEach(function (cmd) {
				console.log(['', cmd.name, '-', cmd.description || '(no description)'].join('\t'));
			});
	}

	if(command.parameters.length) {
		console.log('Parameters:');

		command.parameters
			.forEach(function (param) {
				console.log(['', param.name, '-', param.description || '(no description)'].join('\t'));
			});
	}

	if(command.options.length) {
		console.log('Options');

		command.options
			.sort(function(a, b) {
				return a.name < b.name ? -1 : 1;
			})
			.forEach(function (option) {
				console.log([
					'',
					(option.short ? '-' + option.short : '  ') + '    ' + '--' + option.name,
					(option.required ? '* ' : '') + (option.description || '(no description)')
				].join('\t'));
			});
	}

	return false;
};
