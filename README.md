# Chorus
**Chorus** is a framework for rapidly creating multi-device JavaScript-based data visualizations.

**Goal**: Minimize the time taken to turn any regular browser-based data viz to be a collaborative experience

[See the poster here!](https://github.com/wustep/chorus/blob/chorus/poster.pdf) (Presented at the 2018 OSU Denman Undergraduate Research Forum) or below
<img width="1440" alt="Screen Shot 2022-09-09 at 12 08 35 PM" src="https://user-images.githubusercontent.com/6259534/189394177-04ea6e2c-6fa0-4484-a59d-206b0538d426.png">

[Summer update presentation with some demos](https://docs.google.com/presentation/d/1ThKu_yxz_ir6lvLDzYl4P6-8zOGuQiHz5UdFJwMCdV0/)

This project was developed under the advising and support of Dr. Arnab Nandi's [Interactive Data Systems Group](https://interact.osu.edu/) at The Ohio State University. Thanks [Arnab](https://arnab.org/)!

# Features
- Multi-device data coordination for any JavaScript-based data visualization or tool, easily integrated into code
- Server facilitating numerous clients and channels, separating data stores securely with low latency
- Menu to allow users to easily create or follow data rooms and detach if desired
- Built-in Chromecast integration, allowing any monitor or projector to become a synced external display
- Custom backend to add additional socket events or server-sided data processing

# Demos
**MIDI**: Socket.io piano keyboard + vizualization of notes played

**Crossfilter**: Crossfilter.js Flight data dashboard

**Leaflet**: Leaflet.js map and draw tools

# Usage
**Installation**

To install Chorus's server and associated demos:

1. Clone Git repository
2. Install NPM if needed, then ```npm install``` in root
3. Create ```.env``` file in root with desired specifications (see below).
4. Run your own web server or serve your tool's files statically through the ```.env``` file settings
5. Delete ```/demo/``` folders if desired
6. Run ```npm start```

**Code**

To implement on your own JS-based tool:

1. Include ```socket.io``` and optionally ```cast_sender.js``` locally or externally
2. Include ```chorus.js``` and ```chorus.css``` in the ```/public/chorus/``` folder.
```
<script src="https://code.jquery.com/jquery-3.2.1.min.js" integrity="sha256-hwg4gsxgFZhOsEEamdOYGBf13FyQuiTwlAQgxVSNgt4="crossorigin="anonymous"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.0.2/socket.io.js"></script>
<script type="text/javascript" src="//www.gstatic.com/cv/js/sender/v1/cast_sender.js"></script>
<script src="chorus.js"></script>
```
3. Create ```new Chorus``` object
4. Implement function ```chorus.render(data, fresh)``` that renders data accordingly
5. Add function call ```chorus.update(data)``` whenever data is updated

See [```public/chorus/test.html```](https://github.com/wustep/chorus/blob/chorus/public/chorus/test.html) for a full demonstration. 

# ENV
```
# port: Express server port (OPTIONAL, DEFAULT: 3000)
port=3000

# client: Serve client files via express (OPTIONAL)
client=public/

# customs: Serve additional custom server files (OPTIONAL)
customs=server/demo/midi/midi.js

# debug: Show all console messages (OPTIONAL, DEFAULT: false)
debug=true
```
