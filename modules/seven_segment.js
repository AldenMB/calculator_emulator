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
' ':{'a':false,'b':false,'c':false,'d':false,'e':false,'f':false,'g':false,'dp':false},
'0':{'a': true,'b': true,'c': true,'d': true,'e': true,'f': true,'g':false,'dp':false},
'1':{'a':false,'b': true,'c': true,'d':false,'e':false,'f':false,'g':false,'dp':false},
'2':{'a': true,'b': true,'c':false,'d': true,'e': true,'f':false,'g': true,'dp':false},
'3':{'a': true,'b': true,'c': true,'d': true,'e':false,'f':false,'g': true,'dp':false},
'4':{'a':false,'b': true,'c': true,'d':false,'e':false,'f': true,'g': true,'dp':false},
'5':{'a': true,'b':false,'c': true,'d': true,'e':false,'f': true,'g': true,'dp':false},
'6':{'a': true,'b':false,'c': true,'d': true,'e': true,'f': true,'g': true,'dp':false},
'7':{'a': true,'b': true,'c': true,'d':false,'e':false,'f': true,'g':false,'dp':false},
'8':{'a': true,'b': true,'c': true,'d': true,'e': true,'f': true,'g': true,'dp':false},
'9':{'a': true,'b': true,'c': true,'d': true,'e':false,'f': true,'g': true,'dp':false},
'-':{'a':false,'b':false,'c':false,'d':false,'e':false,'f':false,'g': true,'dp':false},
'=':{'a':false,'b':false,'c':false,'d': true,'e':false,'f':false,'g': true,'dp':false},
'_':{'a':false,'b':false,'c':false,'d': true,'e':false,'f':false,'g':false,'dp':false},
'/':{'a':false,'b':false,'c': true,'d': true,'e':false,'f':false,'g':false,'dp':false},
'E':{'a': true,'b':false,'c':false,'d': true,'e': true,'f': true,'g': true,'dp':false},
'r':{'a':false,'b':false,'c':false,'d':false,'e': true,'f':false,'g': true,'dp':false},
'o':{'a':false,'b':false,'c': true,'d': true,'e': true,'f':false,'g': true,'dp':false},
"'":{'a':false,'b':false,'c':false,'d':false,'e':false,'f': true,'g':false,'dp':false},
'"':{'a':false,'b': true,'c':false,'d':false,'e':false,'f': true,'g':false,'dp':false},
'n':{'a':false,'b':false,'c': true,'d':false,'e': true,'f':false,'g': true,'dp':false},
});