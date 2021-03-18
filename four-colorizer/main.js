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
		on_draw_line(current_stroke);
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


function on_draw_line(current_stroke){
	var result = generate_node_graph();
	var new_graph = result[0];
	var new_edges = result[1];
	var adjacent_edges = result[2];
	console.log(new_graph, new_edges, adjacent_edges);
}

//// Colorize
function colorize(){
	var result = generate_node_graph();
	console.log(result[0]);
}


//// Generate Node Graph
var coordinates = [];
var indices = {};

function generate_node_graph(){
	var adjacency_list = [];

	for(var i = 0; i < stroke_history.length; i++){
		var current_row = [];
		for(var j = 0; j < stroke_history.length; j++){
			current_row.push([]);
		}
		adjacency_list.push(current_row);
	}

	for(line1 in stroke_history){
		var current_line_adjacency = [];

		for(line2 in stroke_history){
			var result = intersection(stroke_history[line1], stroke_history[line2]);
			var intersect = result[0];
			var intersection_coordinates = result[1];
			current_line_adjacency.push([line2, intersect]);

			if((intersect != -1) && (line1 <= line2)){
				indices[intersection_coordinates] = coordinates.length;
				coordinates.push(intersection_coordinates);
			}
		}

		current_line_adjacency.sort(function(a,b){return -(a[1]-b[1]);});

		for(var index = 0; index < current_line_adjacency.length - 1; index++){

			if((index < (current_line_adjacency.length - 1)) && (current_line_adjacency[index + 1][1] != -1) && (current_line_adjacency[index+1][0] != line1) && (current_line_adjacency[index][0] != line1)){
				adjacency_list[Math.min(line1, current_line_adjacency[index][0])][Math.max(line1, current_line_adjacency[index][0])].push([Math.min(line1, current_line_adjacency[index + 1][0]), Math.max(line1, current_line_adjacency[index + 1][0])]);
				adjacency_list[Math.min(line1, current_line_adjacency[index + 1][0])][Math.max(line1, current_line_adjacency[index + 1][0])].push([Math.min(line1, current_line_adjacency[index][0]), Math.max(line1, current_line_adjacency[index][0])]);
			}

		}
	}

	var new_edges = [];
	var adjacent_edges = [];

	var finished = false;

	var current_index_line = 0;

	for(empty_line in adjacency_list[adjacency_list.length - 1]){
		if(adjacency_list[empty_line][adjacency_list.length - 1].length != 0) {
			current_index_line = empty_line;
			break;
		}
	}

	var history = [current_index_line];

	while(!finished) {
		finished = true;
		for(adjacent_intersection in adjacency_list[current_index_line][adjacency_list.length - 1]){
			if(adjacency_list[current_index_line][adjacency_list.length - 1][adjacent_intersection][1] == (adjacency_list.length - 1) && !history.includes(adjacency_list[current_index_line][adjacency_list.length - 1][adjacent_intersection][0])){
				finished = false;
				current_index_line = adjacency_list[current_index_line][adjacency_list.length - 1][adjacent_intersection][0];
				history.push(current_index_line);

				new_edges.push([[history[history.length-1], adjacency_list.length - 1], [current_index_line, adjacency_list.length - 1]]);

				var first_adjacent_edge = [];
				var second_adjacent_edge = [];

				for(first_adjacent_intersection in adjacency_list[history[history.length - 2]][adjacency_list.length - 1]){
					if(adjacency_list[history[history.length - 2]][adjacency_list.length - 1][first_adjacent_intersection].includes(history[history.length - 2])){
						first_adjacent_edge.push(adjacency_list[history[history.length - 2]][adjacency_list.length - 1][first_adjacent_intersection]);
					}
				}

				if(first_adjacent_edge.length == 1){
					first_adjacent_edge.push(adjacency_list[current_index_line][adjacency_list.length - 1][history[history.length - 2]]);
					console.log("warning 1");
				}


				for(second_adjacent_intersection in adjacency_list[current_index_line][adjacency_list.length - 1]){
					if(adjacency_list[current_index_line][adjacency_list.length - 1][second_adjacent_intersection].includes(current_index_line)){
						second_adjacent_edge.push(adjacency_list[current_index_line][adjacency_list.length - 1][second_adjacent_intersection]);
					}
				}

				if(second_adjacent_edge.length == 1){
					second_adjacent_edge.push(adjacency_list[current_index_line][adjacency_list.length - 1][current_index_line]);
					console.log("warning 2");
				}

				adjacent_edges.push([first_adjacent_edge, second_adjacent_edge]);


				break;
			}
		}

	}

	return [adjacency_list, new_edges, adjacent_edges];
}


function intersection(path1, path2){
	if(path1 == path2){
	}
	var min_x1 = Math.min(path1[0], path1[2]);
	var max_x1 = Math.max(path1[0], path1[2]);
	var min_y1 = Math.min(path1[1], path1[3]);
	var max_y1 = Math.max(path1[1], path1[3]);

	var min_x2 = Math.min(path2[0], path2[2]);
	var max_x2 = Math.max(path2[0], path2[2]);
	var min_y2 = Math.min(path2[1], path2[3]);
	var max_y2 = Math.max(path2[1], path2[3]);

	var m1 = (path1[3]-path1[1])/(path1[2]-path1[0]);
	var c1 = path1[1]-m1*path1[0];

	var m2 = (path2[3]-path2[1])/(path2[2]-path2[0]);
	var c2 = path2[1]-m2*path2[0];

	var does_intersect = true;
	if((path1[2]-path1[0] == 0) && (path2[2]-path2[0] != 0)){
		does_intersect = false;
		if(min_x1 >= (min_x2 - 10) && min_x1 <= (max_x2 + 10)){
			var intersection_y = min_x1 * m2 + c2;
			if((intersection_y >= (min_y1 - 10)) && (intersection_y <= (max_y1 + 10))){
				does_intersect = true;
				return [intersection_y, [min_x1, intersection_y]];
			}
		}
	} else if((path1[2]-path1[0] != 0) && (path2[2]-path2[0] == 0)){
		does_intersect = false;
		if(min_x2 >= (min_x1 - 10) && min_x2 <= (max_x1 + 10)){
			var intersection_y = min_x2 * m1 + c1;
			if((intersection_y >= (min_y2 - 10)) && (intersection_y <= (max_y2 + 10))){
				does_intersect = true;
				return [min_x2, [min_x2, intersection_y]];
			}
		}
	}

	if (does_intersect == false){
		return [-1, []];
	}

	var intersection_x = (c2-c1)/(m1-m2);
	var intersection_y = m1 * intersection_x + c1;

	if(intersection_x >= (min_x1-10) && intersection_x <= (max_x1+10) && intersection_x >= (min_x2-10) && intersection_x <= (max_x2+10) && intersection_y >= (min_y1-10) && intersection_y <= (max_y1+10) && intersection_y >= (min_y2-10) && intersection_y <= (max_y2+10)){
		return [intersection_x, [intersection_x, intersection_y]];
	}else{
		return [-1, []];
	}
}
