//// Painting

//Canvas
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');

var btn = document.getElementById('colorize-btn');
btn.onclick = function() {colorize()};

//Variables
var canvasx = $(canvas).offset().left;
var canvasy = $(canvas).offset().top;
var last_mousex = last_mousey = 0;
var mousex = mousey = 0;
var mousedown = false;

var stroke_history = [[0,0,0,500],[0,0,800,0],[0,500,800,500],[800,0,800,500]];
var current_stroke = [0, 0, 0, 0];

draw_current_canvas();

function draw_current_canvas(){
	for(stroke in stroke_history){
		draw_strokes(stroke_history[stroke]);
	}
	draw_strokes(current_stroke);
}

function draw_strokes(stroke){
	ctx.beginPath();
	ctx.moveTo(stroke[0], stroke[1]);
	ctx.lineTo(stroke[2], stroke[3]);
	ctx.strokeStyle = 'black';
	ctx.lineWidth = 10;
	ctx.lineJoin = ctx.lineCap = 'round';
	ctx.stroke();
}

//Mousedown
$(canvas).on('mousedown', function(e) {
    start_x = parseInt(e.clientX-canvasx);
		start_y = parseInt(e.clientY-canvasy);
    mousedown = true;
});

//Mouseup
$(canvas).on('mouseup', function(e) {
    mousedown = false;
		stroke_history.push(current_stroke);
});

//Mousemove
$(canvas).on('mousemove', function(e) {
    mouse_x = parseInt(e.clientX-canvasx);
		mouse_y = parseInt(e.clientY-canvasy);
    if(mousedown) {
        ctx.clearRect(0,0,canvas.width,canvas.height); //clear canvas
				current_stroke = [start_x, start_y, mouse_x, mouse_y];
				draw_current_canvas();
    }
});


//// Colorize
function colorize(){
	var adjacency_list = generate_line_graph();
	console.log(adjacency_list);
}


//// Generate Line Graph
var dp = {};

function generate_line_graph(){
	var adjacency_list = [];

	for(line1 in stroke_history){
		var current_line_adjacency = [];
		for(line2 in stroke_history){
			if(line1 == line2){
				continue;
			}
			if(line2 < line1){
				if(dp[[line2, line1]]){
					current_line_adjacency.push(line2);
				}
			} else if (do_intersect(stroke_history[line1], stroke_history[line2])){
				current_line_adjacency.push(line2);
				dp[[line1, line2]] = true;
			} else {
				dp[[line1, line2]] = false;
			}
		}
		adjacency_list.push(current_line_adjacency);
	}
	return adjacency_list;
}

function do_intersect(path1, path2){

	var min_x1 = Math.min(path1[0], path1[2]);
	var max_x1 = Math.max(path1[0], path1[2]);
	var min_x2 = Math.min(path2[0], path2[2]);
	var max_x2 = Math.max(path2[0], path2[2]);

	if(((path1[2]-path1[0]) == 0) || ((path2[2]-path2[0]) == 0)){
		if(((path1[2]-path1[0]) == 0) && ((path2[2]-path2[0]) == 0)){
			return (path1[0]==path2[0]);
		}

		return (((min_x1 - 10) <= min_x2 && (max_x1+10) >= min_x2) || ((min_x2-10) <= min_x1 && (max_x2+10) >= min_x1));
	}

	var m1 = (path1[3]-path1[1])/(path1[2]-path1[0]);
	var c1 = path1[1]-m1*path1[0];

	var m2 = (path2[3]-path2[1])/(path2[2]-path2[0]);
	var c2 = path2[1]-m2*path2[0];

	var intersection_x = (c2-c1)/(m1-m2);

	if(intersection_x >= (min_x1-10) && intersection_x <= (max_x1+10) && intersection_x >= (min_x2-10) && intersection_x <= (max_x2+10)){
		return true;
	}else{
		return false;
	}
}
