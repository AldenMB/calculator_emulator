// deepFreeze function courtesy of https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze
function deepFreeze(object) {
  // Retrieve the property names defined on object
  const propNames = Object.getOwnPropertyNames(object);

  // Freeze properties before freezing self

  for (const name of propNames) {
    const value = object[name];

    if (value && typeof value === "object") {
      deepFreeze(value);
    }
  }

  return Object.freeze(object);
}


const SEGMENT_ENCODE = deepFreeze({
	' ':{'a':false, 'b':false, 'c':false, 'd':false, 'e':false, 'f':false, 'g':false},
	'0':{'a': true, 'b': true, 'c': true, 'd': true, 'e': true, 'f': true, 'g':false},
	'1':{'a':false, 'b': true, 'c': true, 'd':false, 'e':false, 'f':false, 'g':false},
	'2':{'a': true, 'b': true, 'c':false, 'd': true, 'e': true, 'f':false, 'g': true},
	'3':{'a': true, 'b': true, 'c': true, 'd': true, 'e':false, 'f':false, 'g': true},
	'4':{'a':false, 'b': true, 'c': true, 'd':false, 'e':false, 'f': true, 'g': true},
	'5':{'a': true, 'b':false, 'c': true, 'd': true, 'e':false, 'f': true, 'g': true},
	'6':{'a': true, 'b':false, 'c': true, 'd': true, 'e': true, 'f': true, 'g': true},
	'7':{'a': true, 'b': true, 'c': true, 'd':false, 'e':false, 'f': true, 'g':false},
	'8':{'a': true, 'b': true, 'c': true, 'd': true, 'e': true, 'f': true, 'g': true},
	'9':{'a': true, 'b': true, 'c': true, 'd': true, 'e':false, 'f': true, 'g': true},
	'-':{'a':false, 'b':false, 'c':false, 'd':false, 'e':false, 'f':false, 'g': true},
	'=':{'a':false, 'b':false, 'c':false, 'd': true, 'e':false, 'f':false, 'g': true},
	'_':{'a':false, 'b':false, 'c':false, 'd': true, 'e':false, 'f':false, 'g':false},
	'/':{'a':false, 'b':false, 'c': true, 'd': true, 'e':false, 'f':false, 'g':false},
	'E':{'a': true, 'b':false, 'c':false, 'd': true, 'e': true, 'f': true, 'g': true},
	'r':{'a':false, 'b':false, 'c':false, 'd':false, 'e': true, 'f':false, 'g': true},
	'o':{'a':false, 'b':false, 'c': true, 'd': true, 'e': true, 'f':false, 'g': true},
	"'":{'a':false, 'b':false, 'c':false, 'd':false, 'e':false, 'f': true, 'g':false},
	'"':{'a':false, 'b': true, 'c':false, 'd':false, 'e':false, 'f': true, 'g':false},
	'n':{'a':false, 'b':false, 'c': true, 'd':false, 'e': true, 'f':false, 'g': true},
});

const BOOLEAN_INDICATORS = Object.freeze(['M1', 'M2', 'M3', '2nd', 'HYP', 'FIX', 'STAT', 'X', 'R', '()', 'K']);

function set_visibility(object, value=true){
	const visibility = value ? 'visible' : 'hidden';
	object.setAttribute('visibility', visibility);
}

function make_sign_digit(segments){
	function set_showing(character){
		if(character === '-' || character === ' '){
			set_visibility(segments.g, character === '-');
		} else {
			throw('tried to write '+character+' to sign digit.');
		}
	}
	
	return Object.freeze({set_showing});
}

function make_digit(segments, index){
	if(index === 0){
		return make_sign_digit(segments);
	}
	function set_showing(character){
		const encoding = SEGMENT_ENCODE[character];
		for(const segment of 'abcdefg'){
			set_visibility(segments[segment], encoding[segment]);
		}
	}
	
	function set_dp(value){
		set_visibility(segments.dp, value);
	}
	
	return Object.freeze({set_showing, set_dp});
}

function make_display({indicators, mantissa_list, exponent_list}){
	const mantissa = mantissa_list.map(make_digit);
	const exponent = exponent_list.map(make_digit);
	const display = {
		set format(fmt){
			if(!['SCI', 'ENG', 'FLO'].includes(fmt)){
				throw('attempted to set display format to '+fmt);
			}
			set_visibility(indicators.SCI, fmt === 'SCI');
			set_visibility(indicators.ENG, fmt === 'ENG');
		},
		set angle(fmt){
			if(!['RAD', 'DEG', 'GRAD', ''].includes(fmt)){
				throw('attempted to set angle format to '+fmt)
			}
			set_visibility(indicators.DE, fmt === 'DEG');
			set_visibility(indicators.G, fmt === 'DEG' || fmt === 'GRAD');
			set_visibility(indicators.RAD, fmt === 'GRAD' || fmt === 'RAD');
		},
		set mantissa(str){
			const negative = str.includes('-') ? '-' : ' ';
			const has_dp = str.includes('.');
			str = str.replace('-', '');
			const dp = 11+str.indexOf('.')-str.length;
			str = str.replace('.', '');
			str = negative + str;
			str = str.padStart(11, ' ');
			mantissa.forEach((m, i) => m.set_showing(str[i]));
			mantissa.slice(1).forEach(m => m.set_dp(false));
			if(has_dp){
				mantissa[dp].set_dp(true);
			}			
		},
		set exponent(str){
			if(str.replace(' ', '') === ''){
				exponent.forEach(d => d.set_showing(' '));
			} else {
				const negative = str.includes('-') ? '-' : ' ';
				str = negative + str.replace('-', '').padStart(2, '0');
				exponent.forEach((d, i) => d.set_showing(str[i]));
			}
		},
	};
	for(const indicator of BOOLEAN_INDICATORS){
		Object.defineProperty(display, indicator, {
			set: function(value){
				set_visibility(indicators[indicator], value); 
				}
		});
	}
	
	display.update = function update(calculator_state){	
		// TODO: show memory, fix, stat, x, r, k
		
		let displayed = calculator_state.shown_number();
		
		if(displayed === 'blank'){
			for(const indicator of BOOLEAN_INDICATORS){
				display[indicator] = false;
			}
			display.angle = '';
			display.format = 'FLO';
			display.mantissa = '';
			display.exponent = '';
			return;
		}
		
		// TODO: include logic for this
		for(const indicator of 'FIX STAT X R K'.split(' ')){
			display[indicator] = false;
		}
		display.format = calculator_state.formatmode;
		
		display['2nd'] = calculator_state.second;
		display['()'] = calculator_state.stack.includes('(');
		display.HYP = calculator_state.hyperbolic;
		display.angle = calculator_state.anglemode;
		display.M1 = calculator_state.memory[0] !== 0;
		display.M2 = calculator_state.memory[1] !== 0;
		display.M3 = calculator_state.memory[2] !== 0;
		
		if(displayed === "Error"){
			display.exponent = '';
			display.mantissa = 'Error  ';
			return;
		}
		if(!displayed.includes('e')){
			display.exponent = '';
			display.mantissa = displayed;
		} else {
			// depending on the sign of the exponent, the e could end up in either part
			display.exponent = displayed.slice(-3).replace('e', '');
			display.mantissa = displayed.slice(0,-3).replace('e', '');
		}
		return
	}
	
	return Object.freeze(display);
}

export {make_display};