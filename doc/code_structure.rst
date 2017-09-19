excitonwebsite
====================================

Features:
--------------------------
- click on absorption spectra and show excitonic wavefunctions
- show time dependent density from yambo calculation

Todo list
=================================
- Define the json format for the exciton website
- Create the class to read the json format
- Use classes from ecmascript6
- class ExctionBZ
- class ExcitonBS

Classes
=================================


class ExcitonWebsite
--------------------------
Handles the interface (html5), buttons, load files display exciton data
    - menu list of materials
    - optical absorption
    - exciton density with fixed hole

uses
    1. class Absorption
    2. class ExcitonWf
    3. class ExcitonJson

class Absorption
--------------------------
Click on the absorption spectra and change the excitonic wavefunction

class ExcitonWF
--------------------------
Display the excitonic wavefunction

class ExcitonBZ
--------------------------
Display the exciton the in Brillouin zone

class ExcitonBS
--------------------------
Display the excitonic band-structure


class TimeDensityWebsite
--------------------------
Handles the interface (html5), buttons, load files display density
    - PolarizationTime
    - CarrierTime
    - PulseProfile
    - DensityTime
    - menu list of materials

uses
    1. class DensityTime
    2. class PolarizationTime
    3. class CarrierTime


class DensityTime
--------------------------
Show the density as a function of time

class PolarizationTime
--------------------------
Show the polarization as a function of time

class CarrierTime
--------------------------
Show the carriers in the band-structure as a function of time


Interfaces
===========================

class ExcitonJson
----------------------
Loads the json files with all the data

class Rest
----------------------
Get the data from an external server through a REST interface


