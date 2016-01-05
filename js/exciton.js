/*
    Author: Henrique Miranda
    Year: 2016

    Based on:
    Three.js "tutorials by example"
    Author: Lee Stemkoski
    Date: July 2013 (three.js v59dev)
*/

ExcitonWf = {
  container: null,
  scene: null,
  camera: null,
  renderer: null,
  controls: null,
  stats: null,
  points: [],
  values: null,
  sizex: 1,
  sizey: 1,
  sizez: 1,
  cell: null,

  //camera
  cameraViewAngle: 10,
  cameraNear: 0.1,
  cameraFar: 2000,

  init: function(container) {
      this.container = container;
      container0 = container.get(0);
      this.dimensions = this.getContainerDimensions();

      // SCENE
      this.scene = new THREE.Scene();

      //camera
      this.camera = new THREE.PerspectiveCamera( this.cameraViewAngle, this.dimensions.ratio, this.cameraNear, this.cameraFar);
      this.camera.position.set(0,0,300);
      this.camera.lookAt(this.scene.position);
      this.scene.add(this.camera);

      //renderer
      if ( Detector.webgl )
          this.renderer = new THREE.WebGLRenderer( {antialias:true} );
      else
          this.renderer = new THREE.CanvasRenderer();
      this.renderer.setSize(this.dimensions.width, this.dimensions.height);
      container0.appendChild( this.renderer.domElement );

      //controls
      this.controls = new THREE.OrbitControls( this.camera, this.renderer.domElement );

      //stats
      this.stats = new Stats();
      this.stats.domElement.style.position = 'absolute';
      this.stats.domElement.style.bottom = '0px';
      this.stats.domElement.style.zIndex = 100;
      container0.appendChild( this.stats.domElement );

      //lights
      this.addLights();

      // Generate a list of 3D points and values at those points
      var cell = this.cell;
      for (var k = 0; k < this.sizez; k++)
      for (var j = 0; j < this.sizey; j++)
      for (var i = 0; i < this.sizex; i++)
      {
          // actual values
          var x = i / (this.sizex - 1) - 0.5;
          var y = j / (this.sizey - 1) - 0.5;
          var z = k / (this.sizez - 1) - 0.5;

          this.points.push( new THREE.Vector3(x*cell[0][0]+y*cell[1][0]+z*cell[2][0],
                                              x*cell[0][1]+y*cell[1][1]+z*cell[2][1],
                                              x*cell[0][2]+y*cell[1][2]+z*cell[2][2]));
      }

      this.addMarchingCubes();
  },

  getData: function(filename) {
    $.getJSON(filename, function(data) {
      e.values = data["datagrid"];
      e.sizex = data["nx"];
      e.sizey = data["ny"];
      e.sizez = data["nz"];
      e.cell = data["cell"];
    });
  },

  getContainerDimensions: function() {
      w = this.container.width(), h = this.container.height();

      return {
          width: w,
          height: h,
          ratio: ( w / h )
      };
  },

  addLights: function() {
      var light;
      light = new THREE.DirectionalLight( 0xffffff );
      light.position.set( 0, 0, 100 );
      light.castShadow = false;
      this.scene.add( light );
      light = new THREE.AmbientLight( 0x222222 );
      this.scene.add( light );
  },

  addMarchingCubes: function() {

      // Marching Cubes Algorithm
      var sizex = this.sizex;
      var sizey = this.sizey;
      var sizez = this.sizez;
      var values = this.values;
      var points = this.points;
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
      this.scene.add(mesh);
  },

  animate: function() {
      requestAnimationFrame( this.animate.bind(this) );
      this.render();
      this.update();
  },

  update: function() {
      this.controls.update();
      this.stats.update();
  },

  render: function() {
      this.renderer.render( this.scene, this.camera );
  }
}

$.ajaxSetup({
    async: false
});

$(document).ready(function(){
  e = ExcitonWf;
  e.getData('datagrid.json');
  e.init($('#excitonwf'))
  e.animate();
});
