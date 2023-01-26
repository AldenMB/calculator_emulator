import {BUTTON_LABELS, SECOND_LABELS} from "./button_parse.js";

function boxify(str, length){
	const header = '┌' + '─'.repeat(length) + '┐\n│';
	const body = str.split('\n').join('│\n│');
	const footer = '│\n└' + '─'.repeat(length) + '┘';
	return header + body + footer;
};

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
};

function normalize_errors(num){
	if([Infinity, -Infinity, null, undefined].includes(num)){
		return NaN;
	};
	return num;
};

function mod(n, d){
	return ((n%d)+d)%d;
};

function floating_epsilon(x){
	const nearby = parseFloat(x.toPrecision(12));
	return Math.abs(nearby-x);
};

function clear_trailing_zeros(str){
	while(str.slice(-1) === '0'){
		str = str.slice(0, -1);
	}
	return str;
};

function is_integer(number){
	const remainder = mod(number, 1);
	return remainder <= 1e-14*number;
};

function factorial(x){
	if(x<0){
		return NaN;
	};
	if(!is_integer(x)){
		return NaN;
	};
	if(x === 0){
		return 1;
	};
	if(x > 69){
		return NaN;
	};
	return x * factorial(x-1);
};

// even bernoulli numbers B2,B4,B6,...
const BERNOULLI = [  
	1.66666667e-01, -3.33333333e-02,  2.38095238e-02, -3.33333333e-02,
	7.57575758e-02, -2.53113553e-01,  1.16666667e+00, -7.09215686e+00,
];

function loggamma(z){
	// formula 6.1.40 of Handbook of Mathematical Functions
	return (
		(z-1/2)*Math.log(z) 
		- z
		+1/2*Math.log(2*Math.PI)
		+BERNOULLI.map( (B, n) => (
			B/(2*(n+1)*(2*n+1)*z**(2*n+1))
		)).reduce((x, a) => (x+a), 0)
	);
};

function permutation(n, r){
	if(r < 0 || n < 0 || !is_integer(r) || !is_integer(n)){
		return NaN;
	};
	if(r > n){
		return 0;
	};
	if(n < 50){
		return (
			[...Array(r).keys()]
			.map(x => x + n - r + 1)
			.reduce(((x,y) => x*y), 1)
		);
	}
	return Math.exp(loggamma(n+1) - loggamma(r+1));

};

function combination(n, r){
	if(r < 0 || n < 0 || !is_integer(r) || !is_integer(n)){
		return NaN;
	};
	if(r > n){
		return 0;
	};
	if(r > n/2){
		r = n - r;
	};
	if(n<50){
		return permutation(n, r) / factorial(r);
	} else {
		return  Math.exp(loggamma(n+1) - loggamma(r+1) - loggamma(n-r+1));
	}
	
};

function second_map(label){
	const index = BUTTON_LABELS.flat().indexOf(label);
	if(index === -1){
		return label;
	};
	return SECOND_LABELS.flat()[index];
}

function hyperbolic_map(label){
	if(["SIN","COS","TAN"].includes(label.slice(-3))){
		return label+'H';
	}
	return label;
}

function apply_binary_op(a, op, b){
	switch(op){
		case BINARY_OPS.plus:
			return a+b;
		case BINARY_OPS.minus:
			return a-b;
		case BINARY_OPS.times:
			return a*b;
		case BINARY_OPS.divide:
			return a/b;
		case BINARY_OPS.power:
			if (a === 0 && b === 0){
				return NaN;
			}
			return a**b;
		case BINARY_OPS.root:
			if (a === 0 && b === 0){
				return NaN;
			}
			return a**(1/b);
		case BINARY_OPS.permute:
			return permutation(a, b);
		case BINARY_OPS.combine:
			return combination(a, b);
	};
};

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
	};
};

function is_binary_op(op){
	return Object.values(BINARY_OPS).includes(op);
};

const DEFAULT_STATE = Object.freeze({
	stack: Object.freeze([0]),
	entry: '',
	memory: Object.freeze([0, 0, 0]),
	memorymode: '',
	error: false,
	second: false,
	hyperbolic: false,
	anglemode: ANGLE_MODES.degrees,
	formatmode: FORMAT_MODES.floating,
	fixprecision: -1,
	statregister: false, // placeholder for printing
	on: true,
});

function TI30Xa_state(changes){
	// This produces an immutable object. Its methods should all produce
	// new objects of the same type. Other modules should only need
	// the push_button method or to_text_display.
	
	const public_methods = {
		push_button,
		child,
		to_text_display,
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
		drg,
	};
	
	const state = Object.assign({}, DEFAULT_STATE, changes, public_methods);
	state.stack = Object.freeze([...state.stack]);
	state.memory = Object.freeze([...state.memory]);	
	return Object.freeze(state);
	
	////////////////////////////////
		
	function child(changes){
		return TI30Xa_state(Object.assign({}, state, changes));
	};
	
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
			.map( (x, i) => state.memory[i] === 0? '  ' : x)
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
		return boxify(topline + interlaced + (exponent || '').padStart(14, ' '), 36);
	};
	
	function shown_number(){
		if(!state.on){
			return 'blank';
		};
		if(state.error){
			return 'Error';
		};
		if(state.entry){
			return state.entry;
		}
		let number = top_number();
		// TODO: handle floating and scientific formats, confirm against tests
		const negative = number < 0 ? '-' : '';
		number = Math.abs(number);
		if(number < 1e-99){
			return '0.'
		}
		const exponent = Math.floor(Math.log10(number));
		const scientific = (number < 0.00_000_000_1) || (number > 9_999_999_999);
		if(scientific){
			const mantissa = number * 10**(-exponent);
			const mantissa_str = clear_trailing_zeros(mantissa.toFixed(9));
			const exponent_str = (exponent<0? '-':' ') + Math.abs(exponent).toString().padStart(2, '0');
			return negative + mantissa_str + 'e' + exponent_str;
		}
		if(!String(number).includes('.')  && !String(number).includes('e')){
			return negative+String(number)+'.';
		}
		const precision = (exponent>0) ? 9-exponent : 9;
		return negative + clear_trailing_zeros(number.toFixed(precision)) + (precision === 0? '.' : '');
	};
	
	function to_html(){
		return (
			'displayed: ' + JSON.stringify(shown_number())+'<br/>'+
			Object.keys(DEFAULT_STATE)
			.map(key => `${key}: ${JSON.stringify(state[key])}`)
			.join("<br/>")
		);
	};
	
	function enter_digit(digit){
		if (state.memorymode!=='' && ['1', '2', '3'].includes(digit)){
			return apply_memory_function(digit);
		}
		let {entry} = state;
		if(entry.includes('e')){
			return enter_exponent(digit);
		}
		if(entry.split('e')[0].replace('.','').replace('-','').length >= 10){
			return state;
		}
		entry += digit;
		if( entry[0] === '0' && entry.length > 1 && entry[1] !== '.'){
			entry = entry.slice(1);
		};
		if( entry.slice(0,2) === '-0' && entry.length > 2 && entry[2] !== '.'){
			entry = '-' + entry.slice(2);
		};
		return state.child({entry});
	};
	
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
	};
	
	function begin_exponent(){
		let {entry} = state;
		if(entry.includes('e') || entry === ''){
			return state;
		};
		entry = entry + 'e00';
		return state.child({entry});
	};
	
	function enter_decimal(){
		let {entry} = state;
		if(entry.includes('e') || entry.includes('.')){
			return state;
		};
		if(entry === ''){
			entry = '0';
		};
		entry = entry + '.';
		return state.child({entry});
	};
	
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
			return push_number(-top_number());
		};
	};
	
	function equals(){
		let newstate = state;
		while(newstate.stack.includes('(')){
			newstate = newstate.close_paren();
		};
		return (
			newstate
			.ensure_empty_entry()
			.pop_binary_op()
			.reduce_binary_op()
			.catch_errors()
		);
	};
	
	function ensure_empty_entry(){
		const {entry} = state;
		if(entry){
			return push_number(Number(entry)).child({entry:''});
		};
		return state;
	};
	
	function top_number(){
		return (state
			.stack
			.filter(x => typeof(x) === 'number')
			.slice(-1)[0]
		);
	};
	
	function top_op(){
		return (state
			.stack
			.filter(x => x in BINARY_OPS)
			.slice(-1)[0]
		);
	};
	
	function push_number(number){
		const stack = [...state.stack];
		const top = stack.slice(-1)[0];
		if(typeof(top) === 'number'){
			stack.pop();
		};
		if(Math.abs(number) < 1e-99){
			number = 0;
		}
		stack.push(number);
		return child({stack});
	};
	
	function on(){
		if (state.entry === '' || !state.on){
			return child({on:true, stack:[0], error:false});
		} else {
			return child({entry:''}).push_number(0);
		}			
	};
	
	function off(){
		//TODO: clear statistical register
		return child({on:false, entry:'', anglemode:ANGLE_MODES.degrees});
	};
	
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
		};
		if(state.error && !['ON/C', 'OFF'].includes(label)){
			return state;
		};
		let next_state = state;
		switch(label){
			// mode change
			case '2nd':
				next_state = toggle_second();
				break;
			case "HYP":
				next_state = toggle_hyp();
				break;
			//case "SCI":
			//case "ENG":
			//case "FLO":
			//case "FIX":
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
				next_state = child({entry:''}).push_number(Math.PI);
				break;
			
			// single variable functions
			
			case "1/x":
				next_state = apply_pure_function(x => 1/x);
				break;
			case "10^x":
				next_state = apply_pure_function(x => 10**x);
				break;
			case "3ROOTx":
				next_state = apply_pure_function(x => Math.sign(x)*Math.abs(x)**(1/3));
				break;
			case "LN":
				next_state = apply_pure_function(Math.log);
				break;
			case "LOG":
				next_state = apply_pure_function(Math.log10);
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
				next_state = apply_pure_function(x => from_radians(Math.asin(x)));
				break;
			case "ACOS":
				next_state = apply_pure_function(x => from_radians(Math.acos(x)));
				break;
			case "ATAN":
				next_state = apply_pure_function(x => from_radians(Math.atan(x)));
				break;
			case "SINH":
				next_state = apply_pure_function(Math.sinh);
				break;
			case "COSH":
				next_state = apply_pure_function(Math.cosh);
				break;
			case "TANH":
				next_state = apply_pure_function(Math.tanh);
				break;
			case "ASINH":
				next_state = apply_pure_function(Math.asinh);
				break;
			case "ACOSH":
				next_state = apply_pure_function(Math.acosh);
				break;
			case "ATANH":
				next_state = apply_pure_function(Math.atanh);
				break;
			case "x^2":
				next_state = apply_pure_function(x => x**2);
				break;
			case "x^3":
				next_state = apply_pure_function(x => x**3);
				break;
			case "sqrt":
				next_state = apply_pure_function(Math.sqrt);
				break;
			case "x!":
				next_state = apply_pure_function(factorial);
				break;
			case "e^x":
				next_state = apply_pure_function(Math.exp);
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
			
			//case "ab/c":
			//case "d/c":
			//case "F<>D":
			
			default:
				throw {
					error: 'not implemented',
					button: label,
				};
		};
		if(!['2nd', 'HYP'].includes(label)){
			next_state = next_state.child({second:false});
			if(!(['1', '2', '3'].includes(label) && state.memorymode !== '')){
				next_state = next_state.child({hyperbolic:false});
			}
			if(!Object.values(MEMORY_KEYS).includes(label)){
				next_state = next_state.child({memorymode: ''});
			}
		};
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
	
	function pop_binary_op(){
		const stack = [...state.stack];
		if(is_binary_op(stack.slice(-1)[0])){
			stack.pop();
			return child({stack});
		} else {
			return state;
		};
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
	};
	
	function reduce_binary_op(){
		if(state.stack.length < 3){
			return state;
		}
		
		// this block handles the case where we must defer computation
		// out of respect for the order of operations.
		if(state.stack.length >= 4){
			const [a, op1, b, op2] = state.stack.slice(-4);
			if(
				typeof(a) === 'number' 
				&&
				typeof(b) === 'number'
				&&
				is_binary_op(op1)
				&&
				is_binary_op(op2)
			){
				if(binary_op_precedence(op1) >= binary_op_precedence(op2)){
					const stack = state.stack.slice(0,-4);
					stack.push(apply_binary_op(a, op1, b), op2);
					return child({stack}).reduce_binary_op();
				} else {
					return state;
				};		
			};
		};
		
		// this block handles the typical case of having to simply
		// reduce the leading portion.
		const [a, op, b] = state.stack.slice(-3);
		if(is_binary_op(op)){
			const stack = state.stack.slice(0,-3);
			stack.push(apply_binary_op(a, op, b));
			return child({stack}).reduce_binary_op();
		} else {
			return state;
		}		
	};
	
	function percent(){
		if(
			[BINARY_OPS.plus, BINARY_OPS.minus]
			.includes(state.stack.slice(-1)[0])
		){
			const oldtop = top_number();
			const newstate = ensure_empty_entry();
			return newstate.push_number(newstate.top_number()*oldtop/100);
		};
		const newstate = ensure_empty_entry();
		const topnum = newstate.top_number();
		return newstate.push_number(topnum / 100);
	};
		
	function apply_pure_function(func){
		const newstate = ensure_empty_entry();
		const result = func(newstate.top_number());
		return newstate.push_number(result).catch_errors();
	};
	
	function to_radians(angle){
		switch(state.anglemode){
			case ANGLE_MODES.radians:
				return angle;
			case ANGLE_MODES.degrees:
				return angle*Math.PI/180;
			case ANGLE_MODES.grads:
				return angle*Math.PI/200;
		};
	};
	
	function from_radians(angle){
		return angle / to_radians(1);
	};
	
	function cos(angle){
		const radian = to_radians(trig_overflow_protect(angle));
		const eps = floating_epsilon(radian);
		if(Math.abs(mod(radian, Math.PI) - Math.PI/2) < eps){
			return 0;
		}
		if(Math.abs(mod(radian+Math.PI/2, 2*Math.PI)-Math.PI/2) < eps){
			return 1;
		}
		if(Math.abs(mod(radian-Math.PI/2, 2*Math.PI)-Math.PI/2) < eps){
			return -1;
		}
		const ans = Math.cos(radian);
		if(ans > 1-1e-13){
			return 1;
		}
		return ans;
	};
	
	function sin(angle){
		const radian = to_radians(trig_overflow_protect(angle));
		const eps = floating_epsilon(radian);
		if(Math.abs(mod(radian+Math.PI/2, Math.PI) - Math.PI/2) < eps){
			return 0;
		}
		if(Math.abs(mod(radian, 2*Math.PI)-Math.PI/2) < eps){
			return 1;
		}
		if(Math.abs(mod(radian, 2*Math.PI)-3*Math.PI/2) < eps){
			return -1;
		}
		return Math.sin(radian);		
	};
	
	function tan(angle){
		const radian = to_radians(trig_overflow_protect(angle));
		const eps = floating_epsilon(radian);
		if(Math.abs(mod(radian+Math.PI/2, Math.PI) - Math.PI/2) < eps){
			return 0;
		}
		if(Math.abs(mod(radian, Math.PI)-Math.PI/2) < eps){
			return NaN;
		}
		return Math.tan(radian);		
	};
	
	function drg(){
		const modes = Object.values(ANGLE_MODES);
		const anglemode = modes[
			(modes.indexOf(state.anglemode)+1)
			%
			modes.length
		];
		return child({anglemode});
	};
	
	function drg_convert(){
		const oldstate = state.ensure_empty_entry();
		const angle = to_radians(oldstate.top_number());
		const newstate = oldstate.drg();
		return newstate.push_number(newstate.from_radians(angle));
	};
	
	function open_paren(){
		const stack = [...state.ensure_empty_entry().stack];
		if(typeof(stack.slice(-1)[0]) === 'number'){
			stack.pop();
		};
		if(stack.slice(-1)[0] === '('){
			stack.pop();
		};
		stack.push('(', 0);
		return ensure_empty_entry().child({stack});
	};
	
	function close_paren(){
		if(!state.stack.includes('(')){
			return equals();
		}
		const next_state = ensure_empty_entry();
		const stack = [...next_state.stack];
		const lastparen = stack.lastIndexOf('(');
		const stacktail = stack.slice(lastparen+1);
		const stackbase = stack.slice(0, lastparen);
		stackbase.push(
			child({stack:stacktail})
			.equals()
			.top_number()
		);
		return next_state.child({stack:stackbase});
	};
	
	function catch_errors(){
		let stack = state.stack
			.map(normalize_errors)
			.map(function(x){
				if(typeof(x) === 'number' && Math.abs(x)< 1e-99){
					return 0;
				}
				return x;
		});
		const overflow = Math.abs(top_number()) >= 1e100;
		const error = (state.error || stack.includes(NaN) || overflow);
		if(error){
			stack = [0];
		}
		return child({error, stack});
	};
	
	function trig_overflow_protect(x){
		if(Math.abs(to_radians(x))*180/Math.PI >= 1e10){
			return NaN;
		}
		return x;
	};
	
	
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
				memory[place] += top_number();
				return child({memorymode, memory});
		}
	};
};

function TI30Xa(){
	const history = [TI30Xa_state()];
	const command_log = [];
	//for debugging purposes:
	//document.my_history = history;
	
	return {history, command_log, now, press, undo, to_html, current_html};
	
	function now(){
		return history.slice(-1)[0];
	};
	
	function press(keyname){
		command_log.push(keyname);
		history.push(now().push_button(keyname));
	};
	
	function undo(){
		if(history.length > 1){
			history.pop();
			command_log.pop();
		}
	};
	
	function to_html(){
		return (history
			.map(state => state.to_html())
			.join("<br/><br/>")
		);
	};
	
	function current_html(){
		return now().to_html();
	};
}


export {TI30Xa, array_equal, BINARY_OPS}