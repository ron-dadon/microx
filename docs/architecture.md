# microX

[< Back to index](index.md)

## Architecture

microX is based on a pub - sub protocol using Redis for service discovery. Instead of having a central registry service that
holds all the services locations, each time a service is going up is publishes itself to all the other services.
Each service in that case holds a complete map of the services eco-system, making the central registry redundant and making each service more de-coupled from others.
The only dependency for each service is the Redis server location.
 
A service can call other services by their name & version. When a service calls another
service, it perform the communication directly with the service according to the service map it holds. This can improve performance over a standard broker based solutions, where the broker receives the calls and performs
the forwarding to the required service, causing each call to go through at least 2 servers, where in microX once a service
knows the location of another service, it contacts it directly.

