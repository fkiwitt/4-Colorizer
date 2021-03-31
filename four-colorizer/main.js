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
var indices = {};
indices[[0,0]] = 0;
indices[[800,0]] = 1;
indices[[800,500]] = 2;
indices[[0,500]] = 3;
// initial graph
var graph = [
	[1,3],
	[0,2],
	[1,3],
	[0,2]
];

var faces = [ [0,1,2,3] ];//means for example that the first face has the edges [0,1],[1,2],[2,3],[3,0]
var color_configuration = [];
var colors = ['#f00', '#0f0', '#00f', '#FF33F6'];

var visited = [];
var dual_graph = [[]]; //dual_graph[i] has the connections of the face with index i; dual_graph[n] are the connections to the outside


function on_draw_line(current_stroke){
	var result = add_line(current_stroke);
	var new_edges = result[0];
	var adjacent_edges = result[1];

	var cnt = 0;
	for(idx in new_edges) {
		if (check_if_new_face(new_edges[idx])){
			//TODO: Test and find mistakes: make sure find_face works and fix split face

			//var face_id = find_face(new_edges[idx]);//may be problematic, because adjacent_edges has fewer edges than new_edges, but I think for all edges that cause a face split, there should exist the right adjacent_edge
			//console.log("new edge and face created: ", new_edges[idx], face_id);
			//split_face(face_id, new_edges[idx], adjacent_edges[idx]);
			cnt++;
		}
		union(new_edges[idx][0],new_edges[idx][1]);//not sure if that is the correct place for that and if it works as it should
	}
	//console.log("This line creates ", cnt, " new faces.");
	//console.log("set of each vertex: ");
	//[...Array(graph.length).keys()].forEach(x => console.log(find_set(x)));
	//console.log("coordinates: ", coordinates);
	//console.log("graph: ", graph);
	faces_of_edges = {};
	faces.splice(0);
	dual_graph.splice(0);
	dual_graph.push([]);
	calc_dual_graph();
	console.log("faces: ",faces);
	console.log("dual_graph: ", dual_graph);
	var visited_components = new Set();
	/*for (var i = 0; i < coordinates.length; i++){
		if (graph[i].length > 1 && !visited_components.has(find_set(i))){
			var hull = convex_hull(i);
			var hull_points = hull.map((a) => indices[[a.x,a.y]]);//not sure if that works
			console.log("Convex hull: ", hull, hull_points);
			visited_components.add(find_set(i));
		}
	}*/
	// Calculate color configuration
	// var compontents_graph = calculate_components_graph();
	color_configuration = calculate_color_configuration();
	console.log(color_configuration);
	colorize();
}



var parent = [0,0,0,0]
//DSU
function add_vertex(){
	parent.push(parent.length);
}

function find_set(v){
	if (v == parent[v]){
		return v;
	}
	parent[v] = find_set(parent[v]);
	return parent[v];
}

function union(u,v) { // could be more efficient with union by size
	a = find_set(u);
	b = find_set(v);
	if (a != b) {
		parent[b] = a;
	}
}


function index_of(arr, elem){//yep I'm using my own index_of method, because the array.indexOf method of javascript is apparently not working (maybe some weird stuff because of type compare (===))
	for (i in arr){
		if (arr[i] == elem){
			return i;
		}
	}
	return -1;
}


function add_line(line){
	var start_pos = [line[0],line[1]];
	var end_pos = [line[2], line[3]];
	[start_pos, end_pos] = [start_pos, end_pos].sort() //no idea if that works
	var intersections_and_adjacent = [];
	for (node in graph){
		for (idx_node2 in graph[node]){
			node2 = graph[node][idx_node2];
			if (parseInt(node) < parseInt(node2)){ //I hope that works now; there were cases where the stuff in the if condition was executed although node>node2, really weird, maybe some weird caching stuff I don't understand (like in the spectre attack, but maybe not)
				//console.log(node,node2);//for checking if node < node2 (was not always the case without parseInt)
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
	// console.log("number of intersections: ", n);
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
		// console.log(graph);
		add_vertex();
		add_vertex();
		//union(coordinates.length-1, coordinates.length-2); //union them later
		return [[[coordinates.length-2, coordinates.length-1]], []];//should fit the expected output
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
		var idx1 = index_of(graph[node1], node2);
		var idx2 = index_of(graph[node2], node1);
		graph[node1].splice(idx1,1);
		graph[node2].splice(idx2,1);
		graph[node1].push(current);
		graph[current].push(node1);
		graph[node2].push(current);
		graph[current].push(node2);

		add_vertex();
		union(node1, current);//node1 and node2 should already be in the same set

	}
	//var new_edges_cp = _.cloneDeep(new_edges);
	//console.log("edges with intersections at both sides: ", new_edges_cp);
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
	//console.log("All new edges: ", new_edges);
	//console.log("Adjacent edges (without new split): ", adjacent_edges);
	//console.log("Graph: ", graph);
	// console.log(parent);
	return [new_edges, adjacent_edges];
}


/////////////////////////////// calculating faces and dual graph ///////////////////////////////////

function dist(vec){
	return Math.sqrt(Math.pow(vec[0],2)+Math.pow(vec[1],2));
}

function find_in_array(arr,x){
	for (i in arr){
		if (arr[i] == x){
			return i;
		}
	}
	return -1;
}


function calc_theta(AB,BC){
	AB = [Math.round(1000000*AB[0])/1000000,Math.round(1000000*AB[1])/1000000];
	BC = [Math.round(1000000*BC[0])/1000000,Math.round(1000000*BC[1])/1000000];
	var cross = Math.round(1000000*(AB[0]*BC[1] - AB[1]*BC[0]))/1000000;
	var phi = Math.acos(Math.max(-1,Math.min(1,Math.round(1000000*((AB[0]*BC[0]+AB[1]*BC[1])/(dist(AB)*dist(BC))))/1000000)));//returns sth between 0 and pi
	//console.log((AB[0]*BC[0]+AB[1]*BC[1])/(dist(AB)*dist(BC)), cross, phi);
	var theta = 20.0;
	if (cross == 0){
		theta = Math.PI - phi;
	}
	else if (cross > 0){//phi < pi
		theta = Math.PI - phi;
	}
	else { //actually phi is greater than pi, but acos outputs 2*pi - phi instead (I guess)
		theta = Math.PI + phi;
	}
	//console.log("AB, BC, theta: ", AB, BC, theta);
	return theta;
}



function dfs_left(a,b){//a is previous, b is current
	//console.log("a,b: ",a,b);
	var rep_idx = find_in_array(visited,b);
	if (rep_idx != -1){
		visited.splice(0,rep_idx);//should work but I may have miscalculated
		return true;
	}
	var A = coordinates[a];
	var B = coordinates[b];
	var AB = [B[0]-A[0], B[1]-A[1]];
	var mintheta = 10.0;
	var leftest = -1;
	for (i in graph[b]){
		c = graph[b][i];
		if (c != a && graph[c].length >= 2){//only look at deg>=2 nodes
			var C = coordinates[c];
			var BC = [C[0]-B[0], C[1]-B[1]];
			var cross = AB[0]*BC[1] - AB[1]*BC[0];
			var phi = Math.acos((AB[0]*BC[0]+AB[1]+BC[1])/(dist(AB)*dist(BC)));//returns sth between 0 and pi
			var theta = 20.0;
			if (cross == 0){
				theta = Math.PI - phi;
			}
			else if (cross > 0){//phi < pi
				theta = Math.PI - phi;
			}
			else { //actually phi is greater than pi, but acos outputs 2*pi - phi instead (I guess)
				theta = Math.PI + phi;
			}
			//console.log("AB, BC, cross, phi, theta: ", AB, BC, cross, phi, theta);
			if (theta < mintheta){
				leftest = c;
				mintheta = theta;
			}
		}
	}
	if (leftest == -1){//edge does not lead into circle
		return false;
	}
	visited.push(b);
	return dfs_left(b,leftest);
}


function check_if_face_exists(face){//checks if a newly calculated face exists;
	for (i in faces){
		face2 = faces[i];
		if (face2.length != face.length){
			continue;
		}
		var fits = true;
		for (j in face2){
			if (face[j] != face2[j]){
				fits = false;
				break;
			}
		}
		if (fits){
			return true;
		}
	}
	return false;
}


function calc_polygon_area(face){
	var sum = 0.0;
	var n = face.length;
	sum += coordinates[face[n-1]][0]*coordinates[face[0]][1] - coordinates[face[0]][0]*coordinates[face[n-1]][1];
	for (var i = 0; i < n-1; i++){
		sum += coordinates[face[i]][0]*coordinates[face[i+1]][1] - coordinates[face[i+1]][0]*coordinates[face[i]][1];
	}
	var area = Math.abs(sum/2);
	return area;
}

hulls = {};//the hull of each component (component id as key)
cmpnt_areas = {};//cmpnt id as key
function calc_hulls(){
	for (var i = 0; i < faces.length; i++){
		var face = faces[i];
		var cmpnt = find_set(face[0]);
		if (!(cmpnt in cmpnt_areas)){
			cmpnt_areas[cmpnt] = calc_polygon_area(face);
			hulls[cmpnt] = face;
		} else {
			if (calc_polygon_area(face) > cmpnt_areas[cmpnt]){
				cmpnt_areas[cmpnt] = calc_polygon_area(face);
				hulls[cmpnt] = face;
			}
		}
	}
}


cnt_faces = {}//component id is key //there is no entry for a component without faces
function cnt_faces_of_cmpnts(){//including the hull
	for (var i = 0; i < faces.length; i++){
		var cmpnt = find_set(faces[i][0]);
		if (!(cmpnt in cnt_faces)){
			cnt_faces[cmpnt] = 1;
		}
		else {
			cnt_faces[cmpnt]++;
		}
	}
}

var faces_of_edges = {};

//maybe make that one calc_faces and then create a new method for finding the dual graph from the given faces
function calc_faces(){//should be O(m^2) (which is about O(n^2) because of planarity)
	for (var i = 0; i < graph.length; i++){
		if (graph[i].length == 1){
			continue;
		}
		for (var j = 0; j < graph[i].length; j++){
			visited.splice(0);
			//console.log("Now new DFS: ", i, j, graph[i][j]);
			visited.push(i);
			if (!dfs_left(i, graph[i][j])){
				continue;
			}
			//find min in visited array
			var min = Math.min.apply(Math, visited);
			var idx = index_of(visited, min);
			//maybe rotate array to min
			//console.log("visited: ", visited);
			var rotated = visited.splice(idx).concat(visited.splice(0,idx));//may not work if visited is spliced directly, but it should probably still work
			//maybe reverse the order (reverse visited[1:] (?))
			var face = rotated;
			if (rotated[1] > rotated[rotated.length-1]){
				face = [min].concat(rotated.splice(1).reverse());
			}
			//console.log(face, check_if_face_exists(face));
			if (!check_if_face_exists(face)){ //maybe delete all the dual_graph stuff from here
				face_idx = faces.length;
				faces.push(face);
			}
		}
	}
	//delete the hulls (if they are not the only faces of the component)
	cnt_faces_of_cmpnts();
	calc_hulls();
	var new_faces = [];
	for (var i = 0; i < faces.length; i++){
		var face = faces[i];
		var cmpnt = find_set(faces[i][0]);
		if (!(face == hulls[cmpnt] && cnt_faces[cmpnt] != 1)){//not sure if list comparison works
			new_faces.push(face);
		}
	}
	faces = new_faces;//hopefully that also works outside of the function scope, otherwise try deepcopy
}


var faces_of_edges = {};
function calc_dual_graph(as_multigraph=false){
	var edges = new Set();//only contains edges that appear in a face
	calc_faces();
	//var edges_of_faces = [];
	for (var i = 0; i < faces.length; i++){
		dual_graph.push([]);
		var f1 = faces[i];
		var edge = [Math.min(f1[f1.length-1],f1[0]),Math.max(f1[f1.length-1],f1[0])];
		//edges_of_faces.push([edge])
		if (!(edge in faces_of_edges)){
			faces_of_edges[edge] = [];
		}
		faces_of_edges[edge].push(i);
		if (!edges.has(edge)){//hopefully does not compare by reference
			edges.add(edge);
		}
		for (var j = 0; j < f1.length-1; j++){
			edge = [Math.min(f1[j],f1[j+1]),Math.max(f1[j],f1[j+1])];
			if (!(edge in faces_of_edges)){
				faces_of_edges[edge] = [];
			}
			faces_of_edges[edge].push(i);
			if (!edges.has(edge)){
				edges.add(edge);
			}
			//edges_of_faces[i].push(edge);
		}
		//edges_of_faces[i].sort();//just for (unneeded) performance (for quicker intersection calculation)
	}
	//finding which faces share edges
	var num_faces = faces.length;
	for (let edge of edges){
		console.log("edge, facesOfEdge: ", edge, faces_of_edges[edge]);
		if (faces_of_edges[edge].length == 1){
			if (!(dual_graph[faces_of_edges[edge][0]].includes(num_faces)) || as_multigraph){
				dual_graph[faces_of_edges[edge][0]].push(num_faces);
				dual_graph[num_faces].push(faces_of_edges[edge][0]);
			}
		}
		else if (faces_of_edges[edge].length == 2){
			if (!(dual_graph[faces_of_edges[edge][0]].includes(faces_of_edges[edge][1])) || as_multigraph){
				dual_graph[faces_of_edges[edge][0]].push(faces_of_edges[edge][1]);
				dual_graph[faces_of_edges[edge][1]].push(faces_of_edges[edge][0]);
			}
		}
		else {
			console.log("Something is wrong! Faces of edge ", edge, ": ", faces_of_edges[edge]);
		}
	}
}

////////////////////////////////////////////////////////////////////




var reference_point = [-371,-731];//just some random point outside (random so that it may be unlikely to cut exactly through a vertex, which would ruin the algorithm)
function num_intersections_from_outside(mid_point, face){
	var num_intersections = 0;
	var n = face.length;
	var line = reference_point.concat(mid_point);
	//calc how many intersections there are
	for (i in face){
		var edge = [face[i], face[(i+1)%n]];
		var edge_representation = coordinates[edge[0]].concat(coordinates[edge[1]]);
		if (intersection(line,edge_representation) != -1){
			num_intersections++;
		}
	}
	return num_intersections;
}

function check_if_new_face(new_edge){//TODO: test if it is correct for all lines
	if (find_set(new_edge[0]) == find_set(new_edge[1])){
		return true;
	}
	return false;
}

function find_face(new_edge){
	//calculate which face will be splitted
	p1 = coordinates[new_edge[0]];
	p2 = coordinates[new_edge[1]];
	mid_point = [(p1[0]+p2[0])/2, (p1[1],p2[1])/2];
	for (i in faces){
		face = faces[i];
		if (num_intersections_from_outside(mid_point, face)%2 == 1){//if sth fails check if there really is exactly one face with uneven intersections
			return i;
		}
	}
	console.log("something went wrong; could not find face that is split")
}


function intersection(path1, path2){
	var grace = 0; //set to 20 for special debugging

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
			for(adjacent_node in adjacent_edges[adjacent_edge]){
				if(adjacent_edges[adjacent_edge][adjacent_node] == element){
					after_edge = !after_edge;
					face1.push(new_edge[adjacent_node]);
					face2.push(new_edge[adjacent_node]);
					adjacent_edges[adjacent_edge] = [-1,-1];
				}
			}
		}

		if(!after_edge){
			face1.push(element);
		}else{
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







/*TODOS
 - verify that the edges are correctly extracted from the line and that the graph is correct
 - make check_new_face work (fix union-find structure?)
 - make find_face work
 - brainstorm how to best split the face (or how to best calculate the dual graph and then split the face based on that)
 - implement the best method for splitting a face
 - assign random colors to faces for now
(test after each of those steps)
*/


// Calculate components of dual graph

function get_components(){
	var components = [];

	for(v in dual_graph){
		for(component in components){
			if(components[component].includes(v)){
				continue;
			}
		}

		var new_component = dfs(v, []);
		components.push(new_component);
	}

	return components;
}

function dfs(v){
	var nodes = [];
	for(adjacent_node in dual_graph[v]){
		if(!nodes.includes(adjacent_node)){
			nodes.push(adjacent_node);
			var secondary_adjacent_nodes = dfs(adjacent_node, nodes);
			nodes.concat(secondary_adjacent_nodes);
		}
	}
}



// Creating component graph

function calculate_components_graph(components){
	var component_graph = Array(components.length).fill([]);

	for(face in faces){
		for(component in components){
			if(is_in_face(components[component][0], faces[face])){
				component_graph[component].push(get_component_for(faces[face][0], components));
			}
		}
	}

	// Graph clean-up
	for(node in component_graph){
		remove_inferior_nodes(node, component_graph);
	}
}


function remove_inferior_nodes(node, component_graph){
	var nodes_to_delete = [];

	for(adjacent_node in component_graph[node]){
		nodes_to_delete.concat(remove_inferior_nodes(adjacent_node, component_graph));
	}

	var new_adjacency = [];

	for(adjacent_node in component_graph[node]){
		var will_stay = true;
		for(node_to_delete in nodes_to_delete){
			if(component_graph[node][adjacent_node].includes(nodes_to_delete[node_to_delete])){
				will_stay = false;
			}
		}
		if(will_stay){
			new_adjacency.push(component_graph[node][adjacent_node]);
		}
	}

	component_graph[node] = new_adjacency;

	nodes_to_delete.concat(component_graph[node]);
	return nodes_to_delete;
}


function is_in(face, v){
	var intersections = 0;

	var v_coordinates = coordinates[v];
	var reference_line = [[-1, -1], v_coordinates];

	for(edge in face){
		var border_line = [coordinates(face[edge % face.length]), coordinates(face[(edge + 1) % face.length])];
		var border_intersection = intersection(border_line, reference_line);
		if(border_intersection != -1){ //?
			intersections += 1;
		}
	}

	return (intersections % 2) == 1;
}


function get_component_for(node, components){
	for(component in components){
		if(components[component].includes(node)){
			return component;
		}
	}
	return -1;
}


// Calculate coloring order

function calculate_coloring_order(component_graph){
	var order = [];
	topsort(0, component_graph, order); // 0 start node
	return order;
}

function topsort(v, component_graph, order){
	order.push(v);
	for(adjacent_node in component_graph[v]){
		topsort(component_graph[adjacent_node], component_graph, order);
	}
}




// Calculate coloring

function calculate_color_configuration(){
	var coloring = Array(dual_graph.length).fill(-1);
	coloring = recursive_color(coloring, 0);
	return coloring;
}

function recursive_color(coloring, v){
	if(v == dual_graph.length){
		return coloring;
	}

	for(var i = 0; i < 4; i++){
		var temp_coloring = JSON.parse(JSON.stringify(coloring));
		temp_coloring[v] = i;
		if(check_coloring_for(v, i, temp_coloring)){
			var result = recursive_color(temp_coloring, (v+1));
			if(result != false){
				return result;
			}
		}
	}
	return false;
}


function check_coloring_for(node, color, coloring){
	for(v in dual_graph[node]){
		if(coloring[dual_graph[node][v]] ==  color){ return false; }
	}
	return true;
}
