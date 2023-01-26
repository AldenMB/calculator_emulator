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

const INDICATORS = Object.freeze(
    "M1,M2,M3,2nd,HYP,SCI,ENG,FIX,STAT,DE,G,RAD,X,R,(),K"
	.split(',')
);

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
	const display = {};
	
	display.update = function update(calculator_state){		
		const [row1, row2] = calculator_state.to_text_display().split('\n').slice(1, 3);
		
		let position = 1;
		for (const ind of INDICATORS){
			set_visibility(indicators[ind], row1.slice(position, position+ind.length) === ind);
			position += ind.length;
		}
		
		mantissa.forEach((m, i) => {
			if(m.set_dp) {m.set_dp(row2[2+2*i] === '.')};
			m.set_showing(row2[1+2*i]);
		});
		exponent.forEach((e, i) => e.set_showing(row2[34+i]));
	}
	
	return Object.freeze(display);
}

export {make_display};