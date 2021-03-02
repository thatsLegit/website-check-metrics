# Overview

Hey, this is the work I did for the take home assignement about Website Availability & Performance Monitoring.
I used the following metrics for each requested website:
-Availability
-Max response time
-Avg response time
-Response code counts
-Uptime (time since the last unsuccessful website check).

The general pattern used to design this application is a sort of MVC, with History, Presentation and Controller
modules.

After the user has finished entering the website he is interested in, a Website instance is created for each website.

A Website has a Memory in which Stats and Alerts are re-calculated after each 'check', which happens at the interval
frequency specified by the user.

To compute Stats for each call, basic maths are used and stored into queues with the last element of it containing 
the 'freshest' metrics for the given website. This allows using the last element to re-calculate stats at interval
thus achieving a constant time complexity for calculating/storing/retrieving stats.
The stats are extracted every interval in the controller and sent to the Presentation for display.

Finally, to connect Alerts to the Presentation part of the application, a Finite State Machine with Up and Down states 
is used. At each state change, an event is triggered to display the corresponding alert message.


# Installation
The app should work in a Nodejs env with version above 14.
Install with 'npm install'
Run app 'node main'
Run tests: 'npm run test -s'
Run eslint: 'npm run lint -s'

# Improvements

## Metrics:
I wanted to include into as a metric, the size of the request's body and the time it takes to load in the
browser but I failed to find a simple way to do it because the body of the request is compressed.

## Application design:
-A 'Metric' generic class would be great to be able to add additional metrics easily. For now it requires to hard-code
the metric in the stats factory function in Statistics.
-For now as soon as the state machine update to a different state than the previous, it triggers the execution of the
alerts presentation function thus bypassing the controller. It would ne nicer to avoid this Alert-Presentation relation.
-Using a state machine is maybe not suited to this exercise, although I found it very handy to have switching states
and trigger alerts on any state change.
-Also it would have been nice to use typescript
