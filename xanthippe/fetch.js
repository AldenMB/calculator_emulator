/* jshint esversion: 11 */

import https from "https";
import fs from "fs";
import zlib from "zlib";
import readline from "readline";
import { fileURLToPath } from "url";

function pipeStream(from, to) {
  return new Promise((resolve, reject) => {
    from.on("error", reject);
    to.on("error", reject);
    to.on("finish", resolve);
    from.pipe(to);
  });
}

async function downloadDatabase(){
	return https.get("https://home.aldenbradford.com:58086", async (res) => {
		console.log('statusCode:', res.statusCode);
		console.log('headers:', res.headers);
		await pipeStream(res, fs.createWriteStream('xanthippe.csv.gz'));
		console.log('Wrote latest Xanthippe table to xanthippe.csv.gz');
	});
}

async function* readSessions(){
	const reader = readline.createInterface({
	  input: fs.createReadStream('xanthippe.csv.gz').pipe(zlib.createGunzip()),
	});
	for await (const line of reader) {
		let [buttons, screen, requested] = line.split(',');
		buttons = buttons == '""' ? '' : buttons;
		screen = screen.slice(3, -2);
		requested = requested === '1';
		yield {buttons, screen, requested};
	}
}

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
};
Object.freeze(encoding);

const decoding = {
	'A': '+-',
	'B': '2nd',
	'C': '+',
	'D': '0',
	'E': '.',
	'F': 'SIN',
	'G': '1/x',
	'I': 'y^x',
	'J': 'HYP',
	'K': '-',
	'L': '1',
	'M': '5',
	'N': 'COS',
	'O': 'x^2',
	'Q': 'OFF',
	'R': 'pi',
	'S': 'X',
	'T': '2',
	'U': '6',
	'V': 'TAN',
	'W': 'sqrt',
	'Z': 'Sigma+',
	'a': '/',
	'b': '3',
	'c': '7',
	'd': 'DRG',
	'e': 'EE',
	'h': 'STO',
	'i': '=',
	'j': '4',
	'k': '8',
	'l': 'LOG',
	'm': '(',
	'p': 'RCL',
	'q': 'ab/c',
	'r': '<-',
	's': '9',
	't': 'LN',
	'u': ')',
	'4': 'ON/C'
};
Object.freeze(decoding);

async function* iterDatabase(){
	for await (const {buttons, screen} of readSessions()){
		if (screen.length == 28){
			const presses = buttons.split('').map(x => decoding[x]);
			yield [presses, toText(screen)];
		}
	}
}

async function loadDatabase(){
	const data = new Map();
	for await (const {buttons, screen, requested} of readSessions()){
		data.set(buttons, screen);
	}
	
	function get(presses){
		const buttons = presses.map(p => encoding[p]).join('');
		if (data.has(buttons)){
			return toText(data.get(buttons));
		} else {
			throw new Error('Xanthippe has not recorded the sequence');
		}
	}
	
	function* iter(){
		for (const [buttons, screen] of [...data].sort((x, y) => x[0].length - y[0].length)){
			if (screen.length<28){
				continue;
			}
			const presses = buttons.split('').map(c => decoding[c]);
			yield [presses, toText(screen)];
		}
	}
	
	const retval = {get};
	retval[Symbol.iterator] = iter;
	return retval;
}

function sevenseg(bits){
	return Object.fromEntries(
		'DP C B A D E G F'
		.split(' ')
		.map((x, i) => [x, bits[i]])
	);
}

const symboltable = {
	0b0000000: " ",
	0b1100000: "1",
	0b0111110: "2",
	0b1111010: "3",
	0b1100011: "4",
	0b1011011: "5",
	0b1011111: "6",
	0b1110001: "7",
	0b1111111: "8",
	0b1111011: "9",
	0b1111101: "0",
	0b0011111: "E",
	0b0000110: "r",
	0b1001110: "o",
	0b0001111: "t",
	0b1110111: "A",
	0b0001000: "_",
	0b0001010: "=",
	0b1001000: "/",
	0b0100001: '"',
	0b0000001: "'",
	0b1000110: "n",
	0b0000010: "-",
};

function letterOf(b){
	return symboltable[b & 0x7f] + ((b & 0x80) ? '.' : ' ');
}

function toText(screen){
	const bytes = screen.match(/.{1,2}/g).map(x => (
		parseInt(x, 16)
	));
	const bits = bytes.map( x =>
		x.toString(2)
		.padStart(8, '0')
		.split("")
		.map(b => Boolean(parseInt(b)))
	);
	
	let e2g, g10;
	
	const s = {};
	[	s.STAT,
		s.DE,
		s.G,
		s.FIX,
		s.R,
		s.X,
		s.RAD,
		e2g
	] = bits[0];
	const exponent = bits.slice(1, 3).map(sevenseg);
	s.K = exponent[0].DP;
	s["()"] = exponent[1].DP;
	const mantissa = bits.slice(3, 13).map(sevenseg);
	[	s.M3,
		g10,
		s.M2,
		s.M1,
		s['2nd'],
		s.HYP,
		s.ENG,
		s.SCI
	] = bits[13];
	
	const row1 = ("M1,M2,M3,2nd,HYP,SCI,ENG,FIX,STAT,DE,G,RAD,X,R,(),K"
		.split(',')
		.map( x => (s[x.trim()] ? x	: ' '.repeat(x.length)) )
		.join('')
	);
	const row2 = (
		(g10 ? '- ' : '  ') +
		bytes.slice(3, 13).map(letterOf).reverse().join('') +
		(e2g ? '-' : '').padStart(12) +
		bytes.slice(1, 3).map(letterOf).map(x => x[0]).reverse().join('')
	);
	const string = row1 + '\n' + row2;
	
	s.mantissa = mantissa;
	s.exponent = exponent;
	
	return boxify(string, 36);
}

function boxify(str, length){
	const header = '┌' + '─'.repeat(length) + '┐\n│';
	const body = str.split('\n').join('│\n│');
	const footer = '│\n└' + '─'.repeat(length) + '┘';
	return header + body + footer;
}


if (process.argv[1] === fileURLToPath(import.meta.url)) {
	console.log("Fetching the latest copy of the database...");
    await downloadDatabase();
}

export {loadDatabase, iterDatabase};