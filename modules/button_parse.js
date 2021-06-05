const BUTTON_HEIGHT = 0.063125,
	BUTTON_WIDTH = 0.15388,
	FAT_BUTTON_HEIGHT = BUTTON_HEIGHT*6/5,
	ON_BUTTON_HEIGHT = 0.03375,
	LEFT_SIDE = 0.270923 - BUTTON_WIDTH,
	TOP = 0.44875 - BUTTON_HEIGHT,
	ON_BUTTON_TOP = 0.31625;
	
const BUTTON_LABELS = Object.freeze(
`2nd DRG LOG LN OFF
HYP SIN COS TAN y^x
pi 1/x x^2 sqrt /
SIG+ EE ( ) *
STO 7 8 9 -
RCL 4 5 6 +
ab/c 1 2 3 =
<- 0 . +- ON/C`
	.split('\n')
	.map(s => s.split(' '))
	.map(Object.freeze)
);

const SECOND_LABELS = Object.freeze(
`2nd DRG> 10^x e^x OFF
K ASIN ACOS ATAN xROOTy
x<>y FRQ xbar sigxn-1 sigxn
SIG- n SIGx SIGx^2 P>R
EXC CSR nCr nPr R>P
SUM FLO SCI ENG DMS>DD
d/c x^3 % x! DD>DMS
F<>D 3ROOTx FIX +- ON/C`
	.split('\n')
	.map(s => s.split(' '))
	.map(Object.freeze)
);

function to_button_coords(x, y){
	const button_x = Math.floor((x-LEFT_SIDE)/BUTTON_WIDTH);
	
	if(button_x !== 4 || (y >= TOP && y <= TOP + 2*BUTTON_HEIGHT)){
		const button_y = Math.floor((y-TOP)/BUTTON_HEIGHT);
		return {x: button_x, y:button_y};
	};
	
	if(y >= ON_BUTTON_TOP && y <= ON_BUTTON_TOP + ON_BUTTON_HEIGHT){
		return {x: 4, y: 7};
	};
	
	if(y >= TOP + 2*BUTTON_HEIGHT && y <= TOP + 8*BUTTON_HEIGHT){
		const button_y = 2 + Math.floor( (y - (TOP+2*BUTTON_HEIGHT)) / FAT_BUTTON_HEIGHT);
		return {x: 4, y: button_y};
	};
	
	return {x: 4, y:-999};	
};

function to_button_name(spec){
	const {x, y, second = false} = spec;
	
	if(x<0 || x>4 || y<0 || y>7){
		return "";
	};
	const namearray = second ? SECOND_LABELS : BUTTON_LABELS;
	return namearray[y][x]
};

function button_at(spec){
	const {x, y, second = false} = spec;
	const {x: button_x, y: button_y} = to_button_coords(x, y);
	return to_button_name({x:button_x, y:button_y, second});
}

export {to_button_coords, button_at, BUTTON_LABELS, SECOND_LABELS};