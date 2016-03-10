
function shareMap (){

    var ids = [];
    for (key in ht.items) {
      ids.push(readCache(key).source);
    }
    
    for (var i = page.history.length - 1; i >= 0; i--) {
      ids.push(page.history[i])
    };
    return encodeListIds(ids);
};



/*
    Function to carry out the actual PUT request to S3 using the signed request from the Python app.
*/
function upload_file(file, signed_request, url){
    var xhr = new XMLHttpRequest();
    xhr.open("PUT", signed_request);
    xhr.setRequestHeader('x-amz-acl', 'public-read');
    xhr.onload = function() {
        if (xhr.status === 200) {
            // document.getElementById("preview").src = url;            
            // document.getElementById("avatar_url").value = url;
            console.log('Static file saved. Ready to share!');
        }
    };
    xhr.onerror = function() {
        alert("Could not upload file."); 
    };
    xhr.send(file);
}

/*
    Function to get the temporary signed request from the Python app.
    If request successful, continue to upload the file using this signed
    request.
*/
function get_signed_request(file){
    var _S3_ENDPOINT = 'http://gg4u-2.local:7000';
    var _S3_ENDPOINT = '';
    // 
    var xhr = new XMLHttpRequest();
    xhr.open("GET", _API + "/api/sign_s3?file_name="+file.name+"&file_type="+file.type);
    xhr.onreadystatechange = function(){
        if(xhr.readyState === 4){
            if(xhr.status === 200){
                var response = JSON.parse(xhr.responseText);
                upload_file(file, response.signed_request, response.url);
            }
            else{
                alert("Could not get signed URL.");
            }
        }
    };
    xhr.send();
}

/*
   Function called when file input updated. If there is a file selected, then
   start upload procedure by asking for a signed request from the app.
*/
function init_upload(){
    var fileObject = returnSaveGraphJson();
    var name = fileObject['title'];
    var token,
        d = new Date();

    var file = new Blob([JSON.stringify(fileObject)], {type: "application/json"});
    token = d.getFullYear()+'-'+d.getMonth()+'-'+d.getDate();

    file.name = token + '-' + name.replace(/\s/g, "-").replace(/[^a-zA-Z0-9-_]/g, '') + '.json';
    // var files = document.getElementById("file_input").files;
    // var file = files[0];
    if(file == null){
        alert("No file selected.");
        return;
    }
    get_signed_request(file);
}

/*
   Utility to define which nodes are important in a force-directed graph
   Here I use centrality measures.
*/

function getMostRelevantNodes(graph, numberOfNodes) {
    var calculator =Viva.Graph.centrality();
    var p = calculator.betweennessCentrality(graph);
    if (numberOfNodes < 0) { numberOfNodes = p.length; };
    return p.splice(0,numberOfNodes);
}


/*
  Format title map with a designed pattern.
  Pattern will contain info about the object so to enhance UX if larger objects will be loaded
*/

function formatTitleMap(graph, numberOfNodes) {

  if (numberOfNodes === undefined) {
    numberOfNodes = 3;
  }; 

  var mostRelevantNodes = getMostRelevantNodes(graph, numberOfNodes); 
  var titles = ['context of  '];
  for (var i = 0; i < mostRelevantNodes.length - 1; i++) {
     try {
        titles.push(readCache(mostRelevantNodes[i].key).name);
     } catch(err) {
       console.log('hu, error name for topic', mostRelevantNodes[i].key);
     }
  };

  // format title with ', ' and ' and '
  // console.log('titles',titles);
  if (titles.length > 3) { 
    for (var i = titles.length-2; i >= 2; i--) {
      // console.log('el', i, titles.length);
      titles.splice(i,0,', ');
    };
  };
  titles.splice(titles.length - 1, 0, ' and ');
  return titles.join('') + '- in ' + 10 * Math.round(graph.getNodesCount()/10) +' topics';
  // return titles.join('-');
}


/*
  This will simply format my maps into json objs
  Structure here complies with other APIs, so to keep same engineering for querying, disocvery and sharing
*/

function saveGraphJson(graph) {

  // object
  var object = {};

  // author, version, title
  var author = {'description' : 'Created with Nifty.works - Nifty.Works, Awesome3.co, ForbiddenForest.io',
                'author' : 'Developed by Luigi Assom'
               };
  var licence = {
                'type' : 'https://creativecommons.org/licenses/by-nc-nd/3.0/',
                'terms' : {
                  'share' : 'copy and redistribute the material in any medium or format',
                  'attribution' : 'You must provide the name supplied in authorship.',
                  'noncommercial' : 'You cannot use the material for commercial use (including, not exclusively, demo of products and free-trials) or monetary compensation.',
                  'noDerivatives' : 'If you remix, transform, or build upon the material, you may not distribute the modified material. Please contact author at : Facebook Page - Forbidden Forest or luigi.assom [at] gmail.com',
                  'permissions' : 'Contact the author for permissions in educations in higher institutes, universities and/or research and development projects involving the use of this object as data.',
                  'suggestedUse' : 'Personal note from the author: You are strongly encouraged to disseminate this map and build visualizations for educational purposes and social impact, such as: reducing asymmetries in education; communication of knowledge and science; fostering dialogue for building and communicate opinions with emotional intelligence and empathy; mutual recognition of cultural diversity; actualizing the production of new knowledge. I am happy to follow or help with your creative ideas and willing to visit your project around the world! I particularly care about sustainiblity through reduction of relative poverty, environmental conservation, innovation and entrepreneurship, complex networks [memory + sociology + governance of innovation + biology] - thank you! Luigi'
                  }
                };
  var version = {'version' : 'Awesome3 - beta_2.0'};
  var title = formatTitleMap(graph,4);

  object['version'] = version,
  object['authorship'] = author,
  object['licence'] = licence,
  object['title'] = title;
  
  // topology
  var path = [],
    weight = 0;
  graph.forEachLink(function(link){
     path.push({'from' : link['fromId'], 'to' : link['toId'], 'proximity' : link['data']['proximity']});
     weight += link['data']['proximity'];
  });

  object['all_paths'] = [{'path' : path, 'weight' : weight}];

  // essential info
  var nodes = [];
  graph.forEachNode(function(node){
     var uid = node['id'],
      name = readCache(uid).name,
      source = readCache(uid).source;

     nodes.push({'uid' : uid, 'name' : name, 'source' : source});
  });

  object['nodes'] = nodes;

  // first, last node
  var fromNode = {},
    toNode = {};

  var start = readCache(page.history[0]),
      end = readCache(page.history[0]);

  if (page.history.length > 2) { end = readCache(page.history[page.history.length - 2]) };
  // else { end = readCache(page.history[0])};

  // console.log('page history title', readCache(page.history[0]), readCache(page.history[0]).uid);
  
  fromNode = {'uid' : start.uid, 'name' : start.name, 'source' : start.source};
  toNode = {'uid' : end.uid, 'name' : end.name, 'source' : end.source};

  object['fromNode'] = fromNode;
  object['toNode'] = toNode;

  // eventually update with information for static pages
  decorators = [];
  for (var i = nodes.length - 1; i >= 0; i--) {

    var n = ht.getItem(nodes[i]['uid']);

    try {
      decorators.push({'uid' : nodes[i]['uid'], 'thumbnail' : n.thumbnail, 'description' : n.description})
    } catch(err) {
      console.log(err, 'Node does not carry info yet. Tap on it and discover!')
    }
  };

  object['decorators'] = decorators;

  // 

  return object
}
