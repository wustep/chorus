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

# goal
- Work with JS-based libraries: leaflet, crossfilter, d3, dc, etc. 

# usage
- For now, to access demos, edit the ENV file and replace "crossfilter" with the desired demo ("tbdbitl", "midi")