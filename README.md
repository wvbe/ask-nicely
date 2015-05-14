# ASK-NICELY
Tools to describe a hierarchy of commands, so that execution, validation and support info is made easy.

## The geste
```
var Ask = require('ask-nicely'),
    api = new Ask('root');
    
api
    .addCommand('test', function (request, whatever) {
        /* controller logic */
    });

api
    // Return a Request object containing all the info to execute it
    .request(['test'], { f: 'Banana' })

    // Execute controller for found command (supplementing it with `whatever`)
    // and promise it's return value
    .execute(new Whatever());
```

## Configuring a Command
A "command" is basically the description of a controller and the options/parameters it takes. The following example describes two (nested) commands with pretty much everything it can:

```
// Register a command at root level, does not have to have a controller
var flight = api.addCommand('flight');

// Register a description, may be used in generating help files
flight.addDescription('Various flight-related actions');

// Register a parameter (which is parsed from the route)
flight.addParameter('code', 'The flight number');

// Register a new command as child of the "flight" command
var flightTowards = flight.addCommand('towards', function (register) {
    /* controller logic */
});

// Register an option "altitude" (short alias: "a"), with a description, and it is required
flightTowards.addOption('airport', 'a', 'The code to an airport', true);

// Configure the command to include all following (undocumented) parameters with the request
flightTowards.isGreedy();

// Configure the command to include all undocumented options with the request
flightTowards.isHungry();
```

Once the "flight" > "towards" command is ran, the request object may look like this:
```
{
    route: ['flight', '{code}', 'towards'],
    
    options: {
        // Options are always renamed to their long name:
        airport: 'AMS',
        
        // Except the undocumented ones, if isHungry():
        b: 'foo'
    },
    
    parameters: {
        // Parameters are always renamed:
        code: 'ABC-1007',

        // Except the undocumented ones, if isGreedy():
        _: ['bar']
    },

    
    // The command that the route resolved to is included with the request:
    command: flightTowards
}
```

FYI, this would have been the request resulting from the following call:
```
api.request(['flight', 'ABC-1007', 'towards', 'bar'], { a: 'AMS', b: 'foo' }).execute();

// Or from another root:
flight.request(['ABC-1007', 'towards', 'bar'], { a: 'AMS', b: 'foo' }).execute();
```

## To-do
- Keeping tests up-to-date
- Injectable validators for options and parameters
- Injectable autocompleter for parameters
- Test traversing up & down from different starting points

- Maybe, just maybe, do our own minimalist-ish string parsing ~ this would give opportunity to much more configurable options and parameters.

## License
Copyright (c) 2015 Wybe Minnebo

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

__THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.__