/*
    Author: Henrique Miranda
    Year: 2016

    Based on:
    Three.js "tutorials by example"
    Author: Lee Stemkoski
    Date: July 2013 (three.js v59dev)
*/

// standard global variables
var container, scene, camera, renderer, controls, stats;
var clock = new THREE.Clock();

// custom global variables
var points = [];
var values = [];
var sizex, sizey, sizez;

init();
animate();

// FUNCTIONS
function init()
{
    $.ajaxSetup({
        async: false
    });

    //load json file
    $.getJSON('datagrid.json', function(data) {
      values = data["datagrid"];
      sizex = data["nx"];
      sizey = data["ny"];
      sizez = data["nz"];
      cell = data["cell"];
    });

    // SCENE
    scene = new THREE.Scene();
    // CAMERA
    var SCREEN_WIDTH = window.innerWidth, SCREEN_HEIGHT = window.innerHeight;
    var VIEW_ANGLE = 10, ASPECT = SCREEN_WIDTH / SCREEN_HEIGHT, NEAR = 0.1, FAR = 20000;
    camera = new THREE.PerspectiveCamera( VIEW_ANGLE, ASPECT, NEAR, FAR);
    scene.add(camera);
    camera.position.set(0,0,300);
    camera.lookAt(scene.position);
    // RENDERER
    if ( Detector.webgl )
        renderer = new THREE.WebGLRenderer( {antialias:true} );
    else
        renderer = new THREE.CanvasRenderer();
    renderer.setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
    container = document.getElementById( 'ThreeJS' );
    container.appendChild( renderer.domElement );
    // CONTROLS
    controls = new THREE.OrbitControls( camera, renderer.domElement );
    // STATS
    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.bottom = '0px';
    stats.domElement.style.zIndex = 100;
    container.appendChild( stats.domElement );
    // LIGHT
    light = new THREE.DirectionalLight( 0xffffff );
    light.position.set( 0, 0, 100 );
    light.castShadow = false;
    scene.add( light );
    light = new THREE.AmbientLight( 0x222222 );
    scene.add( light );

    ////////////
    // CUSTOM //
    ////////////

    // Generate a list of 3D points and values at those points
    for (var k = 0; k < sizez; k++)
    for (var j = 0; j < sizey; j++)
    for (var i = 0; i < sizex; i++)
    {
        // actual values
        var x = i / (sizex - 1) - 0.5;
        var y = j / (sizey - 1) - 0.5;
        var z = k / (sizez - 1) - 0.5;
        points.push( new THREE.Vector3(x*cell[0][0]+y*cell[1][0]+z*cell[2][0],
                                       x*cell[0][1]+y*cell[1][1]+z*cell[2][1],
                                       x*cell[0][2]+y*cell[1][2]+z*cell[2][2]));
    }

    // Marching Cubes Algorithm
    var size2 = sizex * sizey;

    // Vertices may occur along edges of cube, when the values at the edge's endpoints
    //   straddle the isolevel value.
    // Actual position along edge weighted according to function values.
    var vlist = new Array(12);

    var geometry = new THREE.Geometry();
    var vertexIndex = 0;

    for (var z = 0; z < sizez - 1; z++)
    for (var y = 0; y < sizey - 1; y++)
    for (var x = 0; x < sizex - 1; x++)
    {
        // index of base point, and also adjacent points on cube
        var p    = x + sizex * y + size2 * z,
            px   = p   + 1,
            py   = p   + sizex,
            pxy  = py  + 1,
            pz   = p   + size2,
            pxz  = px  + size2,
            pyz  = py  + size2,
            pxyz = pxy + size2;

        // store scalar values corresponding to vertices
        var value0 = values[ p    ],
            value1 = values[ px   ],
            value2 = values[ py   ],
            value3 = values[ pxy  ],
            value4 = values[ pz   ],
            value5 = values[ pxz  ],
            value6 = values[ pyz  ],
            value7 = values[ pxyz ];

        // place a "1" in bit positions corresponding to vertices whose
        //   isovalue is less than given constant.

        var isolevel = 0.05;

        var cubeindex = 0;
        if ( value0 < isolevel ) cubeindex |= 1;
        if ( value1 < isolevel ) cubeindex |= 2;
        if ( value2 < isolevel ) cubeindex |= 8;
        if ( value3 < isolevel ) cubeindex |= 4;
        if ( value4 < isolevel ) cubeindex |= 16;
        if ( value5 < isolevel ) cubeindex |= 32;
        if ( value6 < isolevel ) cubeindex |= 128;
        if ( value7 < isolevel ) cubeindex |= 64;

        // bits = 12 bit number, indicates which edges are crossed by the isosurface
        var bits = THREE.edgeTable[ cubeindex ];

        // if none are crossed, proceed to next iteration
        if ( bits === 0 ) continue;

        // check which edges are crossed, and estimate the point location
        //    using a weighted average of scalar values at edge endpoints.
        // store the vertex in an array for use later.
        var mu = 0.5;

        // bottom of the cube
        if ( bits & 1 )
        {
            mu = ( isolevel - value0 ) / ( value1 - value0 );
            vlist[0] = points[p].clone().lerp( points[px], mu );
        }
        if ( bits & 2 )
        {
            mu = ( isolevel - value1 ) / ( value3 - value1 );
            vlist[1] = points[px].clone().lerp( points[pxy], mu );
        }
        if ( bits & 4 )
        {
            mu = ( isolevel - value2 ) / ( value3 - value2 );
            vlist[2] = points[py].clone().lerp( points[pxy], mu );
        }
        if ( bits & 8 )
        {
            mu = ( isolevel - value0 ) / ( value2 - value0 );
            vlist[3] = points[p].clone().lerp( points[py], mu );
        }
        // top of the cube
        if ( bits & 16 )
        {
            mu = ( isolevel - value4 ) / ( value5 - value4 );
            vlist[4] = points[pz].clone().lerp( points[pxz], mu );
        }
        if ( bits & 32 )
        {
            mu = ( isolevel - value5 ) / ( value7 - value5 );
            vlist[5] = points[pxz].clone().lerp( points[pxyz], mu );
        }
        if ( bits & 64 )
        {
            mu = ( isolevel - value6 ) / ( value7 - value6 );
            vlist[6] = points[pyz].clone().lerp( points[pxyz], mu );
        }
        if ( bits & 128 )
        {
            mu = ( isolevel - value4 ) / ( value6 - value4 );
            vlist[7] = points[pz].clone().lerp( points[pyz], mu );
        }
        // vertical lines of the cube
        if ( bits & 256 )
        {
            mu = ( isolevel - value0 ) / ( value4 - value0 );
            vlist[8] = points[p].clone().lerp( points[pz], mu );
        }
        if ( bits & 512 )
        {
            mu = ( isolevel - value1 ) / ( value5 - value1 );
            vlist[9] = points[px].clone().lerp( points[pxz], mu );
        }
        if ( bits & 1024 )
        {
            mu = ( isolevel - value3 ) / ( value7 - value3 );
            vlist[10] = points[pxy].clone().lerp( points[pxyz], mu );
        }
        if ( bits & 2048 )
        {
            mu = ( isolevel - value2 ) / ( value6 - value2 );
            vlist[11] = points[py].clone().lerp( points[pyz], mu );
        }

        // construct triangles -- get correct vertices from triTable.
        var i = 0;
        cubeindex <<= 4;  // multiply by 16...
        // "Re-purpose cubeindex into an offset into triTable."
        //  since each row really isn't a row.

        // the while loop should run at most 5 times,
        //   since the 16th entry in each row is a -1.
        while ( THREE.triTable[ cubeindex + i ] != -1 )
        {
            var index1 = THREE.triTable[cubeindex + i];
            var index2 = THREE.triTable[cubeindex + i + 1];
            var index3 = THREE.triTable[cubeindex + i + 2];

            geometry.vertices.push( vlist[index1].clone() );
            geometry.vertices.push( vlist[index2].clone() );
            geometry.vertices.push( vlist[index3].clone() );
            var face = new THREE.Face3(vertexIndex, vertexIndex+1, vertexIndex+2);
            geometry.faces.push( face );

            geometry.faceVertexUvs[ 0 ].push( [ new THREE.Vector2(0,0), new THREE.Vector2(0,1), new THREE.Vector2(1,1) ] );

            vertexIndex += 3;
            i += 3;
        }
    }

    geometry.computeFaceNormals();
    geometry.computeVertexNormals();

    var colorMaterial =  new THREE.MeshLambertMaterial( {color: 0xffff00, side: THREE.DoubleSide} );
    var mesh = new THREE.Mesh( geometry, colorMaterial );
    scene.add(mesh);
}

function animate()
{
    requestAnimationFrame( animate );
    render();
    update();
}

function update()
{
    controls.update();
    stats.update();
}

function render()
{
    renderer.render( scene, camera );
}
