# ASK-NICELY
Tools to describe a hierarchy of commands, so that execution, validation and support info is made easy.

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

## To-do
- Keeping tests up-to-date
- Use minimist for a quick text-to-controller path (`executeFromInput()`?)
- Injectable validators for options and parameters
- Injectable autocompleter for parameters
- Write greedy pile to a Request attribute so it can be used
- Decide if there's really a difference between RootCommand and Command. What does a multitude of RootCommand mean?
- Test traversing up & down from different starting points

## License
Copyright (c) 2015 Wybe Minnebo

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

__THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.__