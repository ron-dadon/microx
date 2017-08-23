# microX
Microservices framework for Node.js

## UNDER DEVELOPMENT
microX is under ongoing development. **Breaking changes may occur at any time until the first stable version will be released.**

**BREAKING CHANGE** - starting from version 0.3.0 and above the module exports a factory method like most framework, where in version 0.2.* and lower the class `Service` was exported directly.

## What is microX?
Microservices architecture adaptation is growing every day, making the agile development process easier and more productive
but comes with a cost - each service is simple, but managing an entire eco-system of microservices is
not a walk in the park. There are many known and highly adapted solutions, such as Sensca, but when I started my journey with
microservices I wanted to develop my own framework, for deeper understanding of the mechanics of microservices.
 
This project is for self learning experience, but after it will be completed, I will give it a test
run on a production project. Sure, it is not the fastest as it is built on top of HTTP using
express framework (TCP based frameworks are much faster), but the simplicity of using it and scaling it makes it a good tool for rapid development.
 
## Basic Architecture
microX is based on a pub - sub protocol using Redis for service discovery. Instead of having a central registry service that
holds all the services locations, each time a service is going up is publishes itself to all the other services.
Each service in that case holds a complete map of the services eco-system, making the central registry redundant and making each service more de-coupled from others.
The only dependency for each service is the Redis server location.
 
A service can call other services by their name & version. When a service calls another
service, it perform the communication directly with the service according to the service map it holds. This can improve performance over a standard broker based solutions, where the broker receives the calls and performs
the forwarding to the required service, causing each call to go through at least 2 servers, where in microX once a service
knows the location of another service, it contacts it directly.

## Docs

Documentation is still a work in progress, but partial documentation can be found [here](https://ron-dadon.github.io/microx/).