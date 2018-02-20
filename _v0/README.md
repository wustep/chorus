# Chorus v0
Old version of Chorus, each demo is separated and must be specified in ENV to be used

## .env
Create .env in this folder to set configuration
```
# PORT: Express server port
PORT=3000

# CLIENT: Serve client files via express at this directory
CLIENT=demo/midi/public

SERVER=demo/midi/midi.js

# DEBUG: Serve all events if true, otherwise serve only errors
DEBUG=true
```
Change "midi" to "crossfilter", "leaflet", or "tbdbitl" to run other demos.

Use `npm start` to run. In above sample, client should go to `localhost:3000` to use demo
