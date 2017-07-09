# microX
Microservices framework for Node.js

## UNDER DEVELOPMENT
microX is under ongoing development

#### What is microX?
Microservices architecture adaptation is growing every day, making the agile development process easier and more productive
but comes with a cost - each service is simple, but managing an entire eco-system of microservices is
not a walk in the park. There are many known and highly adapted solutions, such as Sensca, but when I started my journey with
microservices I've discovered that almost non of the framework / toolkit out there gives the entire solution.
 
And then microX came along. This project is for self learning experience, but after it will be completed, I will give it a test
run on a production project. Sure, it is not the fastest as it is built on top of HTTP using
express framework (TCP based frameworks are much faster), but the simplicity of using it and scaling it makes it a good tool for rapid development.
 
#### Basic Architecture
microX is based on a service registry and client services. The registry is the one place that holds the information regarding the
location of all the services, and it is then used by the services to fetch other services locations and broadcast and receive events.
 
Because of that, the registry is a weak spot in the system and can be a bottle neck. To tackle this, microX registry uses
Redis for storing the services meta data and the events queues, so if a registry server is highly loaded, another once can be
started, and a basic load balancer such as Nginx can be used to balance them.
 
A service can call other services by their name & version, without known the location of the service. When a service calls another
service, it first asks the registry for a location of an instance of this service, and than perform the communication directly with
the service. This can improve performance over a standard broker based solutions, where the broker receives the calls and performs
the forwarding to the required service, causing each call to go through at least 2 servers, where in microX once a service
knows the location of another service, it can store it and use the same information for future calls (like a cache, with a defined expiration).
