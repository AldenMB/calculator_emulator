import https from "https";
import fs from "fs";
import zlib from "zlib";
import readline from "readline";

function pipeStream(from, to) {
  return new Promise((resolve, reject) => {
    from.on("error", reject);
    to.on("error", reject);
    to.on("finish", resolve);
    from.pipe(to);
  });
}

async function refreshDatabase(){
	return https.get("https://home.aldenbradford.com:58086", async (res) => {
		console.log('statusCode:', res.statusCode);
		console.log('headers:', res.headers);
		await pipeStream(res, fs.createWriteStream('xanthippe.csv.gz'));
		console.log('Wrote latest Xanthippe table to xanthippe.csv.gz');
	});
};

function treeAppend(root, name, data){
	if (name === ''){
		root.data = data;
	} else {
		const crumb = name[0];
		const tail = name.slice(1);
		root[crumb] = root[crumb] || {};
		treeAppend(root[crumb], tail, data);
	}
};

function* treeUnravel(root, prefix=''){
	const {data, ...children} = root;
	if (Object.keys(children).length == 0){
		yield [prefix, data];
	} else {
		for (const [crumb, child] of Object.entries(children)){
			yield* treeUnravel(child, prefix+crumb);
		}
	}
};

async function fetch(){
	const root = {};
	const reader = readline.createInterface({
	  input: fs.createReadStream('xanthippe.csv.gz').pipe(zlib.createGunzip()),
	});
	for await (const line of reader) {
		let [buttons, screen, requested] = line.split(',');
		buttons = buttons == '""' ? '' : buttons;
		screen = screen.slice(3, -2);
		requested = requested === '1';
		if(typeof screen === 'undefined'){
			console.log(line);
		}
		treeAppend(root, buttons, {screen, requested});
	}
	return root;
};

function sevenseg(bits){
	return Object.fromEntries(
		'DP C B A D E G F'
		.split(' ')
		.map((x, i) => [x, bits[i]])
	);
};

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
}

function letterOf(b){
	return symboltable[b & 0x7f] + ((b & 0x80) ? '.' : ' ');
};

function decode(screen){
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
	] = bits[13]
	
	const row1 = ("M1|M2|M3|2nd|HYP|SCI|ENG|FIX|STAT|DE|G|RAD|X|R|()|K"
		.split('|')
		.map( x => (
			s[x.trim()] 
			?
			x
			:
			' '.repeat(x.length)
		))
		.join('')
	);
	const row2 = (
		(g10 ? '-' : ' ')
		+ bytes.slice(3, 13).map(letterOf).reverse().join('')
		+ (e2g ? ' -' : '  ')
		+ bytes.slice(1, 3).map(letterOf).map(x => x[0]).reverse().join('')
	);
	const string = row1 + '\n' + row2;
	
	s.mantissa = mantissa;
	s.exponent = exponent;
	
	return {segments: s, string};
};


console.log(decode('f'.repeat(28)).string);
const tree = await fetch();
console.log(decode(tree.t.data.screen).string);

export {fetch, refreshDatabase, treeUnravel};