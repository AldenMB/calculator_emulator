import {TI30Xa, array_equal} from '../modules/TI30Xa.js';
import {run_all_tests} from '../tests/test.js';
import {loadDatabase} from './fetch.js';

console.log(run_all_tests());

const db = await loadDatabase();

const discovered_conflicts = [];
let successes = 0;
for await(const [sequence, screen] of db){
	if(sequence
		.map((s, i) => sequence.slice(0, i+1))
		.some( x => discovered_conflicts.some(
				y => array_equal(x, y)
			)
		)
	){
		continue;
	}
	const c = TI30Xa();
	try{
		sequence.forEach(x => c.press(x));
		const computed = c.now().to_text_display();
		if(computed !== screen){
			discovered_conflicts.push(sequence);
			console.log(sequence);
			console.log('Computed:');
			console.log(computed);
			console.log('Actual:');
			console.log(screen);
			if(discovered_conflicts.length>=5){
				break;
			}
		} else {
			successes++;
		};
	} catch (error) {
		if (error.error !== 'not implemented'){
			throw error;
		}
	}
}
console.log('found '+successes+' matching cases');