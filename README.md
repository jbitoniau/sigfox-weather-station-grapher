sigfox-weather-station-grapher
==============================

A Node.js based graphical viewer for the [sigfox-weather-station](https://github.com/nicolsc/sigfox-weather-station) example program running on the [SmartEverything board](http://www.smarteverything.it).

Detailed information about this project can be found here: https://bitoniau.blogspot.fr/2017/01/sigfox-weather-station-grapher.html

[![Weather Grapher](http://img.youtube.com/vi/hCRymmEQuNM/0.jpg)](http://www.youtube.com/watch?v=hCRymmEQuNM)

[![Weather Grapher](http://img.youtube.com/vi/41TDwdpSg_o/0.jpg)](http://www.youtube.com/watch?v=41TDwdpSg_o)


# Installation

## Creating a Sigfox backend API access
You first need to create an API access for your SmartEverything device on the [Sigfox backend](https://backend.sigfox.com) (so the Weather Grapher server can fetch data from it). To do that:
* Log onto the Sigfox backend using your credentials
* Go to the 'Group' tab
* Click the group in the list
* Go to 'API Access' in the left panel
* Click the 'New' button in the top-right corner
* Fill in the form:
  * Name: 'WeatherGrapher'
  * Custom roles: 'DEVICES_MESSAGES[R]'
* Press 'Ok'

## Preparing the Weather Grapher server
* Make sure you've got Node.js installed on the machine (the Raspberry Pi in the example, but it could be anything)
* Get a local version of this project's repository
```Bash
  git clone https://github.com/jbitoniau/sigfox-weather-station-grapher
```
* Provide the Node.js server with Sigfox API credentials. Copy and paste the login and password obtained previously into a SigfoxBackendAuth.txt file at the root of the project (next to this README.md). It should contain a single login:password line. Something that looks like this:
```Bash
  604e06c2483c2d7ea5d6406c:ba3bf2649d6c8a84f50b41e80c5e5654
```

## Starting the server
Now you should be able to start the Node.js server like so:
```Bash
  sudo node WeatherGrapher.js
```
Running as 'sudo' is needed as the server runs on port 80. If that's a problem, you can change it to port 8080, for example, in the code and sudo won't be needed.

## Visiting the webpage
The URL for the page looks like this:
```Bash
  http://192.168.1.15/devices/2F42A
```
Replace '192.168.1.15' with the address of the Weather Grapher server, and '2F42A' with the ID of your SmartEverything device.
An optional date argument can be added at the end to graph a particular period of time:
```Bash
  http://192.168.1.15/devices/2F42A?date=12/01/2016
```
Going back in time past the first message will be rejected by the backend and fail. Trying to graph the future will break the spacetime continuum (the grapher will fallback to current time).

# Controls

## Mouse
* Panning: left-click drag in the graph or mouse wheel (vertically and horizontally)
* Zooming in/out: control+mouse wheel for x axis, and shift+control+mouse wheel for the y axis

## Keys
* Panning: arrow keys
* Zooming in/out: -/+ for the x axis, and shift -/+ for y axis

## Touchscreen
* Panning: one-finger swipe 
* Zooming in/out: two-finger pinch

# Disclaimer
This project is for educational purpose only, use it at your own risk. In particular, be careful with making the server accessible over the internet as no special care was taken concerning security.

