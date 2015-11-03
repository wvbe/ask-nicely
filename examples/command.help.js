'use strict';

module.exports = function helpCommand(req) {
	let command = req.command;
	console.log(``);
	console.log(`Name:        ${command.name || '(no name)'}`);
	console.log(`Description: ${command.description || '(no description)'}`);

	if(command.children.length) {
		console.log(`\n${command.children.length} Child commands:`);

		command.children
			.sort((a, b) => a.name < b.name ? -1 : 1)
			.forEach(cmd =>{
				console.log(`    ${cmd.name}: (${cmd.description || 'no description'})`);
			});
	}

	if(command.parameters.length) {
		console.log(`\n${command.parameters.length} Parameters:`);

		command.parameters
			.forEach(param => {
				console.log(`    ${param.name}: (${param.description || 'no description'})`);
			});
	}

	if(command.options.length) {
		console.log(`\n${command.options.length} Parameters:`);

		command.options
			.sort((a, b) => a.name < b.name ? -1 : 1)
			.forEach(option => {
				console.log([
					'',
					(option.short ? '-' + option.short : '  '),
					'--' + option.name,
					(option.required ? '* ' : '') + (option.description || '(no description)')
				].join('    '));
			});
	}

	console.log(``);

	return false;
};
