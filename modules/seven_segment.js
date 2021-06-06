// courtesy of https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze
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

function make_digit(segments){
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

export {make_digit, make_sign_digit, set_visibility};