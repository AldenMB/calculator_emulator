/* jshint esversion: 11 */

import {TI30Xa} from '../modules/TI30Xa.js';
import {run_all_tests} from '../tests/test.js';
import {createInterface} from 'readline';

console.log(run_all_tests());

const readline = createInterface({
	input: process.stdin,
	output: process.stdout
});


readline.on("close", () => {console.log('\n'); process.exit(0);});

const c = TI30Xa();

function main(input){
	console.log(JSON.stringify(input));
	if(input){
		c.press(input);
	}
	console.log(c.now().to_text_display());
	
	readline.question('type a button name>', main);
}

main();