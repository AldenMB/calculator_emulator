/* jshint esversion: 11 */

import {TI30Xa, array_equal} from '../modules/TI30Xa.js';
import {run_all_tests} from '../tests/test.js';
import {loadDatabase, iterDatabase} from './fetch.js';

console.log(run_all_tests().message);

function isRoundingError(screen1, screen2){
	if(screen1.slice(0, 79) !== screen2.slice(0, 79) ||
		screen1.slice(101) !== screen2.slice(101)
	){
		return false;
	}
	const mantissa1 = screen1.slice(79, 101).replaceAll(' ', '');
	const mantissa2 = screen2.slice(79, 101).replaceAll(' ', '');
	return mantissa1.slice(0, 8) === mantissa2.slice(0, 8);
}

let conflicts = 0;
let successes = 0;
let skipped = 0;
const maxConflicts = 10;
const exclusions = ['ab/c', 'Sigma+'];

console.log('searching...');
for await (const [sequence, screen] of iterDatabase()){
	process.stdout.write(`${conflicts}/${successes}/${skipped}`);
	if(sequence.some(x => exclusions.includes(x))){
		skipped += 1;
		process.stdout.write('\r');
		continue;
	}
	try {
		process.stdout.write(
			`  >>>[${sequence.map(x => x.toString().padEnd(4, ' ')).join(']>[')}]`.slice(0, 80)+'\r'
		);
		const calc = TI30Xa();
		sequence.forEach(x => calc.press(x));
		const computed = calc.now().to_text_display();
		if(computed === screen){
			successes++;
		} else if (isRoundingError(computed, screen)) {
			++skipped;
		} else {
			conflicts++;
			console.log('\n');
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