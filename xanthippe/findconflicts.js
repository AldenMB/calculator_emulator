/* jshint esversion: 11 */

import {TI30Xa, array_equal} from '../modules/TI30Xa.js';
import {run_all_tests} from '../tests/test.js';
import {loadDatabase, iterDatabase} from './fetch.js';
import fs from 'fs';

const cache = JSON.parse(fs.readFileSync('./cache.json'));

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

function ignore_paren_indicator(screen1, screen2){
	return screen1.slice(0, 73) === screen2.slice(0, 73) && screen1.slice(75) === screen2.slice(75);
}

function addToCache(sequence, screen){
	if( !cache.some( testcase => (
		testcase[0].length === sequence.length && 
		testcase[0].every((x, i) => x === sequence[i])
		))
	){
		cache.push([sequence, screen]);
		fs.writeFileSync('./cache.json', JSON.stringify(cache, null, '  '));
	}
}

async function* testCases(){
	console.log('Working through cache...');
	yield* cache;
	console.log('\nLoading new cases...');
	yield* iterDatabase();
}

let conflicts = 0;
let successes = 0;
let skipped = 0;
const maxConflicts = 10;
const exclusions = ['Sigma+'];

console.log('searching...');
for await (const [sequence, screen] of testCases()){
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
		} else if (isRoundingError(computed, screen) || ignore_paren_indicator(computed, screen)) {
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
			
			addToCache(sequence, screen);
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