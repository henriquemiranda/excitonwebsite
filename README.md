exciton website
===============

Visualize excitonic wavefunctions.

This project aims to create an interactive website where the user can visualize different excitonic wavefunctions.

The exciton is a bound state of and hole and an electron.
We use yambo ypp to generate a representation of electron density when the hole is fixed.
This is done for the excitons with the highest intensity.
The user can click in the absorption spectra and visualize the electron density that corresponds to that particular state.

contribute
==========

The project is still under development, suggestions and bugfixes are welcome!

If you would like to see some data added here please contact me:  
miranda.henrique at gmail.com

Currently you can use the read_exc.py python script to run and read the excitons calculated using yambo and ypp.
In the future interfaces with other codes should be added.

author
======
Henrique Miranda

Using the following packages:

- The WebGL visualization is made using Three.js: http://threejs.org/
- The absorption spectra is made using highcharts.js: http://www.highcharts.com/
- For plot the isosurface I used the marching cubes algorithm as implemented in: https://stemkoski.github.io/Three.js/

- Quantum Espresso Website: http://www.quantum-espresso.org/
- Yambo website: http://www.yambo-code.org/
