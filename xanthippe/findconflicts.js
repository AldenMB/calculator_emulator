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
	return mantissa1.slice(0, 6) === mantissa2.slice(0, 6);
}

function ignore_paren_indicator(screen1, screen2){
	return screen1.slice(0, 73) === screen2.slice(0, 73) && screen1.slice(75) === screen2.slice(75);
}

function arrayEqual(a, b){
	return a.length === b.length && a.every((x, i) => x === b[i]);
}

function addToCache(sequence, screen){
	if(!cache.some( ([seq, scrn]) => (arrayEqual(seq, sequence)))
	){
		cache.push([sequence, screen]);
		fs.writeFileSync('./cache.json', JSON.stringify(cache, null, '  '));
	}
}

function updateCache(sequence, screen){
	cache.forEach(x => {
		if (arrayEqual(x[0], sequence)){
			x[1] = screen;
		}
	})
}

function startsWithConflict(sequence){
	return conflicts.some(seq => (seq.every((x, i) => x === sequence[i])));
}

async function* testCases(){
	console.log('Working through cache...');
	yield* cache;
	console.log('\nLoading new cases...');
	yield* iterDatabase();
}

const conflicts = [];
let successes = 0;
let skipped = 0;
const maxConflicts = 20;
const exclusions = ['Sigma+', '(', ')'];

console.log('searching...');
for await (const [sequence, screen] of testCases()){
	process.stdout.write(`${conflicts.length}/${successes}/${skipped}`);
	updateCache(sequence, screen);
	if(sequence.some(x => exclusions.includes(x)) || startsWithConflict(sequence)){
		++skipped;
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
		} else if (isRoundingError(computed, screen) ||	ignore_paren_indicator(computed, screen)) {
			++skipped;
		} else {
			conflicts.push(sequence);
			console.log('\n');
			console.log(sequence.join(' >> '));
			console.log('Computed:');
			console.log(computed);
			console.log('Measured:');
			console.log(screen);
			console.log('');
			
			addToCache(sequence, screen);
		}
		if (conflicts.length > maxConflicts){
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