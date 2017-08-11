# microX
Microservices framework for Node.js

## UNDER DEVELOPMENT
microX is under ongoing development

### What is microX?
Microservices architecture adaptation is growing every day, making the agile development process easier and more productive
but comes with a cost - each service is simple, but managing an entire eco-system of microservices is
not a walk in the park. There are many known and highly adapted solutions, such as Sensca, but when I started my journey with
microservices I wanted to develop my own framework, for deeper understanding of the mechanics of microservices.
 
This project is for self learning experience, but after it will be completed, I will give it a test
run on a production project. Sure, it is not the fastest as it is built on top of HTTP using
express framework (TCP based frameworks are much faster), but the simplicity of using it and scaling it makes it a good tool for rapid development.
 
### Basic Architecture
microX is based on a pub - sub protocol using Redis for service discovery. Instead of having a central registry service that
holds all the services locations, each time a service is going up is publishes itself to all the other services.
Each service in that case holds a complete map of the services eco-system, making the central registry redundant and making each service more de-coupled from others.
The only dependency for each service is the Redis server location.
 
A service can call other services by their name & version. When a service calls another
service, it perform the communication directly with the service according to the service map it holds. This can improve performance over a standard broker based solutions, where the broker receives the calls and performs
the forwarding to the required service, causing each call to go through at least 2 servers, where in microX once a service
knows the location of another service, it contacts it directly.

### Installation

Install microX is very simple using npm.

```
$ npm install microx --save
```

### Usage

microX module provides one simple constructor, the `Service` constructor.
The returned instance encapsulates all the required functionally to build a fully functional service.

#### Initialization

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

#### Events

The `Service` constructor extends the `EventsEmitter` constructor. The following events are emitted by the `Service`:

##### service start
Emitted when the service start method finished all the required processing and the service is ready to accept requests

##### service stopped
Emitted when the service stop method finished all the required processing and the service is no longer able to accept new requests

##### service ping
Emitted when another service has pinged the service
The event gets the pinging service meta object

##### call service error
Emitted when the service called another service and an error occurred

##### call unknown service
Emitted when the service called a service that it does not know its location

##### rpc server started
Emitted when the RPC HTTP server started listening

##### rpc server error
Emitted when the RPC HTTP server got an error

##### rpc server stopped
Emitted when the RPC HTTP server stopped listening

##### service remove error
Emitted when the service failed to send REMOVE multicast 
The event gets the error object

##### service remove sent
Emitted when the service sent REMOVE multicast

##### service removed
Emitted when the service got a REMOVE multicast from another service and removed that service from the locations map
The event gets the removed service meta object

##### service message
Emitted when the service got a multicast message from another service
The event gets the message object

##### services clean
Emitted when the service has finished a locations & versions maps cleaning to remove irrelevant services

##### service ping interval started
Emitted when the service started his pinging interval timer
The event gets the interval value

##### service ping interval stopped
Emitted when the service stopped his pinging interval timer

##### service ping sent
Emitted when the service sent a PING multicast message
The event gets the service meta object

##### service ping error
Emitted when the service failed to send a PING multicast message
The event gets the error object

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

### Event Handler
Each time an event listener is defined in a service, it should include an event handler function.
The event handler function will get executed when another service broadcast an event that match the event that is listened to.

The event handler will get 2 arguments:

**Event data**

The data object that is sent in the event broadcast.

**Service instance**

The current service instance is passed as the second argument to provide the developer with an option to perform service method calls from the handler such as broadcasting an event, calling another service method etc.

### Examples

See the following examples for better understanding of how to use microX.

1. [Simple service](https://github.com/ron-dadon/microx/blob/master/examples/simple%20service/simple.js)
2. [Multiple services](https://github.com/ron-dadon/microx/tree/master/examples/multiple%20services)
3. [Events](https://github.com/ron-dadon/microx/tree/master/examples/events)
4. [Monitoring](https://github.com/ron-dadon/microx/tree/master/examples/monitor)