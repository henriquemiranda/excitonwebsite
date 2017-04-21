Exciton website
===============

Visualize excitonic wavefunctions.

This project aims to create an interactive website where the user can visualize different excitonic wavefunctions.
The exciton is a bound state of and electron and an hole interacting via a Coulomb force.
We use `yambo` to calculate these excitonic states using the Bethe-Salpeter equation and `ypp` (part of yambo)
 to generate a representation of electron density when the hole is fixed.
This is done for the excitons with the highest intensity.
The user can click in the absorption spectra and visualize the electron density that corresponds to that particular state.

How to use?
============

This website allows you to visualize your own calculations. For that you need to have a `.json` file
with the information to display.
Currently this files can be generated using yambopy:

<https://github.com/henriquemiranda/yambopy> 

running your BSE calculation diagonalizing the excitonic hamiltonian.
Then you can generate this files using a script similar to the one present in the
analyse part of the bse_bn.py script provided in the tutorial.
We reproduce the code here:

```python
    #read the yambo output files from the bse folder
    y = YamboOut('bse')
    y.pack()

    #get the absorption spectra in the folder 'bse'
    a = YamboBSEAbsorptionSpectra('yambo',path='bse')
    
    # first we get the energies of teh ecitonic states:
    # min_intensity=0.0005  # minimum intensity of the excitons to represent
    # max_energy=7          # maximum energy of the excitons to represent
    # Degen_Step=0.01       # merge excitonic states whose energy
                            # difference in energy is smaller than

    excitons = a.get_excitons(min_intensity=0.0005,max_energy=7,
                              Degen_Step=0.01)

    print( "nexcitons: %d"%len(excitons) )
    print( "excitons:" )
    print( excitons )

    # read the wavefunctions
    # Cells=[13,13,1]   #number of cell repetitions
    # Hole=[0,0,6+.5]   #position of the hole in cartesian coordinates
    # FFTGvecs=10       #number of FFT vecs to use, larger makes the
    #                   #image smoother, but takes more time to plot
    a.get_wavefunctions(Degen_Step=0.01,repx=range(-1,2),
                        repy=range(-1,2),repz=range(1),
                        Cells=[13,13,1],Hole=[0,0,6+.5],
                        FFTGvecs=10,wf=True)
    
    #write the file
    a.write_json() 
```


Contribute
==========

The project is still under development, suggestions and bugfixes are welcome!

If you would like to see some data added here please contact me.  

You can leave your suggestions and feature requests here:
<https://github.com/henriquemiranda/excitonwebsite/issues>

Author
======
Henrique Miranda

My personal webpage:
<http://henriquemiranda.github.io>

My github page:
<https://github.com/henriquemiranda>

Contact me:
miranda.henrique at gmail.com

Aknowledgments & Funding
===============================
[Ludger Wirtz](http://wwwen.uni.lu/recherche/fstc/physics_and_materials_science_research_unit/research_areas/theoretical_solid_state_physics)
for the original idea and important scientific advices.

Fonds National de la Recherche Luxembourg (2013-present): <http://www.fnr.lu/>

<img src="figures/fnr.jpg" style="width:60%;">

University of Luxembourg (2013-present): <http://wwwen.uni.lu/>

<img src="figures/unilu.png" style="width:20%;">

Software used for this project
==============================

- The WebGL visualization is made using `Three.js`: <http://threejs.org/>
- The absorption spectra is made using `highcharts.js`: <http://www.highcharts.com/>
- For plot the isosurface I used the marching cubes algorithm as implemented in: <https://stemkoski.github.io/Three.js/>

- `Quantum Espresso`: <http://www.quantum-espresso.org/>
- `Yambo`: <http://www.yambo-code.org/>
