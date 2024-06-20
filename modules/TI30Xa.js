/* jshint esversion: 11 */

import {BUTTON_LABELS, SECOND_LABELS} from "./button_parse.js";
import {Decimal} from "./decimal.mjs";
import {Fraction} from "./fraction.js";

Decimal.set({
	precision: 14, 
	rounding: Decimal.ROUND_HALF_UP,
	minE: -99,
	maxE: 99,
	toExpNeg: -10,
	toExpPos: 10,
	modulo: Decimal.ROUND_FLOOR,
});

Fraction.setDecimal(Decimal);

function boxify(str, length){
	const header = '┌' + '─'.repeat(length) + '┐\n│';
	const body = str.split('\n').join('│\n│');
	const footer = '│\n└' + '─'.repeat(length) + '┘';
	return header + body + footer;
}

const BINARY_OPS = Object.freeze({
	times: '*',
	divide: '/',
	plus: '+',
	minus: '-',
	power: '^',
	root: '\u221A',
	permute: 'P',
	combine: 'C',
});

const ANGLE_MODES = Object.freeze({
	degrees: 'DEG',
	radians: 'RAD',
	grads: 'GRAD',
});

const MEMORY_KEYS = Object.freeze({
	store: 'STO',
	recall: 'RCL',
	exchange: 'EXC',
	sum: 'SUM',
});

const FORMAT_MODES = Object.freeze({
	scientific: 'SCI',
	engineering: 'ENG',
	floating: 'FLO',
});

function array_equal(arr1, arr2){
	return arr1.every((elt, i) => elt === arr2[i]);
}

function factorial(x){
	if(x.isZero()){
		return ONE;
	}
	if(x.isNegative() || !x.isInteger()){
		return NAN;
	}
	if(x.greaterThan(69)){
		return NAN;
	}
	return x.times(factorial(x.minus(1)));
}

// even bernoulli numbers B2,B4,B6,...
const BERNOULLI = [  
	1.66666667e-01, -3.33333333e-02,  2.38095238e-02, -3.33333333e-02,
	7.57575758e-02, -2.53113553e-01,  1.16666667e+00, -7.09215686e+00,
];

function loggamma(z){
	// formula 6.1.40 of Handbook of Mathematical Functions
	z = z.toNumber();
	return (
		(z-1/2)*Math.log(z) -
		z +
		1/2*Math.log(2*Math.PI) +
		BERNOULLI.map( (B, n) => (
			B/(2*(n+1)*(2*n+1)*z**(2*n+1))
		)).reduce((x, a) => (x+a), 0)
	);
}

function permutation(n, r){
	n = n.isZero() ? ZERO : n;
	r = r.isZero() ? ZERO : r;
	if(r.isNegative() || n.isNegative() || !r.isInteger() || !n.isInteger()){
		return NAN;
	}
	if(r.greaterThan(n)){
		return ZERO;
	}
	if(r.lessThan(100)){
		return (
			[...Array(r.toNumber()).keys()]
			.map(x => n.plus(x+1).minus(r))
			.reduce(((x,y) => x.times(y)), ONE)
		);
	}
	return Decimal.exp(loggamma(n.plus(1)) - loggamma(r.plus(1)));
}

function combination(n, r){
	n = n.isZero() ? ZERO : n;
	r = r.isZero() ? ZERO : r;
	if(r.isNegative() || n.isNegative() || !r.isInteger() || !n.isInteger()){
		return NAN;
	}
	if(r.greaterThan(n)){
		return ZERO;
	}
	if(r.times(2).greaterThan(n)){
		r = n.minus(r);
	}
	if(n.lessThan(100) || r.lessThan(20)){
		return permutation(n, r).dividedBy(factorial(r));
	} else {
		return  Decimal.exp(loggamma(n.plus(1)) - loggamma(r.plus(1)) - loggamma(n.minus(r).plus(1)));
	}
}

const PreciseDecimal = Decimal.clone({precision:100});
const PreciseConversionFactor = PreciseDecimal.acos(-1).dividedBy(180);
const PreciseONE = new PreciseDecimal(1);

function cos_degrees(x){
	return new Decimal(PreciseConversionFactor.times(x).cos().toPrecision(Decimal.precision));
}

function sin_degrees(x){
	return new Decimal(PreciseConversionFactor.times(x).sin().toPrecision(Decimal.precision));
}

function tan_degrees(x){
	return new Decimal(PreciseConversionFactor.times(x).tan().toPrecision(Decimal.precision));
}

function cosh(x){
	return x.exp().plus(x.negated().exp()).dividedBy(2);
}

function sinh(x){
	return x.exp().minus(x.negated().exp()).dividedBy(2);
}

function tanh(x){
	if(x.abs().greaterThan('15.3133766947412446')){
		// atanh(1-1e-13)
		return ONE.times(x.s);
	}
	const y = x.times(2).negated().exp();
	return ONE.minus(y).dividedBy(ONE.plus(y));
}

function atan(x){
	if(x.absoluteValue().greaterThan(Decimal.acos(0).tangent().absoluteValue())){
		return Decimal.acos(0).times(x.s);
	}
	return Decimal.atan(x);
}

function second_map(label){
	const index = BUTTON_LABELS.flat().indexOf(label);
	if(index === -1){
		return label;
	}
	return SECOND_LABELS.flat()[index];
}

function hyperbolic_map(label){
	if(["SIN","COS","TAN"].includes(label.slice(-3))){
		return label+'H';
	}
	return label;
}

function apply_binary_op(a, op, b){
	if(a.isInteger() && b.isFraction?.() && '+-*/'.includes(op)){
		return b.rightApplyOp(op, a);
	}
	switch(op){
		case BINARY_OPS.plus:
			return a.plus(b);
		case BINARY_OPS.minus:
			if( a.toPrecision(Decimal.precision-1) ==
				b.toPrecision(Decimal.precision-1)
			){
				return ZERO;
			}
			return a.minus(b);
		case BINARY_OPS.times:
			return a.times(b);
		case BINARY_OPS.divide:
			return a.dividedBy(b);
		case BINARY_OPS.power:
			if (a.isZero() && b.isZero()){
				return NAN;
			}
			if (a.isNegative() &&
				ONE.dividedBy(b).isInteger() &&
				ONE.dividedBy(b).minus(1).dividedBy(2).isInteger()
			){
				return a.negated().toPower(b).negated();
			}
			return a.toPower(b);
		case BINARY_OPS.root:
			if (a.isZero() && b.isZero()){
				return NAN;
			}
			return a.toPower(ONE.dividedBy(b));
		case BINARY_OPS.permute:
			return permutation(a, b);
		case BINARY_OPS.combine:
			return combination(a, b);
	}
}

function binary_op_precedence(op){
	switch(op){
		case BINARY_OPS.plus:
			return 0;
		case BINARY_OPS.minus:
			return 0;
		case BINARY_OPS.times:
			return 1;
		case BINARY_OPS.divide:
			return 1;
		case BINARY_OPS.power:
			return 2;
		case BINARY_OPS.root:
			return 2;
		case BINARY_OPS.permute:
			return 3;
		case BINARY_OPS.combine:
			return 3;
	}
}

function is_binary_op(op){
	return Object.values(BINARY_OPS).includes(op);
}

const ZERO = new Decimal(0);
const ONE = new Decimal(1);
const PI = Decimal.acos(-1);
const TEN = new Decimal(10);
const NAN = new Decimal(NaN);

const DEFAULT_STATE = Object.freeze({
	stack: Object.freeze([ZERO]),
	entry: '',
	memory: Object.freeze([ZERO, ZERO, ZERO]),
	memorymode: '',
	error: false,
	second: false,
	hyperbolic: false,
	anglemode: ANGLE_MODES.degrees,
	formatmode: FORMAT_MODES.floating,
	fixprecision: -1,
	fixing: false,
	statregister: false, // placeholder for printing
	on: true,
	improperfraction: false,
});

function TI30Xa_state(changes){
	// This produces an immutable object. Its methods should all produce
	// new objects of the same type. Other modules should only need
	// the push_button method or to_text_display.
	
	const public_methods = {
		push_button,
		child,
		to_text_display,
		shown_number,
		ensure_empty_entry,
		to_html,
		reduce_binary_op,
		top_number,
		pop_binary_op,
		stack_push,
		push_number,
		catch_errors,
		equals,
		close_paren,
		from_radians,
		from_degrees,
		drg,
	};
	
	const state = Object.assign({}, DEFAULT_STATE, changes, public_methods);
	state.stack = Object.freeze([...state.stack]);
	state.memory = Object.freeze([...state.memory]);	
	return Object.freeze(state);
	
	////////////////////////////////
		
	function child(changes){
		return TI30Xa_state(Object.assign({}, state, changes));
	}
	
	function to_text_display(){
		// produce an output like the following:
		// ┌────────────────────────────────────┐
		// │M1M2M32ndHYPSCIENGFIXSTATDEGRADXR()K│
		// │- 8.8.8.8.8.8.8.8.8.8.           -88│
		// └────────────────────────────────────┘
		
		if (!state.on){
			return boxify(' '.repeat(36)+'\n' +' '.repeat(36), 36);
		}
		
		const memory = ('M1,M2,M3'
			.split(',')
			.map( (x, i) => state.memory[i].isZero()? '  ' : x)
			.join('')
		);
		const second = state.second? '2nd' : '   ';
		const hyp = state.hyperbolic? 'HYP' : '   ';
		const format = {
			[FORMAT_MODES.scientific]:  'SCI   ',
			[FORMAT_MODES.engineering]: '   ENG',
			[FORMAT_MODES.floating]:    '      ',
		}[state.formatmode];
		const fix = state.fixprecision === -1? '   ' : 'FIX';
		const stat = state.statregister? 'STAT' : '    ';
		const angle = {
			[ANGLE_MODES.degrees] : 'DEG   ',
			[ANGLE_MODES.radians] : '   RAD',
			[ANGLE_MODES.grads]   : '  GRAD',
		}[state.anglemode];
		const xr = false? 'XR': '  '; //placeholder
		const parens = state.stack.includes('(') ? '()' : '  ';
		const konstant = false? 'K' : ' ';
		const topline = [memory, second, hyp, format, fix, stat, angle, xr, parens, konstant, '\n'].join('');
		
		if( state.error ){
			return boxify(topline + 'E r r o r'.padStart(17, ' ').padEnd(36, ' '), 36);
		}
		
		const [mantissa, exponent] = shown_number().split('e');
		const dp_idx = 10 - mantissa.split('').reverse().indexOf('.');
		const digits = mantissa.replace('.', '').padStart(11, ' ');
		const interlaced = (digits
			.split('')
			.map((x, i) => x+(i===dp_idx ? '.' : ' '))
			.join('')
		);
		return boxify(topline + interlaced + (exponent || '').replace('+', ' ').padStart(14, ' '), 36);
	}
	
	function shown_number(){
		if(!state.on){
			return 'blank';
		}
		if(state.error){
			return 'Error';
		}
		if(state.entry){
			return state.entry;
		}
		let number = top_number();
		
		if(!Decimal.isDecimal(number)){
			console.log('no Decimal on the stack: ',JSON.stringify(state.stack));
			return 'BADDECIMAL';
		}
		if(number.isFraction?.()){
			if(state.improperfraction){
				return number.toStringImproper();
			} else {
				return number.toStringMixed();
			}
		}
		
		let s = '';
		switch(state.formatmode){
			case FORMAT_MODES.floating:
				s = number.toSignificantDigits(10).toString();
				if(s.slice(0,2) === '0.' || s.slice(0,3) === '-0.'){
					s = number.toFixed(9);
					if(s.includes('.')){
						while(s.slice(-1) === '0'){
							s = s.slice(0, -1);
						}
					}
				}
				break;
			case FORMAT_MODES.engineering:
				let exponent = new Decimal(number.e)
				let shift = exponent.mod(3)
				let new_exponent = new Decimal(10).pow(exponent-shift);
				let mantissa = number
					.div(new_exponent)
					.toSignificantDigits(10)
					.toString();
				s = mantissa + 'e' + (new_exponent.toExponential(0).split('e')[1]);
				break;
			case FORMAT_MODES.scientific:
				s = number.toExponential(number.sd() < 9 ? number.sd()-1 : 9);
				if(s[0] === '0'){
					s = '0.' + s.slice(1);
				}
				let [m, e] = s.split('e');
				if(number.sd() !== 11){
					while(m.slice(-1) === '0'){
						m = m.slice(0, -1);
					}
				}
				s = m + 'e' + e;
				break;
		}
		
		//exponent should always have two digits
		if(s.includes('e')){
			let [m, e] = s.split('e');
			if(e.length<3){
				s = m + 'e' + e[0] + '0' + e[1];
			}
		}
		
		//decimal.js does not always include a trailing '.', but TI30Xa does
		if(!s.includes('.')){
			let [m, e] = s.split('e');
			e = e ? 'e' + e : '';
			s = m +'.' + e;
		}
		return s;
	}
	
	function to_html(){
		return (
			'displayed: ' + JSON.stringify(shown_number())+'<br/>'+
			Object.keys(DEFAULT_STATE)
			.map(key => `${key}: ${JSON.stringify(state[key])}`)
			.join("<br/>")
		);
	}
	
	function enter_digit(digit){
		if (state.memorymode!=='' && ['1', '2', '3'].includes(digit)){
			return apply_memory_function(digit);
		}
		if(state.fixing){
			return apply_fix_precision(digit);
		}
		let {entry} = state;
		if(entry.includes('e')){
			return enter_exponent(digit);
		}
		if(entry.replace('.','').replace('-','').length >= 10){
			return state;
		}
		if(entry.slice(-4)[0] === '/'){
			return state;
		}
		entry += digit;
		if( entry[0] === '0' && entry.length > 1 && entry[1] !== '.'){
			entry = entry.slice(1);
		}
		if( entry.slice(0,2) === '-0' && entry.length > 2 && entry[2] !== '.'){
			entry = '-' + entry.slice(2);
		}
		return state.child({entry});
	}
	
	function enter_exponent(digit){
		const {entry:previous} = state;
		let [mantissa, exponent] = previous.split('e');
		exponent += digit;
		if(exponent.length > 3 && exponent.includes('-')){
			exponent = '-'+exponent.slice(-2);
		}
		if(exponent.length > 2 && !exponent.includes('-')){
			exponent = exponent.slice(-2);
		}
		const entry = mantissa+'e'+exponent;
		return state.child({entry});
	}
	
	function begin_exponent(){
		let {entry} = state;
		if(entry.includes('e') || entry === '' || entry.includes('/')){
			return state;
		}
		entry = entry + 'e00';
		return state.child({entry});
	}
	
	function enter_decimal(){
		if(state.fixing){
			return apply_fix_precision('.');
		}
		let {entry} = state;
		if(entry.includes('e') || entry.includes('.') || entry.includes('/')){
			return state;
		}
		if(entry === ''){
			entry = '0';
		}
		entry = entry + '.';
		return state.child({entry});
	}
	
	function enter_fraction(){
		const {entry} = state;
		if(entry === '' || entry.includes('.') || entry.includes('e') || entry.includes('_') || entry === '0' || entry === '-0'){
			return state;
		}
		if(entry.includes('/')){
			const [a, b] = entry.split('/');
			if(a.length > 3 || b.length === 0){
				return state;
			}
			return child({entry: a + '_' + b + '/'});
		}
		if(entry.replace('-', '').length > 6){
			return state;
		}
		return child({entry: entry + '/'});
	}
	
	function backspace(){
		let {entry} = state;
		if(entry === '' || entry.includes('e')){
			return state;
		}
		if((entry.length === 2 && entry[0] === '-') || entry.length === 1){
			entry = '0';
			return state.child({entry});
		}
		entry = entry.slice(0, -1);
		if (entry === '-0'){
			entry = '0';
		}
		if(entry.includes('_') && !entry.includes('/')){
			entry = entry.replace('_', '/');
		}
		return state.child({entry});
	}
	
	function sign_flip(){
		let {entry} = state;
		if(entry){
			if(entry.includes('e')){
				let [mantissa, exponent] = entry.split('e');
				if(exponent[0] === '-'){
					exponent = exponent.slice(1);
				} else {
					exponent = '-' + exponent;
				}
				entry = mantissa+'e'+exponent;
			} else {
				entry = '-' + entry;
				if(entry[1] === '-'){
					entry = entry.slice(2);
				}
			}
			return state.child({entry});
		} else {
			return push_number(top_number().negated());
		}
	}
	
	function equals(){
		let newstate = state;
		while(newstate.stack.includes('(')){
			newstate = newstate.close_paren();
		}
		return (
			newstate
			.ensure_empty_entry()
			.pop_binary_op()
			.reduce_binary_op()
			.catch_errors()
		);
	}
	
	function ensure_empty_entry(){
		const {entry} = state;
		if(entry){			
			const x = (
				entry.includes('/') ?
				Fraction.fromString(entry) :
				new Decimal(entry)
			);
			return push_number(x).child({entry:''}).catch_errors();
		}
		return state;
	}
	
	function top_number(){
		return (state
			.stack
			.filter(Decimal.isDecimal)
			.slice(-1)[0]
		);
	}
	
	function push_number(number){
		const stack = [...state.stack];
		const top = stack.slice(-1)[0];
		if(Decimal.isDecimal(top)){
			stack.pop();
		}
		stack.push(number);
		return child({stack});
	}
	
	function on(){
		if (state.entry === ''){
			return child({on:true, stack:[ZERO], error:false});
		} else {
			return child({entry:''}).push_number(ZERO);
		}
	}
	
	function off(){
		//TODO: clear statistical register
		return child({
			on:false,
			entry:'',
			anglemode:ANGLE_MODES.degrees,
			formatmode: FORMAT_MODES.floating,
			fixprecision: -1,
			});
	}
	
	////////////////////////////////
	
	function push_button(label){
		if(state.second){
			label = second_map(label);
		}
		if(state.hyperbolic){
			label = hyperbolic_map(label);
		}
		if(!state.on && label !== 'ON/C'){
			return state;
		}
		if(state.error && !['ON/C', 'OFF'].includes(label)){
			return state;
		}
		let next_state = state;
		switch(label){
			// mode change
			case '2nd':
				next_state = toggle_second();
				break;
			case "HYP":
				next_state = toggle_hyp();
				break;
			case "SCI":
				next_state = child({formatmode:FORMAT_MODES.scientific});
				break;
			case "ENG":
				next_state = child({formatmode:FORMAT_MODES.engineering});
				break;
			case "FLO":
				next_state = child({formatmode:FORMAT_MODES.floating});
				break;
			case "FIX":
				next_state = child({fixing:true});
				break;
			//case "K":
			case "ON/C":
				next_state = on();
				break;
			case "OFF":
				next_state = off();
				break;
			case "DRG":
				next_state = drg();
				break;
			case "DRG>":
				next_state = drg_convert();
				break;
			
			// number entry
			
			case "0":
			case "1":
			case "2":
			case "3":
			case "4":
			case "5":
			case "6":
			case "7":
			case "8":
			case "9":
				next_state = enter_digit(label);
				break;
			case ".":
				next_state = enter_decimal();
				break;
			case "EE":
				next_state = begin_exponent();
				break;
			case "<-":
				next_state = backspace();
				break;
			case "+-":
				next_state = sign_flip();
				break;
			case "=":
				next_state = equals();
				break;
			case "(":
				next_state = open_paren();
				break;
			case ")":
				next_state = close_paren();
				break;
			
			// constant
			case "pi":
				next_state = child({entry:''}).push_number(PI);
				break;
			
			// single variable functions
			
			case "1/x":
				next_state = apply_pure_function(x => ONE.dividedBy(x));
				break;
			case "10^x":
				next_state = apply_pure_function(x => TEN.toPower(x));
				break;
			case "3ROOTx":
				next_state = apply_pure_function(x => Decimal.cbrt(x));
				break;
			case "LN":
				next_state = apply_pure_function(x => x.naturalLogarithm());
				break;
			case "LOG":
				next_state = apply_pure_function(x => Decimal.log10(x));
				break;
			case "SIN":
				next_state = apply_pure_function(sin);
				break;
			case "COS":
				next_state = apply_pure_function(cos);
				break;
			case "TAN":
				next_state = apply_pure_function(tan);
				break;
			case "ASIN":
				next_state = apply_pure_function(x => from_radians(PreciseDecimal.asin(x)));
				break;
			case "ACOS":
				next_state = apply_pure_function(x => from_radians(PreciseDecimal.acos(x)));
				break;
			case "ATAN":
				next_state = apply_pure_function(x => from_radians(atan(x)));
				break;
			case "SINH":
				next_state = apply_pure_function(sinh);
				break;
			case "COSH":
				next_state = apply_pure_function(cosh);
				break;
			case "TANH":
				next_state = apply_pure_function(tanh);
				break;
			case "ASINH":
				next_state = apply_pure_function(x => Decimal.asinh(x));
				break;
			case "ACOSH":
				next_state = apply_pure_function(x => Decimal.acosh(x));
				break;
			case "ATANH":
				next_state = apply_pure_function(x => Decimal.atanh(x));
				break;
			case "x^2":
				next_state = apply_pure_function(x => x.toPower(2));
				break;
			case "x^3":
				next_state = apply_pure_function(x => x.toPower(3));
				break;
			case "sqrt":
				next_state = apply_pure_function(x => Decimal.sqrt(x));
				break;
			case "x!":
				next_state = apply_pure_function(factorial);
				break;
			case "e^x":
				next_state = apply_pure_function(x => Decimal.exp(x));
				break;
			
			// one-and-a-half variable function:
			
			case "%":
				next_state = percent();
				break;
			
			// two variable functions
			
			case "/":
				next_state = put_binary_op(BINARY_OPS.divide);
				break;
			case "+":
				next_state = put_binary_op(BINARY_OPS.plus);
				break;
			case "*":
				next_state = put_binary_op(BINARY_OPS.times);
				break;
			case "-":
				next_state = put_binary_op(BINARY_OPS.minus);
				break;
			case "y^x":
				next_state = put_binary_op(BINARY_OPS.power);
				break;
			case "xROOTy":
				next_state = put_binary_op(BINARY_OPS.root);
				break;
			case "nCr":
				next_state = put_binary_op(BINARY_OPS.combine);
				break;
			case "nPr":
				next_state = put_binary_op(BINARY_OPS.permute);
				break;
			
			// statistical functions
			
			//case "CSR":
			//case "FRQ":
			//case "SIG+":
			//case "SIG-":
			//case "SIGx":
			//case "SIGx^2":
			//case "n":
			//case "sigxn":
			//case "sigxn-1":
			//case "xbar":
			
			// memory
			
			case "EXC":
			case "RCL":
			case "STO":
			case "SUM":
				next_state = ensure_empty_entry().child({memorymode: label});
				break;
			
			// angles
			
			//case "DD>DMS":
			//case "DMS>DD":
			//case "P>R":
			//case "R>P":
			//case "x<>y":
			
			// fractions
			
			case "ab/c":
				next_state = enter_fraction();
				break;
			case "d/c":
				next_state = toggle_improper();
				break;
			case "F<>D":
				next_state = convert_fraction_decimal();
				break;
			
			default:
				throw {
					error: 'not implemented',
					button: label,
				};
		}
		if(!['2nd', 'HYP'].includes(label)){
			next_state = next_state.child({second:false});
			if(!(['1', '2', '3'].includes(label) && state.memorymode !== '')){
				next_state = next_state.child({hyperbolic:false});
			}
			if(!Object.values(MEMORY_KEYS).includes(label)){
				next_state = next_state.child({memorymode: ''});
			}
			if(label !== 'd/c'){
				next_state = next_state.child({improperfraction: false});
			}
		}
		return next_state;
	}
	
	////////////////////////////////
	
	function toggle_second(){
		const second = !state.second;
		return child({second});
	}
	
	function toggle_hyp(){
		const hyperbolic = !state.hyperbolic;
		return child({hyperbolic});
	}
	
	function toggle_improper(){
		const improperfraction = (
			state.entry.includes('/') && !state.entry.includes('_') ?
			false :
			!state.improperfraction
		);
		const nextstate = state.ensure_empty_entry();
		return (nextstate
			.push_number(nextstate.top_number())
			.child({improperfraction})
		);
	}
	
	function pop_binary_op(){
		const stack = [...state.stack];
		if(is_binary_op(stack.slice(-1)[0])){
			stack.pop();
			return child({stack});
		} else {
			return state;
		}
	}
	
	function stack_push(...x){
		const stack = [...state.stack];
		stack.push(...x);
		return child({stack});
	}
	
	function put_binary_op(op){
		return (
			ensure_empty_entry()
			.pop_binary_op()
			.stack_push(op)
			.reduce_binary_op()
			.catch_errors()
		);
	}
	
	function reduce_binary_op(){
		if(state.stack.length < 3){
			return state;
		}
		
		// this block handles the case where we must defer computation
		// out of respect for the order of operations.
		if(state.stack.length >= 4){
			const [a, op1, b, op2] = state.stack.slice(-4);
			if(
				Decimal.isDecimal(a) &&
				Decimal.isDecimal(b) &&
				is_binary_op(op1) &&
				is_binary_op(op2)
			){
				if(binary_op_precedence(op1) >= binary_op_precedence(op2)){
					const stack = state.stack.slice(0,-4);
					stack.push(apply_binary_op(a, op1, b), op2);
					return child({stack}).catch_errors().reduce_binary_op();
				} else {
					return state;
				}	
			}
		}
		
		// this block handles the typical case of having to simply
		// reduce the leading portion.
		const [a, op, b] = state.stack.slice(-3);
		if(is_binary_op(op)){
			const stack = state.stack.slice(0,-3);
			stack.push(apply_binary_op(a, op, b));
			return child({stack}).catch_errors().reduce_binary_op();
		} else {
			return state;
		}		
	}
	
	function percent(){
		let newstate = ensure_empty_entry();
		let x = newstate.top_number().dividedBy(100);
		if(!Decimal.isDecimal(newstate.stack.slice(-1)[0])){
			newstate = newstate.push_number(ZERO);
			// doesn't matter what number we add, it will get overwritten
			// it just makes it easier to keep track of indices
		}
		if(
			[BINARY_OPS.plus, BINARY_OPS.minus]
			.includes(newstate.stack.slice(-2)[0])
		){
			x = x.times(newstate.stack.slice(-3)[0]);
		}
		return newstate.push_number(x);
	}
		
	function apply_pure_function(func){
		const newstate = ensure_empty_entry();
		const result = func(newstate.top_number());
		return newstate.push_number(result).catch_errors();
	}
	
	function to_radians(angle){
		switch(state.anglemode){
			case ANGLE_MODES.radians:
				return angle;
			case ANGLE_MODES.degrees:
				return angle.times(PI).dividedBy(180);
			case ANGLE_MODES.grads:
				return angle.times(PI).dividedBy(200);
		}
	}
	
	function to_degrees(angle){
		switch(state.anglemode){
			case ANGLE_MODES.radians:
				return angle.times(180).dividedBy(PI);
			case ANGLE_MODES.degrees:
				return angle;
			case ANGLE_MODES.grads:
				return angle.times(180).dividedBy(200);
		}
	}
	
	function from_radians(angle){
		return angle.dividedBy(to_radians(PreciseONE)).toSignificantDigits(14);
	}
	
	function from_degrees(angle){
		return angle.dividedBy(to_degrees(ONE));
	}
	
	function cos(angle){
		angle = trig_overflow_protect(angle);
		const degree = to_degrees(angle);
		
		
		if(degree.modulo(180).minus(90).absoluteValue().lessThan(1e-10)){
			return ZERO;
		}
		if(degree.plus(90).modulo(360).minus(90).absoluteValue().lessThan(3e-5)){
			return ONE;
		}
		if(degree.minus(90).modulo(360).minus(90).absoluteValue().lessThan(1e-12)){
			return ONE.negated();
		}
		
		if(state.anglemode === ANGLE_MODES.radians){
			return Decimal.cos(angle);
		}
		
		return cos_degrees(degree);
	}
	
	function sin(angle){
		angle = trig_overflow_protect(angle);
		const degree = to_degrees(angle);
		
		if(degree
			.plus(90)
			.modulo(180)
			.minus(90)
			.absoluteValue()
			.lessThan(1e-12) &&
			degree.absoluteValue().greaterThan(1)
		){
			return ZERO;
		}
		if(degree.modulo(360).minus(90).absoluteValue().lessThan(1e-12)){
			return ONE;
		}
		if(degree.modulo(360).minus(270).absoluteValue().lessThan(1e-12)){
			return ONE.negated();
		}
		
		if(state.anglemode === ANGLE_MODES.radians){
			return Decimal.sin(angle);
		}
		return sin_degrees(degree);	
	}
	
	function tan(angle){
		angle = trig_overflow_protect(angle);
		const degree = to_degrees(angle);
		
		if(degree
			.plus(90)
			.modulo(180)
			.minus(90)
			.absoluteValue()
			.lessThan(1e-12) &&
			degree.absoluteValue().greaterThan(1)
		){
			return ZERO;
		}
		if(degree
			.modulo(180)
			.minus(90)
			.absoluteValue()
			.lessThan(1e-10)
		){
			return NAN;
		}
		
		if(state.anglemode === ANGLE_MODES.radians){
			return Decimal.tan(angle);
		}
		
		return tan_degrees(degree);
	}
	
	function drg(){
		if(state.error){
			return state;
		}
		const modes = Object.values(ANGLE_MODES);
		const anglemode = modes[
			(modes.indexOf(state.anglemode)+1) % modes.length
		];
		return child({anglemode});
	}
	
	function drg_convert(){
		const oldstate = state.ensure_empty_entry();
		const angle = to_degrees(oldstate.top_number());
		const newstate = oldstate.drg();
		return newstate.push_number(newstate.from_degrees(angle));
	}
	
	function open_paren(){
		const stack = [...ensure_empty_entry().stack];
		stack.push('(', ZERO);
		return ensure_empty_entry().child({stack});
	}
	
	function close_paren(){
		if(!state.stack.includes('(')){
			return equals();
		}
		const next_state = ensure_empty_entry();
		const stack = [...next_state.stack];
		const lastparen = stack.lastIndexOf('(');		
		const substate = next_state.child({stack:stack.slice(lastparen+1)}).equals();
		
		return substate.child({stack:stack.slice(0, lastparen)}).push_number(substate.top_number());
	}
	
	function catch_errors(){
		let stack = [...state.stack];
		const infinite = stack.filter(Decimal.isDecimal).some(x => !x.isFinite());
		const error = (state.error || infinite);
		if(error){
			stack = [ZERO];
		}
		return child({error, stack});
	}
	
	function trig_overflow_protect(x){
		if(to_degrees(x).absoluteValue().greaterThanOrEqualTo(1e10)){
			return NAN;
		}
		return x;
	}
	
	function apply_memory_function(digit){
		const place = Number(digit) - 1;
		const memorymode = '';
		const memory = [...state.memory];
		switch(state.memorymode){
			case MEMORY_KEYS.store:
				memory[place] = top_number();
				return child({memorymode, memory});
			case MEMORY_KEYS.recall:
				return push_number(memory[place]).child({memorymode});
			case MEMORY_KEYS.exchange:
				const entry = memory[place];
				memory[place] = top_number();
				return push_number(entry).child({memorymode, memory});
			case MEMORY_KEYS.sum:
				memory[place] = memory[place].plus(top_number());
				return child({memorymode, memory});
		}
	}
	
	function apply_fix_precision(digit){
		if(digit === '.'){
			return child({fixprecision:-1, fixing:false});
		}
		return child({fixprecision:Number(digit), fixing:false});
	}
	
	function convert_fraction_decimal(){
		const newstate = state.ensure_empty_entry();
		if(!Decimal.isDecimal(state.stack.slice(-1)[0])){
			return newstate;
		}
		const num = newstate.top_number();
		if(num.isFraction?.()){
			return newstate.push_number(num.toDecimal());
		}
		return newstate.push_number(Fraction.fromDecimal(num));
	}
}

function TI30Xa(){
	const history = [TI30Xa_state()];
	const command_log = [];
	//for debugging purposes:
	//document.my_history = history;
	
	return {history, command_log, now, press, undo, to_html, current_html};
	
	function now(){
		return history.slice(-1)[0];
	}
	
	function press(keyname){
		command_log.push(keyname);
		history.push(now().push_button(keyname));
	}
	
	function undo(){
		if(history.length > 1){
			history.pop();
			command_log.pop();
		}
	}
	
	function to_html(){
		return (history
			.map(state => state.to_html())
			.join("<br/><br/>")
		);
	}
	
	function current_html(){
		return now().to_html();
	}
}


export {TI30Xa, array_equal, BINARY_OPS};