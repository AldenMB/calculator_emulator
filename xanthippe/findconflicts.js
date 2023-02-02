import {TI30Xa, array_equal} from '../modules/TI30Xa.js';
import {run_all_tests} from '../tests/test.js';
import {loadDatabase, iterDatabase} from './fetch.js';

console.log(run_all_tests().message);

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
let skipped = 0;
const maxConflicts = 8;
const exclusions = [];
const calc = calcTree();


console.log('searching...');
for await (const [sequence, screen] of iterDatabase()){
	process.stdout.write(`${conflicts}\t${successes}\t${skipped}\r`);
	if(sequence.some(x => exclusions.includes(x))){
		skipped += 1;
		continue;
	}
	try {
		process.stdout.write(
			`${conflicts}\t/${successes}\t/${skipped}\t  >>>\t${sequence.map(x => x.toString().padEnd(6, ' ')).join(' >> ')}\r`
		);
		const computed = calc.get(sequence);
		if(computed === screen){
			successes++;
		} else {
			conflicts++;
			console.log('')
			console.log(sequence.join(' >> '));
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
		skipped += 1;
		if (error.error !== 'not implemented'){
			throw error;
		}
	}
}

console.log(`Found ${successes} successes before ${maxConflicts} conflicts were discovered, skipping ${skipped}.`);