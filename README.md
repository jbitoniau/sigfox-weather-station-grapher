sigfox-weather-station-grapher
==============================

A web-based graphical viewer for the sigfox-weather-station program running on SmartEverything board.

[![Weather Grapher](http://img.youtube.com/vi/.../0.jpg)](http://www.youtube.com/watch?v=...)

More information about this project can be found here: http://bitoniau.blogspot.fr/2014/04/....html

# Installation
## Creating a Sigfox backend API access
You first need to create an API access for the SmartEverything device on the Sigfox backend (so the Weather Grapher server can fetch data from it). To do that:
- Log onto the Sigfox backend using your credentials
- Go to the 'Group' tab
- Click the group in the list
- Go to 'API Access' in the left panel
- Click the 'New' button in the top-right corner
- Fill in the form:
	Name: 'WeatherGrapher'
	Custom roles: 'DEVICES_MESSAGES[R]'
- Press 'Ok'

## Preparing the Weather Grapher server
- Make sure you've got Node.js installed on the machine (in the example, it's a Raspberry Pi, but it could be any machine)
- Get this repository:
```Bash
  git clone .....
```
- Provide the Sigfox API access credentials to the server. Copy and paste the login and password of the API access into a SigfoxBackendAuth.txt file at the root of the project (next to this README.md). It should contain a single line in this form: <login>:<password>. For example:
```Bash
  604e06c2483c2d7ea5d6406c:ba3bf2649d6c8a84f50b41e80c5e5654
```


# Disclaimer
