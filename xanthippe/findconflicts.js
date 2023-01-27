import {TI30Xa, array_equal} from '../modules/TI30Xa.js';
import {run_all_tests} from '../tests/test.js';
import {loadDatabase, iterDatabase} from './fetch.js';

console.log(run_all_tests());

function calcTree(state = TI30Xa().now()){
	const cache = new Map();
	const screen = state.to_text_display();
	
	function get(presses){
		if (presses.length === 0){
			return screen;
		} else {
			const p = presses[0];
			if(!cache.has(p)){
				cache.set(p, calcTree(state.push_button(p)));
			}
			return cache.get(p).get(presses.slice(1));
		}
	};
	
	return {get};
};

let conflicts = 0;
let successes = 0;
const maxConflicts = 8;
const exclusions = ['SIN', 'COS', 'TAN'];
const calc = calcTree();


console.log('searching...');
for await (const [sequence, screen] of iterDatabase()){
	if(sequence.some(x => exclusions.includes(x))){
		continue;
	}
	try {
		process.stdout.write(`${successes}\r`);
		const computed = calc.get(sequence);
		if(computed === screen){
			successes++;
		} else {
			conflicts++;
			console.log(sequence.join(' -> '));
			console.log('Computed:');
			console.log(computed);
			console.log('Measured:');
			console.log(screen);
			console.log('');
		}
		if (conflicts > maxConflicts){
			break;
		}
	} catch(error) {
		if (error.error !== 'not implemented'){
			throw error;
		}
	}
}

console.log(`Found ${successes} successes before ${maxConflicts} conflicts were discovered`);