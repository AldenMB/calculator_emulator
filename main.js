import {TI30Xa,} from './modules/TI30Xa.js';
import {to_button_coords, button_at} from './modules/button_parse.js';
import {run_all_tests,} from './tests/test.js';
import {make_display,} from './modules/seven_segment.js';
import {Log,} from './modules/logging.js';


function add_hover_coords(picture, display){
	picture.addEventListener('mousemove', function(e){
		const rect = picture.getBoundingClientRect();
		const x = (e.clientX - rect.left)/rect.width;
		const y = (e.clientY - rect.top)/rect.height;
		
		const {x:button_x, y:button_y} = to_button_coords(x,y);
		const button_name = button_at({x, y, second:false});
		
		display.innerHTML = (
`button=${button_x}, ${button_y},
name = ${button_name},
x=${x}, y=${y}`);
	});
}

window.onload = function() {
	console.log(run_all_tests());
	const keyboard = document.getElementById("calculator_picture");
	const coord_display = document.getElementById("hover_coords");
	add_hover_coords(keyboard, coord_display);
	
	const calculator = TI30Xa();
	const calc_history = document.getElementById("calc_history");
	const calc_state = document.getElementById("calc_state");
	//const log = Log("https://home.aldenbradford.com:58086");
	
	function get_segments(digit, exponent){
		const segments = {}
		const exponent_prefix = exponent ? 'E' : '';
		const segment_list = (
			(digit === 10 || (exponent && digit===2))
			?
			['g']
			:
			'a b c d e f g dp'.split(' ')
		);
		for(const segment of segment_list){
			segments[segment] = document.getElementById('segment'+exponent_prefix+digit+segment.toUpperCase());
		}
		return segments
	}
	
	const mantissa_list = [...Array(11).keys()].reverse().map(x => get_segments(x, false));
	
	const exponent_list = [2, 1, 0].map(x => get_segments(x, true));
	
	const indicators = {};
	for(let indicator of ['M1', 'M2', 'M3', '2nd', 'HYP', 'SCI', 'ENG', 'FIX', 'STAT', 'DE', 'G', 'RAD', 'X', 'R', '()', 'K']){
		indicators[indicator] = document.getElementById(indicator);
	}
	
	const display = make_display({indicators, mantissa_list, exponent_list});
	
	function show_history(){
		calc_history.innerHTML = calculator.to_html();
		calc_state.innerHTML = calculator.current_html();
		display.update(calculator.now());
		//log.include(calculator);
	};
	show_history();
	
	keyboard.onclick = function(e){
		const rect = keyboard.getBoundingClientRect();
		const x = (e.clientX - rect.left)/rect.width;
		const y = (e.clientY - rect.top)/rect.height;
		const button_label = button_at({x, y});
		if(button_label === ''){
			return;
		}
		try {
			calculator.press(button_label);
			show_history();
		} catch(e){
			if(e.error === 'not implemented'){
				document.getElementById('error_field').innerHTML = `Button ${e.button} not yet implemented!`;
			} else {
				throw e;
			}
		}
	};
	
	const undo = document.getElementById("undo");
	undo.onclick = function(){
		calculator.undo();
		show_history();
	};
	
}