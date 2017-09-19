/*
    Author: Henrique Miranda
    Year: 2016
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
  isolevel: 0.05,

  //camera
  cameraViewAngle: 10,
  cameraNear: 0.1,
  cameraFar: 5000,
  cameraDistance: 300,

  //balls
  sphereRadius: 0.5,
  sphereLat: 12,
  sphereLon: 12,
  bondRadius: 0.1,
  bondSegments: 6,
  bondVertical: 1,

  init: function(container) {
      this.container = container;
      container0 = container.get(0);
      this.dimensions = this.getContainerDimensions();

      // SCENE
      this.scene = new THREE.Scene();

      //camera
      this.camera = new THREE.PerspectiveCamera( this.cameraViewAngle, this.dimensions.ratio, this.cameraNear, this.cameraFar);
      this.camera.position.set(0,0,this.cameraDistance);
      this.camera.lookAt(this.scene.position);
      //add lights to the camera
      pointLight = new THREE.PointLight( 0x999999 );
      pointLight.position.set(1,1,2);
      this.camera.add(pointLight);

      //renderer
      this.renderer = new THREE.WebGLRenderer( {antialias:true} );
      this.renderer.setClearColor( 0xffffff );
      this.renderer.setPixelRatio( window.devicePixelRatio );
      this.renderer.shadowMap.enabled = false;
      this.renderer.setSize( this.dimensions.width , this.dimensions.height, false );
      container0.appendChild( this.renderer.domElement );

      window.addEventListener( 'resize', this.onWindowResize.bind(this), false );

      //controls
      this.controls = new THREE.TrackballControls( this.camera, this.renderer.domElement );
      this.controls.rotateSpeed = 1.0;
      this.controls.zoomSpeed = 1.0;
      this.controls.panSpeed = 0.3;
      this.controls.noZoom = false;
      this.controls.noPan = false;
      this.controls.staticMoving = true;
      this.controls.dynamicDampingFactor = 0.3;

      //stats
      this.stats = new Stats();
      this.stats.domElement.style.position = 'absolute';
      this.stats.domElement.style.bottom = '0px';
      this.stats.domElement.style.zIndex = 100;
      container0.appendChild( this.stats.domElement );

      this.updateStructure();
  },

  getData: function(absorption) {
    this.exciton_index = a.exciton_index;
    this.excitons = absorption.excitons;
    this.values = absorption.excitons[this.exciton_index]["datagrid"];
    this.sizex  = absorption.sizex;
    this.sizey  = absorption.sizey;
    this.sizez  = absorption.sizez;
    this.cell   = absorption.cell;
    //this.nndist = absorption.nndist;
    this.atoms  = absorption.atoms;
    this.natoms = absorption.atoms.length;
    this.atom_numbers = absorption.atom_numbers;

    //get geometric center
    this.geometricCenter = new THREE.Vector3(0,0,0);
    for (i=0;i<this.atoms.length;i++) {
        pos = new THREE.Vector3(this.atoms[i][1], this.atoms[i][2], this.atoms[i][3]);
        this.geometricCenter.add(pos);
    }
    this.geometricCenter.multiplyScalar(1.0/this.atoms.length);

  },

  getContainerDimensions: function() {
      w = this.container.width(), h = this.container.height();

      return {
          width: w,
          height: h,
          ratio: ( w / h )
      };
  },

  getAtypes: function() {
      this.materials = [];
      for (i=0;i<this.atom_numbers.length;i++) {
          var n = this.atom_numbers[i];
          r = jmol_colors[n][0];
          g = jmol_colors[n][1];
          b = jmol_colors[n][2];

          var material = new THREE.MeshLambertMaterial( { blending: THREE.AdditiveBlending } );
          material.color.setRGB (r, g, b);

          this.materials.push( material );
      }
  },

  addStructure: function(phonon) {
      this.atomobjects = [];
      this.bondobjects = [];
      this.atompos = [];
      this.bonds = [];
   
      var sphereGeometry = new THREE.SphereGeometry(this.sphereRadius,this.sphereLat,this.sphereLon);

      //add a ball for each atom
      for (i=0; i<this.atoms.length;i++) {

          object = new THREE.Mesh( sphereGeometry, this.materials[this.atoms[i][0]] );
          pos = new THREE.Vector3(this.atoms[i][1], this.atoms[i][2], this.atoms[i][3]);
          pos.sub(this.geometricCenter);

          object.position.copy(pos);
          object.name = "atom";
          object.atom_number = this.atom_numbers[this.atoms[i][0]];

          this.scene.add( object );
          this.atomobjects.push(object);
          this.atompos.push( pos );
      }

      //obtain combinations two by two of all the atoms
      var combinations = getCombinations( this.atomobjects );
      var a, b, length;
      var material = new THREE.MeshLambertMaterial( { color: 0xffffff,
                                                      blending: THREE.AdditiveBlending } );

      for (i=0;i<combinations.length;i++) {
          a = combinations[i][0];
          b = combinations[i][1];
          ad = a.position;
          bd = b.position;

          //if the separation is smaller than the sum of the bonding radius create a bond
          length = ad.distanceTo(bd)
          if ( length < covalent_radii[a.atom_number]+covalent_radii[b.atom_number] ) {
              this.bonds.push( [ad,bd,length] );

              //get transformations
              var bond = getBond(ad,bd);

              var cylinderGeometry =
                  new THREE.CylinderGeometry(this.bondRadius,this.bondRadius,length,
                                             this.bondSegments,this.bondVertical,true);

              //create cylinder mesh
              var object = new THREE.Mesh(cylinderGeometry, material);

              object.setRotationFromQuaternion( bond.quaternion );
              object.position.copy( bond.midpoint )
              object.name = "bond";

              this.scene.add( object );
              this.bondobjects.push( object );
          }
      }


  },

  addLights: function() {
      var light;

      this.scene.add(this.camera);

      light = new THREE.AmbientLight( 0x333333 );
      this.scene.add( light );
  },

  removeStructure: function() {
      var nobjects = this.scene.children.length;
      var scene = this.scene
      //just remove everything and then add the lights
      for (i=nobjects-1;i>=0;i--) {
          scene.remove(scene.children[i]);
      }
  },

  changeIsolevel: function(isolevel) {
      this.isolevel = isolevel;
      this.updateStructure();
  },

  setCameraDirection: function(direction) {
      if (direction == 'x') {
          this.camera.position.set( this.cameraDistance, 0, 0);
          this.camera.up.set( 0, 0, 1 );
      }
      if (direction == 'y') {
          this.camera.position.set( 0, this.cameraDistance, 0);
          this.camera.up.set( 0, 0, 1 );
      }
      if (direction == 'z') {
          this.camera.position.set( 0, 0, this.cameraDistance);
          this.camera.up.set( 0, 1, 0 );
      }
  },

  updateStructure: function() {
    this.values = this.excitons[this.exciton_index]["datagrid"];
    this.removeStructure();

    // Generate a list of 3D points and values at those points
    var cell = this.cell;
    this.points = [];
    for (var k = 0; k < this.sizez; k++)
    for (var j = 0; j < this.sizey; j++)
    for (var i = 0; i < this.sizex; i++)
    {
        // actual values
        var x = i / (this.sizex-1);
        var y = j / (this.sizey-1);
        var z = k / (this.sizez-1);

        this.points.push( new THREE.Vector3(x*cell[0][0]+y*cell[1][0]+z*cell[2][0],
                                            x*cell[0][1]+y*cell[1][1]+z*cell[2][1],
                                            x*cell[0][2]+y*cell[1][2]+z*cell[2][2]));
    }

    this.addLights();
    this.addMarchingCubes();
    this.getAtypes();
    this.addStructure();
  },

  addMarchingCubes: function() {
      /*
      Based on:
      Three.js "tutorials by example"
      Author: Lee Stemkoski
      Date: July 2013 (three.js v59dev)
      */

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

          var isolevel = this.isolevel;

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

      var colorMaterial =  new THREE.MeshLambertMaterial( {color: 0xffff00, side: THREE.DoubleSide, transparent: true, opacity: 0.5} );
      var mesh = new THREE.Mesh( geometry, colorMaterial );
      mesh.name = "isosurface";

      mesh.position.sub(this.geometricCenter);
      this.scene.add(mesh);
  },

  onWindowResize: function() {
      this.dimensions = this.getContainerDimensions();

      this.camera.aspect = this.dimensions.ratio;
      this.camera.updateProjectionMatrix();

      this.renderer.setSize( this.dimensions.width, this.dimensions.height, false );
      this.controls.handleResize();
      this.render();

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
