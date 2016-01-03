from sys import argv
import numpy as np
from itertools import product
import matplotlib.pyplot as plt
import json

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
                 "cell": self.cell,
                 "nx": self.nx,
                 "ny": self.ny,
                 "nz": self.nz }
        json.dump(data,f)
        f.close()

    def __str__(self):
        s = ""
        s += "nx: %d\n"%self.nx
        s += "ny: %d\n"%self.ny
        s += "nz: %d\n"%self.nz
        s += "cell:\n"
        for i in range(3):
            s += ("%12.8lf "*3)%tuple(self.cell[i])+"\n"
        return s


if __name__ == "__main__":
    e = ExcitonWaveFunction("o-yambo.exc_3d_1.xsf")
    print e
    e.write_json()
