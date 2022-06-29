import {TI30Xa, array_equal, BINARY_OPS} from '../modules/TI30Xa.js';

function close(a, b){
	// this formula shamelessly stolen from numpy.allclose:
	// https://numpy.org/doc/stable/reference/generated/numpy.allclose.html
	return Math.abs(a-b) <= 1E-8 + 1E-5 * Math.abs(b);
}

function run_test(test){
	const {sequence, check, name='anonymous'} = test;
	const calculator = TI30Xa();
	let success, reason;
	try {
		sequence.split(' ').forEach(calculator.press);
		({success, reason} = check(calculator));
	} catch(error) {
		success = false;
		reason = `error ${JSON.stringify(error)} arose during test`;
	}
	return {success, reason, test, calculator};
}

function entry_is(entry){
	function are_equal(calc){
		const actual_entry = calc.now().entry;
		const success = actual_entry === entry;
		const reason = `expected entry ${JSON.stringify(entry)}, but found ${JSON.stringify(actual_entry)}`;
		return {success, reason};
	}		
	return are_equal;
};

function stack_is(stack){
	function are_equal(calc){
		const actual_stack = calc.now().stack;
		const success = array_equal(stack, actual_stack);
		const reason = `expected stack ${JSON.stringify(stack)}, but got ${JSON.stringify(actual_stack)}`;
		return {success, reason};
	}
	return are_equal;
};

function number_on_stack_is(number){
	function are_equal(calc){
		const actual_number = calc.now().top_number();
		const success = close(actual_number, number);
		const reason = `expected number ${JSON.stringify(number)}, but got ${JSON.stringify(actual_number)}`;
		return {success, reason};
	};
	return are_equal;
};

function is_error(calc){
	const success = calc.now().error;
	const reason = 'expected to be in an error state';
	return {success, reason};
};

function is_not_error(calc){
	const success = !calc.now().error;
	const reason = 'expected not to be in an error state';
	return {success, reason};
};

function display_is(str){
	function displayed_matches(calc){
		const actual_display = calc.now().shown_number();
		const success = actual_display === str;
		const reason = `expected display string ${JSON.stringify(str)}, but got ${JSON.stringify(actual_display)}`;
		return {success, reason};
	}
	return displayed_matches;
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
},{
	name: "trig functions reject large numbers",
	sequence: "ON/C 1 EE 1 0 SIN",
	check: is_error,
},{
	name: "trig functions accept not-too-large numbers",
	sequence: "ON/C 9 . 9 EE 9 SIN",
	check: is_not_error,
},{
	name: "trig functions reject large numbers in radians",
	sequence: "ON/C DRG 1 . 7 5 EE 8 SIN",
	check: is_error,
},{
	name: "trig functions accept not-too-large numbers in radians",
	sequence: "ON/C DRG 1 . 7 4 EE 8 SIN",
	check: is_not_error,
},{
	name: "plus triggers division on stack",
	sequence: "ON/C 1 0 0 / 2 y^x 2 +",
	check: number_on_stack_is(25),
},{
	name: "recover stored number",
	sequence: "ON/C 5 STO 1 ON/C RCL 1",
	check: display_is("5."),
},{
	name: "recover number from slot 2",
	sequence: "ON/C 5 STO 2 ON/C RCL 2",
	check: display_is("5."),
},{
	name: "recover number from slot 3",
	sequence: "ON/C 5 STO 3 ON/C RCL 3",
	check: display_is("5."),
},{
	name: "there is no memory slot 4",
	sequence: "ON/C 5 STO 4 ON/C RCL 4",
	check: display_is("4"),
},{
	name: "memory can be overwritten",
	sequence: "ON/C 7 STO 1 8 STO 1 ON/C RCL 1",
	check: display_is("8."),
},{
	name: "memory starts with a zero",
	sequence: "ON/C 5 RCL 1",
	check: display_is("0."),
},{
	name: "store puts and entry onto the stack",
	sequence: "ON/C 4 STO",
	check: display_is("4."),
},{
	name: "store is dropped unless used",
	sequence: "ON/C 6 STO 4 1",
	check: display_is("41"),
},{
	name: "second does not overwrite store",
	sequence: "ON/C 5 STO 2nd 2nd 1 ON/C RCL 1",
	check: display_is("5."),
},{
	name: "recall overrides store",
	sequence: "ON/C 5 STO 1 6 STO RCL 1",
	check: display_is("5."),
},{
	name: "basic usage of SUM",
	sequence: "ON/C 6 STO 1 8 2nd RCL 1 RCL 1",
	check: display_is("14."),
},{
	name: "exchange retrieves value",
	sequence: "ON/C 4 STO 1 5 2nd STO 1",
	check: display_is("4."),
},{
	name: "exchange stores value",
	sequence: "ON/C 4 STO 1 5 2nd STO 1 RCL 1",
	check: display_is("5."),
},{
	name: "storing does not clear hyperbolic mode",
	sequence: "ON/C 9 0 STO HYP 1 TAN", 
	check: display_is("1."),
},{
	name: "tangent 90 gives error",
	sequence: "ON/C 9 0 TAN",
	check: is_error,
},{
	name: "cosine 90 gives 0",
	sequence: "ON/C 9 0 COS 2nd 3",
	check: display_is("1."),
},{
	name: "cosine rounds near zero",
	sequence: "ON/C 2 EE +- 5 COS 2nd 3",
	check: is_not_error,
},{
	name: "cosine does not round far from zero",
	sequence: "ON/C 3 EE +- 5 COS 2nd 3",
	check: is_error,
}
]);


//// floating point representation tests
/*
	name: "ternary fractions not represented exactly",
	sequence: "ON/C 1 / 3 * 3 = 2nd 3",
	check: is_error,
},{
	name: "decimal fractions represented exactly",
	sequence: "ON/C 1 / 5 * 5 = 2nd 3",
	check: is_not_error,
},{
	name: "eleven rounding error",
	sequence: "ON/C 1 1 / 2 y^x 2 0 + 1 - 1 = * 2 y^x 2 0 - 1 1 =",
	check: number_on_stack_is(0.000_000_02),
},{ 
*/

function run_all_tests(verbose=false){
	const failures = (TESTS
		.map(test => run_test(test))
		.filter(result => !result.success)
	);
	const message = `passed ${TESTS.length - failures.length} tests, failed ${failures.length}.`
	return {message, failures};
};

export {run_all_tests};