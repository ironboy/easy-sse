# easy-server-sent-events
An easy to use Server Side Events library for **Express/Node.js** + a frontend-library for web browsers. 

Automatically resumes broken connections, provides broadcasting capabilities and simplifies the syntax on both backend and frontend.

### Installation

```
npm install easy-server-sent-events
```

### Backend
Here's an example of how to use the module on the backend in Node.js:
* It is **Express** middleware, so you'll have to use [express](https://www.npmjs.com/package/express).
* You don't have to use [express-session](https://www.npmjs.com/package/express-session) but it makes it much easier, when you want to target the sending of events to specific clients.

```js
const express = require('express');
const session = require('express-session');
const app = express();
const sse = require('easy-server-sent-events');

// express-session middleware 
// ALWAYS APPLY FIRST OF ALL MIDDLEWARE!
// (Please note: It might be better to store sessions in a db)
app.use(session({
  secret: 'something hard to guess',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// You can change the following options:
// endpoint: which endpoint you want to use
// script: at which route a clientside library should be served
// These are the default values (they will be set even if omitted):
const options = {
  endpoint: '/api/sse',
  script: '/sse.js'
}

// Calling the module returns an object with four properties:
// SSE:
//     the middleware - use with an express app
// send: 
//     a function that sends events from the server:
//     send(to, eventType, data)
// openSessions: 
//     a function returns how many sessions are open
// openConnections: 
//     a function that returns how man connections that are open
const {SSE, send, openSessions, openConnections} = sse(options);
app.use(SSE);

// Other middleware goes here
// For example static middleware (if needed)
app.use(express.static('www'));

// Start web server
app.listen(4000, () => console.log('Listening on port 4000'));

// Example of using send(to, eventType, data)
// Here we send messages to all connected clients
// We randomly choose the between the event types
// 'message' and 'other' (you can name your event types how you like)
// and send a message (an object with the properties cool and content)
function test() {
  send(
    'all',
    Math.random() < .5 ? 'message' : 'other',
    { 
      cool: true, 
      content: 'This is a message sent ' + new Date().toLocaleTimeString() 
    }
  );
  // log how many openSessions and openConnections we have
  console.log(
    'openSessions', openSessions(),
    'openConnections', openConnections()
  );
}

// send an event every 3 seconds
setInterval(test, 3000);
```

#### How do I send events to specific clients?
* You send events to specific clients by replacing the "all" value with a filter.
* The filter receives the request object originally sent from the client.
* Thus - if you use the *express-session* middleware you will have a session object attached to the request object.

##### Filter by session properties
The following will only send messages to a user with the username 'root':

```js
send(
  req => req.session.user && req.session.user.username === 'root', 
  'superSecret',
  'This is a super secret message.'
);
```

##### Alternate ways to filter
If you decide to not use **express-session** the property **req.query.browserId** could be handy for identifying different clients. It is set by this module and unique for each client.

### Frontend

#### No build system/vanilla JS
If you are using this module without a build system that handles import statements you can include the frontend library with a script tag:

```html
<script src="/sse.js"></script>
```

#### With a build system (with React, Vue etc)
In build systems that support import statements use:
```js
import SSE from 'easy-server-sent-events/sse';
```

#### Basic usage
Create a new instance of the library and add eventlisteners

```js
const sse = new SSE();

sse.listen('message', (data) => {
  console.log('message', data);
});

sse.listen('other', (data) => {
  console.log('other', data);
});
```

#### Restart after login/logout etc
After login/logout and other events in your application that might change the session object on the backend, immediately restart your instance to make sure it has access to these changes:

```
sse.restart();
```

#### Remove an event listener
If you want to remove and event listener you can save the result of a call to **listen** in a variable and call **unlisten** later:


```js
const sse = new SSE();

let messageListener = sse.listen('message', (data) => {
  console.log('message', data);
});

// later...
sse.unlisten(messageListener);
```

### Usage with the **create-react-app** dev server: Proxying
You can start a **Express/Node.js** server in parallell with the **create-react-app dev server** and proxy the output from the **Express** server so that it is served on the same port as the output from the dev server. However [the documented solution](https://create-react-app.dev/docs/proxying-api-requests-in-development/#configuring-the-proxy-manually) for this does not work with Server Side Events (because of [buffer problems](https://github.com/facebook/create-react-app/issues/3391)).

Instead we provide a tailor-made solution:

1. Create a file named **setupProxy.js** (you must use *exactly* this name) in the *src* folder.
2. Add the following content to that file:

```js
const proxy = require('easy-server-sent-events/react-dev-proxy');
module.exports = proxy({
  route: '/api/',
  target: 'http://localhost:4000'
});
```

You can change the route to proxy and the target (depending on which port you use for your **Express** server).


### Older browsers
Microsoft Edge and Microsoft IE does not support *server sent events* because of lack of support for the **EventSource** object. There is a polyfill available:  
[event-source-polyfill](https://www.npmjs.com/package/event-source-polyfill).

