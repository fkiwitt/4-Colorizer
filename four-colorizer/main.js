//// Painting

//Canvas
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');

var btn = document.getElementById('colorize-btn');
// btn.onclick = function() {colorize()};

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
				colorize();
				draw_current_canvas();
    }
});

var coordinates = [[0,0],[800,0],[800,500],[0,500]];
var indices = {"[0,0]":0, "[800,0]":1, "[800,500]":2, "[0,500]":3};//change again!!!
// initial graph
var graph = [
	[1,3],
	[0,2],
	[1,3],
	[0,2]
];

var faces = [ [0,1,2,3] ];
var color_configuration = [ 0 ];
var colors = ['#f00', '#f00', '#f00', '#f00'];


function on_draw_line(current_stroke){
	// var result = add_line(current_stroke);
	var new_edges = result[0];
	var adjacent_edges = result[1];

	for(new_edge in new_edges) {
		var face_split = find_face(new_edges[new_edge]);
		if(face_split != -1){
			split_face(face_id, new_edges[new_edge], adjacent_edges[new_edge]);
		}
	}

	// Calculate color configuration

	colorize();
}


/*//initial edges
var edges = [];
for (line in stroke_history){
	edges.push([indices[[stroke_history[0],stroke_history[1]]], indices[[stroke_history[2], stroke_history[3]]]]);
}*/

var parent = [0,0,0,0]

//DSU
function add_vertex(){
	parent.push(parent.length);
}

function find_set(v){
	if (v == parent[v]){
		return v;
	}
	return parent[v] = find_set(parent[v]);//hope that works in JS
}

function union(u,v) { // could be more efficient with union by size
	a = find_set(u);
	b = find_set(v);
	if (a != b) {
		parent[b] = a;
	}
}


function add_line(line){
	var start_pos = [line[0],line[1]];
	var end_pos = [line[2], line[3]];
	[start_pos, end_pos] = [start_pos, end_pos].sort() //no idea if that works
	var intersections_and_adjacent = [];
	for (node in graph){
		for (idx_node2 in graph[node]){
			node2 = graph[node][idx_node2];
			if (node < node2){
				var edge = coordinates[node].concat(coordinates[node2]); //concatenate coordinates to format needed by intersection
				var intersect = intersection(line, edge);
				if (intersect != -1){
					intersections_and_adjacent.push([intersect, [node,node2]]);
				}
			}
		}
	}
	intersections_and_adjacent.sort();
	var n = intersections_and_adjacent.length;
	intersections = [];
	adjacent_edges = [];
	for (i in intersections_and_adjacent){
		intersections.push(intersections_and_adjacent[i][0]);
		adjacent_edges.push(intersections_and_adjacent[i][1]);
	}
	new_edges = []
	console.log("number of intersections: ", n);
	if (n == 0){
		indices[start_pos] = coordinates.length;
		coordinates.push(start_pos);
		indices[end_pos] = coordinates.length;
		coordinates.push(end_pos);
		new_edges.push([coordinates.length-2, coordinates.length-1]);
		graph.push([]);
		graph.push([]);
		graph[coordinates.length-2].push(coordinates.length-1);
		graph[coordinates.length-1].push(coordinates.length-2);
		console.log(graph);
		add_vertex();
		add_vertex();
		union(coordinates.length-1, coordinates.length-2);
		return -1;
	}
	for (var i = 0; i < n; i++){
		var current = coordinates.length;
		indices[intersections[i]] = current;
		coordinates.push(intersections[i]);
		graph.push([]);
		if (i != 0){
			new_edges.push([coordinates.length-2, coordinates.length-1]);//the two last added intersections ane adjecent
			graph[coordinates.length-2].push(coordinates.length-1);
			graph[coordinates.length-1].push(coordinates.length-2);
		}
		//now delete the former adjacent edge from node1 to node2 and add the edges [node1, intersection] and [intersection, node2]
		var node1,node2;
		[node1,node2] = adjacent_edges[i];
		//here sth did not work because of a weird thing. It works now, but be aware of that if there are errors in future.
		graph[node1].splice(graph[node1].indexOf(node2),1);
		graph[node2].splice(graph[node2].indexOf(node1),1);
		graph[node1].push(current);
		graph[current].push(node1);
		graph[node2].push(current);
		graph[current].push(node2);

		add_vertex();
		union(node1, current);//node1 and node2 should already be in the same set

	}
	if (start_pos != intersections[0]){ //chech so that there are no two nodes on the same coordinate (may still be a problem somewhere else)
		indices[start_pos] = coordinates.length;
		coordinates.push(start_pos);
		new_edges.push([coordinates.length-1, indices[intersections[0]]]);
		graph.push([]);
		graph[indices[intersections[0]]].push(coordinates.length-1);
		graph[coordinates.length-1].push(indices[intersections[0]]);
		add_vertex();
	}
	if (end_pos != intersections[n-1]){ //chech so that there are no two nodes on the same coordinate (may still be a problem somewhere else)
		indices[end_pos] = coordinates.length;
		coordinates.push(end_pos);
		new_edges.push([coordinates.length-1, indices[intersections[n-1]]]);
		graph.push([]);
		graph[indices[intersections[n-1]]].push(coordinates.length-1);
		graph[coordinates.length-1].push(indices[intersections[n-1]]);
		add_vertex();
	}
	console.log(new_edges);
	console.log(graph);
	console.log(parent);

}

function check_if_new_face(new_edge){//TODO: test if it is correct for all lines
	if (find_set(new_edge[0]) == find_set[new_edge[1]]){
		return true;
	}
	return false;
}

function find_face(new_edge){
	if (!check_if_new_face(new_edge)){
		return -1;
	}
	//calculate which face will be splitted
}


function intersection(path1, path2){
	var grace = 10; //DEBUG ONLY

	if(path1 == path2){
		return -1;
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
		if(min_x1 >= (min_x2 - grace) && min_x1 <= (max_x2 + grace)){
			var intersection_y = min_x1 * m2 + c2;
			if((intersection_y >= (min_y1 - grace)) && (intersection_y <= (max_y1 + grace))){
				does_intersect = true;
				return [min_x1, intersection_y];
			}
		}
	} else if((path1[2]-path1[0] != 0) && (path2[2]-path2[0] == 0)){
		does_intersect = false;
		if(min_x2 >= (min_x1 - grace) && min_x2 <= (max_x1 + grace)){
			var intersection_y = min_x2 * m1 + c1;
			if((intersection_y >= (min_y2 - grace)) && (intersection_y <= (max_y2 + grace))){
				does_intersect = true;
				return [min_x2, intersection_y];
			}
		}
	}

	if (does_intersect == false){
		return -1;
	}

	var intersection_x = (c2-c1)/(m1-m2);
	var intersection_y = m1 * intersection_x + c1;

	if(intersection_x >= (min_x1-grace) && intersection_x <= (max_x1+grace) && intersection_x >= (min_x2-grace) && intersection_x <= (max_x2+grace) && intersection_y >= (min_y1-grace) && intersection_y <= (max_y1+grace) && intersection_y >= (min_y2-grace) && intersection_y <= (max_y2+grace)){
		return [intersection_x, intersection_y];
	}else{
		return -1;
	}
}

function split_face(face_id, new_edge, adjacent_edges){
	var polygon = faces[face_id];
	var face1 = [];
	var face2 = [];

	var after_edge = false;
	for(node in polygon){
		var element = polygon[node];
		var both = false;

		for(adjacent_edge in adjacent_edges){
			for(adjacent_node in adjacent_edge){
				if(adjacent_edges[adjacent_edge][adjacent_node] == element){
					after_edge = !after_edge
					both = true;
					adjacent_edges[adjacent_edge] = [-1,-1];
				}
			}
		}

		if(!after_edge || both){
			face1.push(element);
		}
		if(after_edge || both) {
			face2.push(element);
		}
	}

	faces[face_id] = face1;
	faces.push(face2);
}

function colorize(){
	for(face in faces){
		ctx.fillStyle = colors[color_configuration[face]];
		ctx.beginPath();
		var begin = true;
		for(node in faces[face]){
			var element_coordinates = coordinates[faces[face][node]];
			if(begin){ ctx.moveTo(element_coordinates[0], element_coordinates[1]); begin = false;} else {
				ctx.lineTo(element_coordinates[0], element_coordinates[1]);
			}
		}
		ctx.closePath();
		ctx.fill();
	}

	draw_current_canvas();
}
