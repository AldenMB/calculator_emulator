import {BUTTON_LABELS} from './button_parse.js';

const encoding = {
  "+-": "A",
  "2nd": "B",
  "+": "C",
  "0": "D",
  ".": "E",
  "SIN": "F",
  "1/x": "G",
  "y^x": "I",
  "HYP": "J",
  "-": "K",
  "1": "L",
  "5": "M",
  "COS": "N",
  "x^2": "O",
  "OFF": "Q",
  "pi": "R",
  "X": "S",
  "2": "T",
  "6": "U",
  "TAN": "V",
  "sqrt": "W",
  "Sigma+": "Z",
  "/": "a",
  "3": "b",
  "7": "c",
  "DRG": "d",
  "EE": "e",
  "STO": "h",
  "=": "i",
  "4": "j",
  "8": "k",
  "LOG": "l",
  "(": "m",
  "RCL": "p",
  "ab/c": "q",
  "<-": "r",
  "9": "s",
  "LN": "t",
  ")": "u",
  "ON/C": "4"
}
Object.freeze(encoding);

function add_child(node, s){
	if(s.length>0){
		const letter = s[0];
		node[letter] = node[letter] || {};
		add_child(node[letter], s.slice(1));
	}
};

function* unravel(node, prefix = ''){
	if(Object.keys(node).length === 0){
		yield prefix;
	} else {
		for(const [letter, child] of Object.entries(node)){
			yield* unravel(child, prefix+letter);
		}
	}
};

function Log(url){
	const records = {};
	
	function include(calculator){
		add_child(records, 
			calculator
			.command_log
			.map(label => encoding[label])
			.join('')
		);
	};
	
	document.addEventListener("visibilitychange", function() {
		if (document.visibilityState === 'hidden') {
			const message = [...unravel(records)].join(',')
			if(message.length > 1){
				navigator.sendBeacon(url, message);
			}
		}
	});
	
	return {include};
};

export {Log};