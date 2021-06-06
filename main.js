import {TI30Xa,} from './modules/TI30Xa.js';
import {to_button_coords, button_at} from './modules/button_parse.js';
import {run_all_tests,} from './tests/test.js';


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
	run_all_tests();
	const keyboard = document.getElementById("calculator_picture");
	const coord_display = document.getElementById("hover_coords");
	add_hover_coords(keyboard, coord_display);
	
	const calculator = TI30Xa();
	const calc_history = document.getElementById("calc_history");
	const calc_state = document.getElementById("calc_state");
	function show_history(){
		calc_history.innerHTML = calculator.to_html();
		calc_state.innerHTML = calculator.current_html();
	};
	show_history();
	
	keyboard.onclick = function(e){
		const rect = keyboard.getBoundingClientRect();
		const x = (e.clientX - rect.left)/rect.width;
		const y = (e.clientY - rect.top)/rect.height;
		const button_label = button_at({x, y});
		calculator.press(button_label);
		show_history();
	};
	
	const undo = document.getElementById("undo");
	undo.onclick = function(){
		calculator.undo();
		show_history();
	};
}