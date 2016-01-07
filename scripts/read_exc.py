from sys import argv
from yambopy.inputfile import *
from yambopy.outputfile import *
from ramanpy.auxiliary.neighbors import *
import numpy as np
from itertools import product
from ase import Atoms
import matplotlib.pyplot as plt
import json
import numpy as np
import argparse
import os
import textwrap

def red_car(red,lat): return np.array(map( lambda coord: coord[0]*lat[0]+coord[1]*lat[1]+coord[2]*lat[2], red))

def jump_to(f,tag):
    """ Jump to a line in file
    """
    while True:
        line = f.readline()
        if tag in line:
            break

class ExcitonWaveFunction():
    def __init__(self,filename):
        f = open(filename)
        jump_to(f,"PRIMVEC")
        self.lattice = []
        self.lattice.append( map(float,f.readline().strip().split()) )
        self.lattice.append( map(float,f.readline().strip().split()) )
        self.lattice.append( map(float,f.readline().strip().split()) )

        jump_to(f,"PRIMCOORD")
        self.natoms = int(f.readline().split()[0])-1

        #read the hole position
        self.hole = map(float,f.readline().strip().split())

        #read the atoms positions
        self.atoms = []
        for i in range(self.natoms):
            self.atoms.append( map(float,f.readline().strip().split()) )

        #get atypes
        self.atypes = np.unique([a[0] for a in self.atoms]).tolist()
        atypes_dict = dict([(a,n) for n,a in enumerate(self.atypes)])
        self.atoms = [ [atypes_dict[a[0]]]+a[1:] for a in self.atoms]

        jump_to(f,"BEGIN_DATAGRID_3D")
        self.nx, self.ny, self.nz = map(int, f.readline().strip().split())
        f.readline() #ignore

        #read cell
        self.cell = []
        self.cell.append( map(float,f.readline().strip().split()) )
        self.cell.append( map(float,f.readline().strip().split()) )
        self.cell.append( map(float,f.readline().strip().split()) )

        #read data
        self.datagrid = np.zeros([self.nz,self.ny,self.nx])
        for k,j,i in product(range(self.nz),range(self.ny),range(self.nx)):
            self.datagrid[k,j,i] = float(f.readline())

    def plot_slice(self,n):
        """ plot a slice of the 3d grid
        """
        plt.imshow(self.datagrid[:,:,n])
        plt.show()

    def get_data(self):
        return { "datagrid": self.datagrid.flatten().tolist(),
                 "lattice": self.lattice,
                 "atoms": self.atoms,
                 "atypes": self.atypes,
                 "nx": self.nx,
                 "ny": self.ny,
                 "nz": self.nz }

    def write_json(self):
        """ Write as a json file
        """
        f = open("datagrid.json","w")
        json.dump(self.get_data(),f)
        f.close()

    def __str__(self):
        s = ""
        s += "lattice:\n"
        for i in range(3):
            s += ("%12.8lf "*3)%tuple(self.lattice[i])+"\n"
        s += "natoms:\n"
        s += "atoms:\n"
        for i in range(self.natoms):
            s += ("%3d "+"%12.8lf "*3)%tuple(self.atoms[i])+"\n"
        s += "atypes:\n"
        for n,a in enumerate(self.atypes):
            s += "%3d %3d\n"%(n,a)
        s += "nx: %d\n"%self.nx
        s += "ny: %d\n"%self.ny
        s += "nz: %d\n"%self.nz
        return s

class AbsorptionSpectra():
    def __init__(self,job_string,threshold=0.2):
        self.job_string = job_string
        self.threshold = threshold
        self.data = {"excitons":[]}
        self.atoms = None

        #use YamboOut to read the absorption spectra
        y = YamboOut('.')
        print y
        for key,value in y.data.items():
            if "eps" in key: self.data["eps"] = value.tolist()
            if "eel" in key: self.data["eel"] = value.tolist()

    def get_excitons(self):
        filename = "o-%s.exc_I_sorted"%args.job_string
        if not os.path.isfile(filename):
            os.system("ypp -e s -J %s"%args.job_string)
        self.excitons = np.loadtxt(filename)
        return self.excitons[self.excitons[:,1]>self.threshold]

    def get_wavefunctions(self):
        """ Collect all the wavefuncitons with an intensity larger than self.threshold
        """
        self.filtered_excitons = self.excitons[self.excitons[:,1]>self.threshold]
        self.filtered_excitons

        #read the ypp file using YamboIn
        ypp = YamboIn()
        ypp._runlevels.append('excitons')
        ypp._runlevels.append('wavefunction')
        ypp.read_file("ypp.in")

        keywords = ["lattice", "atoms", "atypes", "nx", "ny", "nz"]
        for exciton in self.filtered_excitons:
            #get info
            e,intensity,i = exciton

            #create ypp input file and run
            ypp["States"] = "%d - %d"%(i,i)
            ypp.write("ypp_%d.in"%i)
            filename = "o-%s.exc_3d_%d.xsf"%(self.job_string,i)
            print filename
            if not os.path.isfile(filename):
                os.system("ypp -F ypp_%d.in -J %s"%(i,self.job_string))

            #read the excitonic wavefunction
            ew = ExcitonWaveFunction(filename)
            data = ew.get_data()
            for word in keywords:
                self.data[word] = data[word]
            self.data["excitons"].append({"energy": e,
                                          "intensity": intensity,
                                          "index": i,
                                          "datagrid": data["datagrid"]})

    def get_atoms(self):
        """ Get a ase atoms class
        """
        if "lattice" in self.data.keys():
            self.atypes = self.data["atypes"]
            self.lat = self.data["lattice"]
            self.atom_types = [self.atypes[a[0]] for a in self.data["atoms"]]
            self.pos = [a[1:] for a in self.data["atoms"]]
            self.atoms = Atoms(self.atom_types, self.pos, pbc=[1,1,1])
            self.atoms.set_cell(self.lat)

    def find_nn_distance(self):
        """ Find and return the nearest neighbour distance
        """
        if self.atoms:
            self.nn = Neighbors(self.atoms,dist=6.0)
            neighbors = np.array(self.nn.get_nneighbors(0,1))-np.array(self.atoms.get_scaled_positions()[0])
            print neighbors
            self.nndist = min([ np.linalg.norm(n) for n in red_car(neighbors,np.array(self.lat)) ])
            self.data["nndist"] = self.nndist

    def write_json(self):
        """ Write a jsonfile with the absorption spectra and the wavefunctions of certain excitons
        """
        print "writing json file...",
        f = open("absorptionspectra.json","w")
        json.dump(self.data,f)
        f.close()
        print "done!"

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("job_string", help="Same as Job string identifier in yambo")
    args = parser.parse_args()

    a = AbsorptionSpectra(args.job_string)
    excitons = a.get_excitons()
    print "nexcitons: %d"%len(excitons)
    print "excitons:"
    print excitons
    a.get_wavefunctions()
    a.get_atoms()
    a.find_nn_distance()
    a.write_json()

    #read the excitonic wavefunction
    exit()
    e = ExcitonWaveFunction("o-yambo.exc_3d_1.xsf")
    print e
    e.write_json()
