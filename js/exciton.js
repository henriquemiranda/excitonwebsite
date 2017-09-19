/*
    Author: Henrique Miranda
    Year: 2016
*/

//check if the tags are present and if so return their value
getTag = function(tags,object) {
    var ntags = tags.length;
    for (var i = 0; i < ntags; i++) {
        var tag = tags[i];
        if ((tag in object)) {
            return object[tag];
        }
    }
    alert(tags + " not found in the file. Please report the bug in the issues page: https://github.com/henriquemiranda/excitonwebsite/issues  and attach this file.");
    throw new Error(tags + " not found in the file.");
}

var vec_y = new THREE.Vector3( 0, 1, 0 );
function getBond( point1, point2 ) {
    var direction = new THREE.Vector3().subVectors(point2, point1);

    return { quaternion: new THREE.Quaternion().setFromUnitVectors( vec_y, direction.clone().normalize() ),
             midpoint: point1.clone().add( direction.multiplyScalar(0.5) ) };
}

/*
Get combintations 2 by two based on:
http://stackoverflow.com/questions/29169011/javascript-arrays-finding-the-number-of-combinations-of-2-elements
*/

function getCombinations(elements) {
    combos = [];
    for (var i = 0; i < elements.length; i++)
        for (var j = i + 1; j < elements.length; j++)
            combos.push([elements[i], elements[j]]);
    return combos;
}

//load a user providede file of the absorption
function loadCustomFile(event) {
    for (i=0; i<event.target.files.length; i++) {
        file = event.target.files[i];
        getFromJsonFile(file);
    }
}

getFromJsonFile = function(file) {
    var json_reader = new FileReader();

    json_reader.readAsText(file);

    json_reader.onloadend = function(placeholder) {
        string = json_reader.result;
        json = JSON.parse(string);

        //absorption spectra
        a.getDataObject(json);
        a.init($('#highcharts'));

        //exciton part
        e.getData(a);
        e.updateStructure();
    };
}

$.ajaxSetup({
    async: false
});

function updateAll() {
  a.getDataFilename(folder+'/absorptionspectra.json');
  a.init($('#highcharts'));
  e.getData(a);
  e.updateStructure();
}


$(document).ready(function(){
  folder = "bn";

  $('#file-input')[0].addEventListener('change', loadCustomFile, false);
  $('#file-input')[0].addEventListener('click', function() { this.value = '';}, false);

  a = AbsorptionSpectra;
  a.getDataFilename(folder+'/absorptionspectra.json');
  a.init($('#highcharts'));

  e = ExcitonWf;
  e.getData(a);
  e.init($('#excitonwf'));
  e.animate();
});
