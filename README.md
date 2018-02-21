# chorus
multiple device data viz coordination with socket.io and express

# benefits
- Server-sided or client-sided data generation and handling
- Sync data so clients can receive real-time updates to dataset or push to main display
- Separating d3 components into multiple windows or devices allow for flexibility of display

# demos
**TBDBITL**: Pie chart + dot chart + arrow buttons coordinating OSU Marching Band row instrumentation breakdown

**MIDI**: Socket.io piano keyboard + vizualization of notes played

**Crossfilter**: Flight data

**Leaflet**: Leaflet.js map and draw tools

- Note: only MIDI / Leaflet so far is available in main chorus. Use /v0/ to run others. Rest are being ported!

# usage
- See public/chorus/test.html for an example usage and rules

# ENV
```
# port: Express server port
port=3000

# client: Serve client files via express
client=demo/midi/public

# customs: Serve custom server files
customs=demo/midi/midi.js

# debug: Serve all events if true, otherwise serve only errors
debug=true
```
