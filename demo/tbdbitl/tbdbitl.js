/* TBDBITL demo server-sided data generation function 
In this example, all functions are server-sided, and the client makes a call to have the server manipulate data.
This might be potentially safer, since the client can't maliciously manipulate the data much. 

TBDBITL demo developed from https://github.com/wustep/tbdbitl */

const d3 = require('d3');
const fs = require("fs");

var _data = {
	row: [],
	pie: [],
	dot: [],
	instruments: 0
};
var csvData = [];
var rowNum = 0;

module.exports = {
	_generateOnServer: true, // Required, no default

	_commands: {
		addRow: { // All these default to false right now
			replaceData: true,
			emit: "render all",
			emitSender: true,
			emitBroadcast: true,
			requireGenerated: true,
			returnData: false
		},
		deleteRow: {
			replaceData: true,
			emit: "render all",
			emitSender: true,
			emitBroadcast: true,
			requireGenerated: true,
			returnData: false
		}
	},
	
	create: (callback) => {
		fs.readFile(__dirname + "/instruments.csv", "utf8", (error, data) => {			
			if (error) {
				callback("CSV not read properly");
				return;
			}
			
			csvData = d3.csvParse(data);
			callback(null, _data);
		});
	},
	
	addRow: (params, callback) => { // "params" variable needed, even though unused
		if (!csvData || csvData.length == 0) {
			callback("CSV not read properly");
			return;
		}
		addRow();
		callback(null, _data); 
	},
	
	deleteRow: (params, callback) => {
		if (!csvData || csvData.length == 0) {
			callback("CSV not read properly");
			return;
		}
		deleteRow();
		callback(null, _data); 
	}
};

function addRow() { // Adds next row of data and returns the row letter
	var row = "";
	if (csvData && rowNum < csvData.length) {
		row = csvData[rowNum]["row"];
		while (rowNum < csvData.length) {
			if (csvData[rowNum]["row"] != row) { // New row, end here.
				break;
			}
			addToDataset(csvData[rowNum]["label"], csvData[rowNum]["value"], csvData[rowNum]["row"]);
			rowNum++;
		}
	}
	_data.row = row;
}

function deleteRow() { // Remove last row of data and returns the row letter or ""
	var row = "";
	if (csvData && rowNum >= 1 && rowNum <= csvData.length) {
		rowNum--;
		row = csvData[rowNum]["row"];
		while (rowNum >= 0) {
			if (csvData[rowNum]["row"] != row) { // New row, end here.
				row = csvData[rowNum]["row"];
				break;
			}
			addToDataset(csvData[rowNum]["label"], csvData[rowNum]["value"] * -1, csvData[rowNum]["row"]);
			rowNum--;
		}
		rowNum++;
	}
	_data.row = row;
}

function addToDataset(label, value, row) { // Add/remove instrument to dataset or increment proper category
	var instrumentId = 0; 
	var done = 0;
	for (var i = 0; i < _data.pie.length; i++) { // Add to pie data
		if (_data.pie[i]["label"] == label) {
			var newVal = parseInt(_data.pie[i]["value"]) + parseInt(value);
			_data.instruments += parseInt(value);
			if (newVal > 0) {
				_data.pie[i]["value"] = newVal;
			} else {
				_data.pie.splice(i, 1);
			}
			done = 1;
			break;
		}
		instrumentId++;
	}
	if (!done) { 
		_data.pie.push({"label": label, "value": value});
		_data.instruments += parseInt(value);
	}
	
	if (parseInt(value) > 0) { // Positive value: push instrument and rows
		var rowId = 0; // Get row number (A=1, B=2, etc.)
		if (_data.dot.length > 0) {
			 if (row == _data.dot[_data.dot.length-1]["row"]) { // same row
				rowId = _data.dot[_data.dot.length-1]["rowId"];
			 } else { // new row
				 rowId = _data.dot[_data.dot.length-1]["rowId"] + 1;
			 }
		}
		var colId = (_data.dot.length > 0 && row == _data.dot[_data.dot.length-1]["row"]) ? 
					(_data.dot[_data.dot.length-1]["colId"] + 1) : 0;
		for (var j = 0; j < value; j++) {
			_data.dot.push({"instrument": instrumentId, "row": row, "rowId": rowId, "colId": colId});
			colId++;
		}
	} else { // Negative value: pop out last instruments
		for (var j = 0; j > parseInt(value); j--) {
			_data.dot.pop();
		}
	}
}