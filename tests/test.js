import {TI30Xa, array_equal, BINARY_OPS} from '../modules/TI30Xa.js';

function close(a, b){
	// this formula shamelessly stolen from numpy.allclose:
	// https://numpy.org/doc/stable/reference/generated/numpy.allclose.html
	return Math.abs(a-b) <= 1E-8 + 1E-5 * Math.abs(b);
}

function test_case(test, verbose){
	const {sequence, check, name='anonymous'} = test;
	const calculator = TI30Xa();
	sequence.split(' ').forEach(calculator.press);
	if(check(calculator)){
		if(verbose){
		console.log(`passed test ${name}`);
		};
	} else {
		console.log(`TEST ${name} FAILED`);
		console.log(test);
		console.log(calculator);
	};
}

function entry_is(entry){
	function are_equal(calc){
		const actual_entry = calc.now().entry;
		const success = actual_entry === entry;
		if(!success){
			console.log(
			`expected entry ${JSON.stringify(entry)}, but found ${JSON.stringify(actual_entry)}:`
			);
		};
		return success;
	}		
	return are_equal;
};

function stack_is(stack){
	function are_equal(calc){
		const actual_stack = calc.now().stack;
		const success = array_equal(stack, actual_stack);
		if(!success){
			console.log(
			`expected stack ${JSON.stringify(stack)}, but got ${JSON.stringify(actual_stack)}:`
			);
		};
		return success;
	}
	return are_equal;
};

function number_on_stack_is(number){
	function are_equal(calc){
		const actual_number = calc.now().top_number();
		const success = close(actual_number, number);
		if(!success){
			console.log(
			`expected number ${JSON.stringify(number)}, but got ${JSON.stringify(actual_number)}:`
			);
		};
		return success;
	};
	return are_equal;
};

function is_error(calc){
	const success = calc.now().error;
	if(!success){
		console.log('expected to be in an error state:');
	};
	return success;
};

function is_not_error(calc){
	const success = !calc.now().error;
	if(!success){
		console.log('expected not to be in an error state:');
	};
	return success;
};

function display_is(str){
	function displayed_matches(calc){
		const actual_display = calc.now().shown_number();
		const success = actual_display === str;
		if(!success){
			console.log(`expected display string ${JSON.stringify(str)}, but got ${JSON.stringify(actual_display)}`);
		}
		return success
	}
	return displayed_matches
};

const TESTS = Object.freeze([
{
	name: "enter simple digits",
	sequence: "ON/C 5 7 3",
	check: entry_is('573'),
},{
	name: "reject leading zeros",
	sequence: "ON/C 0 0 4 5",
	check: entry_is('45'),
},{
	name: "reject repeat zeros",
	sequence: "ON/C 0 0 0 0",
	check: entry_is('0'),
},{
	name: "reject extra characters",
	sequence: "ON/C 1 2 3 4 5 6 7 8 9 0 1 2 3",
	check: entry_is("1234567890"),
},{
	name: "allow leading - sign",
	sequence: "ON/C 1 +- 2 3 4 5 6 7 8 9 0",
	check: entry_is("-1234567890"),
},{
	name: "enter inside decimal",
	sequence: "ON/C 4 1 2 2 . 4 3",
	check: entry_is('4122.43'),
},{
	name: "initial decimal point",
	sequence: "ON/C . 4 5 6",
	check: entry_is('0.456'),
},{
	name: "reject extra decimals",
	sequence: "ON/C 5 . 4 . 3 . 2",
	check: entry_is('5.432'),
},{
	name: "simple exponent entry",
	sequence: "ON/C 5 EE 2 7",
	check: entry_is("5e27"),
},{
	name: "two digit exponent",
	sequence: "ON/C 1 EE",
	check: entry_is("1e00"),
},{
	name: "exponent entry shifting",
	sequence: "ON/C 2 7 EE 1 2 3 4 5 6 7",
	check: entry_is("27e67"),
},{
	name: "basic backspacing",
	sequence: "ON/C 1 2 3 4 5 <- <-",
	check: entry_is("123"),
},{
	name: "backspace places zeros",
	sequence: "ON/C 1 2 <- <-",
	check: entry_is('0'),
},{
	name: "backspace removes negatives",
	sequence: "ON/C 1 2 +- <- <-",
	check: entry_is("0"),
},{
	name: "backspace rejects exponent",
	sequence: "ON/C 1 2 EE 1 4 <-",
	check: entry_is("12e14"),
},{
	name: "basic sign flip",
	sequence: "ON/C 1 2 3 +-",
	check: entry_is("-123"),
},{
	name: "empty sign flip",
	sequence: "ON/C +-",
	check: number_on_stack_is(0),
},{
	name: "flip entry sign back",
	sequence: "ON/C 1 2 3 +- +-",
	check: entry_is("123"),
},{
	name: "negative exponent",
	sequence: "ON/C 1 2 3 EE +-",
	check: entry_is("123e-00"),
},{
	name: "flip stack sign",
	sequence: "ON/C 1 2 3 = +-",
	check: number_on_stack_is(-123),
},{
	name: "dig through stack for sign flip",
	sequence: "ON/C 1 + +-",
	check: number_on_stack_is(-1),
},{
	name: "simple addition",
	sequence: "ON/C 2 + 3 =",
	check: number_on_stack_is(5),
},{
	name: "repeated addition",
	sequence: "ON/C 2 + 3 + 5 =",
	check: number_on_stack_is(10),
},{
	name: "mixed operations",
	sequence: "ON/C 2 + 5 - 1 2 + 1 =",
	check: number_on_stack_is(-4),
},{
	name: "multiplication comes before addition",
	sequence: "ON/C 2 + 2 / 2 =",
	check: number_on_stack_is(3),
},{
	name: "arcsin",
	sequence: "ON/C . 5 2nd SIN",
	check: number_on_stack_is(30),
},{
	name: "divide by zero",
	sequence: "ON/C 1 / 0 =",
	check: is_error,
},{
	name: "cosh",
	sequence: "ON/C 1 HYP COS",
	check: number_on_stack_is(Math.cosh(1)),
},{
	name: "multiply percent",
	sequence: "ON/C 5 0 0 %",
	check: number_on_stack_is(5),
},{
	name: "adding percent",
	sequence: "ON/C 2 5 + 1 6 %",
	check: number_on_stack_is(4),
},{
	name: "add on percent",
	sequence:  "ON/C 2 5 + 1 6 % =",
	check: number_on_stack_is(29),
},{
	name: "permutations simple",
	sequence: "ON/C 9 2nd 9 3 =",
	check: number_on_stack_is(504),
},{
	name: "combinations simple",
	sequence: "ON/C 1 2 2nd 8 4 =",
	check: number_on_stack_is(495),
},{
	name: "combinatorials precede multiplication",
	sequence: "ON/C 2 * 5 2nd 8 3 =",
	check: number_on_stack_is(20),
},{
	name: "exponents precede division",
	sequence: "ON/C 2 0 0 / 2 y^x 3 =",
	check: number_on_stack_is(25),
},{
	name: "combinatorials precede exponents",
	sequence: "ON/C 2 y^x 4 2nd 9 2 =",
	check: number_on_stack_is(4096),
},{
	name: "equal precedence evaluates immediately",
	sequence: "ON/C 6 / 2 / 3 =",
	check: number_on_stack_is(1),
},{
	name: "short percent imputation",
	sequence: "ON/C 2 0 + % =",
	check: number_on_stack_is(24),
},{
	name: "log of negative",
	sequence: "ON/C 1 +- LN",
	check: is_error,
},{
	name: "reciprocal of zero",
	sequence: "ON/C 1/x",
	check: is_error,
},{
	name: "errors removed with ON/C",
	sequence: "ON/C 1/x ON/C",
	check: is_not_error,
},{
	name: "parentheses card example partial",
	sequence: "ON/C 5 y^x ( 1 . 8 3 + 3 )",
	check: number_on_stack_is(4.83),
},{
	name: "parentheses card example complete",
	sequence: "ON/C 5 y^x ( 1 . 8 3 + 3 ) =",
	check: number_on_stack_is(2376.977774),
},{
	name: "radians mode sine",
	sequence: "ON/C pi / 2 = DRG SIN",
	check: number_on_stack_is(1),
},{
	name: "reject repeat openparens",
	sequence: "ON/C ( (",
	check: stack_is(['(', 0]),
},{
	name: "nested parentheses partial resolution",
	sequence: "ON/C 5 * ( 7 - ( 2 + 3 )",
	check: stack_is([5, '*', '(', 7, '-', 5]),
},{
	name: "nested parentheses full resolution",
	sequence: "ON/C 5 * ( 7 - ( 2 + 3 =",
	check: stack_is([10]),
},{
	name: "parentheses places a zero",
	sequence: "ON/C 1 + (",
	check: stack_is([1,'+','(',0]),
},{
	name: "power",
	sequence: "ON/C 2 y^x 1 0 =",
	check: stack_is([1024]),
},{
	name: "deep nested parentheses",
	sequence: "ON/C 8 nCr ( 8 1 xROOTy ( 1 0 0 / ( 1 6 + 9 =",
	check: stack_is([56]),
},{
	name: "deep order of operations",
	sequence: "ON/C 1 EE 7 - 7 * 3 y^x 4 2nd 9 2 =",
	check: stack_is([6279913]),
},{
	name: "close parenthesis behaves like equals",
	sequence: "ON/C 3 + 2 )",
	check: stack_is([5]),
},{
	name: "overflow",
	sequence: "ON/C 1 EE 9 9 * 1 0 =",
	check: is_error,
},{
	name: "rounding and truncation",
	sequence: "ON/C 4 5 6 sqrt",
	check: display_is("21.3541565"),
},{
	name: "underflow entry achieves true zero",
	sequence: "ON/C . 1 EE 9 9 +- LN",
	check: is_error,
},{
	name: "underflow computed achieves true zero",
	sequence: "ON/C 1 EE 9 9 +- / 1 0 = LN",
	check: is_error,
},{
	name: "combinatorials reject floats",
	sequence: "ON/C 7 1/x nCr 2 =",
	check: is_error,
},{
	name: "combinatorials accept near integers",
	sequence: "ON/C 1 EE 1 4 +- + 5 = nPr 2 =",
	check: is_not_error,
},{
	name: "combinatorials reject near floats",
	sequence: "ON/C 1 EE 1 3 +- + 5 = nPr 2 =",
	check: is_error,
},{
	name: "decimals show when numbers entered",
	sequence: "ON/C 5 =",
	check: display_is("5."),
}
]);

function run_all_tests(verbose=false){
	TESTS.forEach(test => test_case(test, verbose));
};

export {run_all_tests};