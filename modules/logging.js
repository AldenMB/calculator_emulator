import {BUTTON_LABELS} from './button_parse.js';

const encoding = {};
BUTTON_LABELS.forEach((row, i) => {
	row.forEach((label, j) => {
		encoding[label] = (
			i < 4
			?
			String.fromCharCode(4*i + j + 'A'.charCodeAt())
			:
			String.fromCharCode(4*(i-4) + j + 'a'.charCodeAt())
		);
	});
});
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