from sys import argv
import numpy as np
from itertools import product
import matplotlib.pyplot as plt
import json
import numpy as np

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

    def write_json(self):
        """ Write as a json file
        """
        f = open("datagrid.json","w")
        data = { "datagrid": self.datagrid.flatten().tolist(),
                 "lattice": self.lattice,
                 "atoms": self.atoms,
                 "atypes": self.atypes,
                 "nx": self.nx,
                 "ny": self.ny,
                 "nz": self.nz }
        json.dump(data,f)
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


if __name__ == "__main__":
    e = ExcitonWaveFunction("o-yambo.exc_3d_1.xsf")
    print e
    e.write_json()
