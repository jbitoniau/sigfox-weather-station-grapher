sigfox-weather-station-grapher
==============================

A Node.js based graphical viewer for the [sigfox-weather-station](https://github.com/nicolsc/sigfox-weather-station) example program running on the [SmartEverything board](http://www.smarteverything.it).

[![Weather Grapher](http://img.youtube.com/vi/hCRymmEQuNM/0.jpg)](http://www.youtube.com/watch?v=hCRymmEQuNM)

[![Weather Grapher](http://img.youtube.com/vi/41TDwdpSg_o/0.jpg)](http://www.youtube.com/watch?v=41TDwdpSg_o)

Detailed information about this project can be found here: https://bitoniau.blogspot.fr/2017/01/sigfox-weather-station-grapher.html

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
* Provide the Sigfox API access credentials to the server. Copy and paste the login and password of the API access into a SigfoxBackendAuth.txt file at the root of the project (next to this README.md). It should contain a single line in this form: <login>:<password>. For example:
```Bash
  604e06c2483c2d7ea5d6406c:ba3bf2649d6c8a84f50b41e80c5e5654
```
# Disclaimer
