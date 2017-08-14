#microX

## Usage

microX module provides one simple constructor, the `Service` constructor.
The returned instance encapsulates all the required functionally to build a fully functional service.

### Initialization

```js
const Service = require('microx')

let configuration = new Service.ServiceConfiguration({
  name: 'sample service',
  port: 8080,
  host: '127.0.0.1'
})

let serviceInstance = new Service(configuration);

serviceInstance.start()
```

Create an configuration object, you can use a simple object or the `Service.ServiceConfiguration` constructor to validate the configuration object and setup default values.

To start your micro-service, call the `start` method.
You can stop the service, by calling the `stop` method.

### Events

The `Service` constructor extends the `EventsEmitter` constructor. The following events are emitted by the `Service`:

#### service start
Emitted when the service start method finished all the required processing and the service is ready to accept requests

#### service stopped
Emitted when the service stop method finished all the required processing and the service is no longer able to accept new requests

#### service ping
Emitted when another service has pinged the service
The event gets the pinging service meta object

#### call service error
Emitted when the service called another service and an error occurred

#### call unknown service
Emitted when the service called a service that it does not know its location

#### rpc server started
Emitted when the RPC HTTP server started listening

#### rpc server error
Emitted when the RPC HTTP server got an error

#### rpc server stopped
Emitted when the RPC HTTP server stopped listening

#### service remove error
Emitted when the service failed to send REMOVE multicast 
The event gets the error object

#### service remove sent
Emitted when the service sent REMOVE multicast

#### service removed
Emitted when the service got a REMOVE multicast from another service and removed that service from the locations map
The event gets the removed service meta object

#### service message
Emitted when the service got a multicast message from another service
The event gets the message object

#### services clean
Emitted when the service has finished a locations & versions maps cleaning to remove irrelevant services

#### service ping interval started
Emitted when the service started his pinging interval timer
The event gets the interval value

#### service ping interval stopped
Emitted when the service stopped his pinging interval timer

#### service ping sent
Emitted when the service sent a PING multicast message
The event gets the service meta object

#### service ping error
Emitted when the service failed to send a PING multicast message
The event gets the error object

### Methods

The service instance exposes the following methods:

#### provide

The `provide` method accepts 2 arguments:

1. **method** - the name of the method
2. **handler** - the method handler function (see more below)

The `provide` method registers the method handler to the method name, so another service that will call this method will trigger the execution of the registered handler.

#### broadcast

The `broadcast` method accepts 2 arguments:

1. **event** - the event name (the service name will be added automatically as a prefix)
2. **data** - a payload of data to attach to the event, this data will be received by all services that listens to it

Broadcast an event to other services. The broadcasting service will not receive the event, but all other services that listens on the event will receive the event.

#### start

Start the service RPC server and listen to incoming requests. Emit a `started` event to other services to add this instance or update the last appearance of the instance in the services map.

#### stop

Stop the service RPC server and publish a `stopped` event to other service to remove this instance from their services map.

#### on

Register an event listener for internal events of the service (as listed above)

#### call

Call another service

The `call` method accepts 2 arguments:

1. **service** - the full name of the service, including version in the format of [name]@[version]. If the version is not specified, it will automatically be the highest version known in the service map.
2. **method** - the name of the method
3. **data** - data to send to the method
4. **parentMessage** - if the call is triggered from another method handler, pass the parent message object to keep track of the message ID.

The method returns a Promise that will be resolved if the method handler of the called method will reply without an error, or rejected if the called method replied with an error.

#### httpRequest

A simple wrapper for `request` module. Used to call any third party HTTP based API.

The `httpRequest` method accepts a single argument, the `request` module options object. See `request` module documentation for details.

The method returns a Promise that will be rejected if the `request` callback returned an error and resolved with the response if no error occurred.

#### getServices

Get an array of known services (service map)

#### getEventsQueues

Get the list of all pending events

### Method Handler
Each time a method is defined in a service, it should include a method handler function.
The method handler function will get executed when another service performed a call to the method.

The method handler will get 3 arguments:

**Message**

The incoming message object. The message object includes the data sent from the calling service and some extra meta data. See Message object definition.

**Reply function**

The reply function is used to reply to the calling service. The reply function is a common (err, data) callback, where the first argument is the Error object if an error occurred, or null if everything is OK and the second object is the data to reply with in case of success.

**Service instance**

The current service instance is passed as the third argument to provide the developer with an option to perform service method calls from the handler such as broadcasting an event, calling another service method etc.

```js
serviceInstance.provide('myMethod', handler)

function handler(msg, reply, service) {
  console.log(msg.data)
  service.broadcast('myMethodHandlerCalled', msg.data)
  reply(null, {status: 'OK'})
}
```

## Event Handler
Each time an event listener is defined in a service, it should include an event handler function.
The event handler function will get executed when another service broadcast an event that match the event that is listened to.

The event handler will get 2 arguments:

**Event**

The event object that includes the data the was sent in the event broadcast.

**Service instance**

The current service instance is passed as the second argument to provide the developer with an option to perform service method calls from the handler such as broadcasting an event, calling another service method etc.

```js
serviceInstance.onEvent('myMethodHandlerCalled', eHandler)

function eHandler(event, service) {
  console.log(event.data)
  // Use service if needed
}
```

## Testing using HTTP client

Each service exposes his methods via an HTTP server. If you wish to call a service method without a second service instance, you can use any simple HTTP client that can perform POST requests.

The URL is the service URL (with port if required), and the path if the method name.
Perform a POST request with a JSON encoded object as the body (don't forget the `Content-Type` header, set it to `application/json`), and it will perform a call to the method.

For example:

```js
const Service = require('microx')

let configuration = new Service.ServiceConfiguration({
  name: 'math',
  port: 8080,
  host: '127.0.0.1'
})

let serviceInstance = new Service(configuration);

serviceInstance.provide('sum', sum)

serviceInstance.start()

function sum(msg, reply) {
  if (!Number.isInteger(msg.data.x) || !Number.isInteger(msg.data.y)) {
    return reply(new Error('Invalid X or Y values'))
  }
  reply(null, {sum: msg.data.x + msg.data.y})
}
```

To test this service, you can POST the following JSON:

```json
{
  "x": 1,
  "y": 2
}
```
With the header `Content-Type: application/json` to the URL: `http://127.0.0.1:8080/sum`

The response will be a JSON encoded Message object. For example:

```json
{
  "id": "cdbb3bf36c2343429870907b0e3fde47",
  "data": {
    "sum": 3
  },
  "headers": {
    "accept": "*/*",
    "cache-control": "no-cache",
    "content-type": "application/json",
    "content-length": "22",
    "host": "localhost:8080",
    "connection": "Keep-Alive",
    "user-agent": "Apache-HttpClient/4.5.2 (Java/1.8.0_112-release)",
    "accept-encoding": "gzip,deflate"
  },
  "time": 1502478245291,
  "from": "math@1.0.0"
}
```

## Objects

### Message

A message between 2 services.

The object fields:

1. **id** - a unique ID of the message (UUID V4). If the request includes an header `X-Request-ID`, the value will be extracted from that header.
2. **data** - the message payload data
3. **headers** - the message headers. Will automatically inherit the request headers.
4. **time** - a milliseconds UNIX timestamp of the message
5. **from** - the name and version of the service that created the message

### Event

An event object is created every time an event is broadcast. 

The object fields:

1. **id** - a unique event ID of the event (UUID V4)
2. **name** - the name of the event. The name automatically includes the service name as a prefix
3. **data** - the event payload data
4. **meta** - the event meta data object.

### Event Meta

A meta data that is attached to each Event object.

The object fields:

1. **emitter** - the name and version of the emitting service
2. **emitterId** - the unique ID of the service instance that emitted the event
3. **time** - a milliseconds UNIX timestamp of the event

### Service Meta

A meta data attached to the service instance. Available via the `meta` property.

The object fields:

1. **id** - a unique event ID of the service instance (UUID V4)
2. **versionName** - a full name with the version attached by `@`
3. **name** - the name of the service
4. **version** - the version of the service
5. **port** - the port the service listens on
6. **host** - the host that the service publishes to the other services to locate it at
7. **url** - the complete URL of the service
8. **secure** - is the service exposed via secure HTTPS connection
9. **ttl** - how long (in seconds) the service is considered alive by other service - after each `ttl` seconds the service will publish itself again to the other services
