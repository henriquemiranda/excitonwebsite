/*
    Author: Henrique Miranda
    Year: 2016
*/

AbsorptionSpectra = {
  exciton_index: 0,
  HighchartsOptions: {
      chart: { type: 'line'},
      title: { text: 'Absorption Spectra' },
      xAxis: { title: { text: 'Energy' },
               plotLines: [] },
      yAxis: { min: 0,
               title: { text: 'Intensity (arb. units)' },
               plotLines: [ {value: 0, color: '#808080' } ] },
      tooltip: { formatter: function(x) { return Math.round(this.y*100)/100 }  },
      plotOptions: {
          line: {
              animation: false
          },
          series: {
              cursor: 'pointer',
              point: { events: {
                   click: function(event) {
                              var min = 1e9, distance;

                              //check which exciton is closer in energy
                              for (i=0;i<e.excitons.length;i++) {
                                e.excitons[i]["index"];
                                energy = e.excitons[i]["energy"];
                                distance = Math.abs(energy-this.x)
                                if (distance < min ) {
                                  min = distance;
                                  e.exciton_index = i;
                                }
                              }

                              //plot it
                              e.updateStructure();
                                          }
                  }
              }
          }
      },
      legend: { enabled: false },
      series: []
  },

  init: function(container) {
    container.highcharts(this.HighchartsOptions);
  },

  getDataObject: function(data) {

      self.excitons = data["excitons"];
      self.energies = getTag(["eps",'E/ev[1]'],data);
      self.eps = getTag(["eps",'EPS-Im[2]'],data);
      self.sizex = data["nx"];
      self.sizey = data["ny"];
      self.sizez = data["nz"];
      self.nndist = data["nndist"];
      self.cell = data["lattice"];
      self.atoms = data["atoms"];
      self.natoms = self.atoms.length;
      self.atom_numbers = data["atypes"];

      var x, series = [];

      for (i=0;i<self.eps.length;i++) {
        x = self.energies[i];
        y = self.eps[i];
        series.push([x,y]);

        //y = self.eps[i];
        //x = self.energies[i];
        //series.push([x[0],x[1]]);
      }

      this.HighchartsOptions.series = [];
      this.HighchartsOptions.series.push({name:  "eps",
                                          color: "#0066FF",
                                          marker: {radius: 2, symbol: "circle"},
                                          data: series });

      exciton_lines = []
      plotlines = this.HighchartsOptions.xAxis.plotLines;
      for (i=0;i<self.excitons.length;i++) {
        exciton_lines.push({ value: self.excitons[i]["energy"],
                             color: 'gray',
                             width: 4,
                             name: i,
                             events: { click: function(event)
                                        { e.exciton_index = this.options.name;
                                          e.updateStructure()
                                        }
                                     }
                           });
      }
      this.HighchartsOptions.xAxis.plotLines = exciton_lines;

  },
 
  getDataFilename: function(filename) {
      self = this;
      $.getJSON( filename, function(data) { self.getDataObject(data) } );

  }
}
