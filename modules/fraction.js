/* jshint esversion: 11 */


let Decimal;

const MAX_DENOMINATOR = 999;

function gcd(x, y){
	x = Math.abs(x);
	y = Math.abs(y);
	while(y > 0){
		[x, y] = [y, x%y];
	}
	return x;
}

function reduced(n, d){
	const common = gcd(n, d);
	return [Math.floor(n/common), Math.floor(d/common)];
}

function Fraction(num=0, den=1){
	[num, den] = reduced(num, den);
	if(den === 0){
		return new Decimal(NaN);
	}
	if(den < 0){
		return Fraction(-num, -den);
	}
	if(den === 1 ||
		den > MAX_DENOMINATOR ||
		Math.abs(num) > den*999999 ||
		Math.abs(num/den) >= 1000
	){
		return toDecimal()
	}
	
	return Object.freeze(Object.assign(
		toDecimal(),
		{
			num,
			den,
			toDecimal,
			toStringImproper,
			toStringMixed,
			toJSON,
			isFraction,
			plus,
			minus,
			times,
			dividedBy,
			rightApplyOp,
			negated,
		}
	));
	

	
	function toDecimal(){
		return (new Decimal(num)).dividedBy(den);
	}
	
	function toStringImproper(){
		return `${num}/${den}`;
	}
	
	function toStringMixed(){
		const neg = num<0 ? '-' : '';
		const whole = Math.floor(Math.abs(num) / den);
		if(whole === 0){
			return toStringImproper();
		}
		const part = Math.abs(num) % den;
		return `${neg}${whole}_${part}/${den}`;
	}
	
	function toJSON(){
		return toStringImproper();
	}
	
	function isFraction(){
		return true;
	}
	
	function plus(y){
		if(y.isFraction?.()){
			return Fraction(num * y.den + y.num * den, den * y.den);
		}
		if(y.isInteger?.()){
			return Fraction(num + den*y.toNumber(), den);
		}
		return toDecimal().plus(y);
	}
	
	function minus(y){
		if(y.isFraction?.()){
			return Fraction(num * y.den - y.num * den, den * y.den);
		}
		if(y.isInteger?.()){
			return Fraction(num - den*y.toNumber(), den);
		}
		return toDecimal().minus(y);
	}
	
	function times(y){
		if (y.isFraction?.()){
			return Fraction(num * y.num, den * y.den);
		}
		if (y.isInteger?.()){
			return Fraction(num * y.toNumber(), den);
		}
		return toDecimal().times(y)
	}
	
	function dividedBy(y){
		if (y.isFraction?.()){
			return Fraction(num * y.den, den * y.num);
		}
		if (y.isInteger?.()){
			return Fraction(num, den * y.toNumber());
		}
		return toDecimal().dividedBy(y);
	}
	
	function rightApplyOp(op, y){
		switch(op){
			case '+': 
				return plus(y);
			case '-':
				return Fraction(y.toNumber()*den - num, den);
			case '*':
				return times(y);
			case '/':
				return Fraction(den, num).times(y);
		}
	}
	
	function negated(){
		return Fraction(-num, den);
	}
};

Fraction.fromString = function fromString(str){
	const negative = str[0] === '-';
	str = str.replace('-', '');
	let whole = '0';
	if (str.includes('_')){
		[whole, str] = str.split('_');
	}
	let [n, d] = str.split('/');
	if(d === ''){
		return new Decimal(NaN);
	}
	whole = parseInt(whole);
	n = parseInt(n);
	d = parseInt(d);
	n += whole * d;
	n = negative? -n : n;
	return Fraction(n, d);
};

Fraction.fromDecimal = function fromDecimal(x){
	const [n, d] = x.toFraction(MAX_DENOMINATOR);
	if(n === 0){
		return x;
	}
	const relative_error = x.times(d).dividedBy(n).abs();
	if(relative_error.greaterThan(1+1e-8) || relative_error.lessThan(1-1e-9)){
		return x;
	}
	return Fraction(n, d);
};

Fraction.setDecimal = function setDecimal(d){
	Decimal = d;
};


export {Fraction};