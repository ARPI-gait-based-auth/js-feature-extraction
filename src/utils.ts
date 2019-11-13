import { ma }            from 'moving-averages';
import * as d3           from 'd3-interpolate';
import { DataInterface } from './interfaces';

const linterpol     = require('linterpol');
const timeseries    = require('timeseries-analysis');
const csv           = require('csvtojson');
const Fili          = require('fili');
const iirCalculator = new Fili.CalcCascades();

export function setInfo(data: DataInterface) {
  const tX = new timeseries.main(data.time.map((time, i) => [time, data.resX[i]]));
  const tY = new timeseries.main(data.time.map((time, i) => [time, data.resY[i]]));
  const tZ = new timeseries.main(data.time.map((time, i) => [time, data.resZ[i]]));

  data.minX  = tX.min();
  data.maxX  = tX.max();
  data.meanX = tX.mean();

  data.stdevX = tX.stdev();
  data.minX   = tY.min();
  data.maxY   = tY.max();
  data.meanY  = tY.mean();
  data.stdevY = tY.stdev();

  data.minZ   = tZ.min();
  data.maxZ   = tZ.max();
  data.meanZ  = tZ.mean();
  data.stdevZ = tZ.stdev();
}

export function copy(data: DataInterface) {
  data.resX = data.x.map(x => x);
  data.resY = data.y.map(x => x);
  data.resZ = data.z.map(x => x);
}

export function smooth(data: DataInterface) {
  data.resX = ma(data.resX, 5);
  data.resY = ma(data.resY, 5);
  data.resZ = ma(data.resZ, 5);
}

export function resample(data: DataInterface, stepInMs: number) {
  // Figure out fixed time intervals
  const fixedTimes = [data.time[0]];
  while (+fixedTimes[fixedTimes.length - 1] + stepInMs < +data.time[data.time.length - 1]) {
    fixedTimes.push(new Date(+fixedTimes[fixedTimes.length - 1] + stepInMs))
  }

  const _resample = (list: number[]): number[] => {
    /// OPT 1
    return fixedTimes.map(t => {
      const nextTimeI = data.time.findIndex((a) => +a > +t);
      const prevTimeI = nextTimeI - 1;
      if (nextTimeI === -1) { return 0; }
      const diffT          = (+data.time[nextTimeI]) - (+data.time[prevTimeI]);
      const diffWithFixedT = (+data.time[nextTimeI]) - (+t);

      return d3.interpolateNumber(list[prevTimeI], list[nextTimeI])(diffWithFixedT / diffT);
    });

    /// OPT 2
    // const points = list.map((v, i) => [+ data.time[i], v]);
    // return fixedTimes.map(t => linterpol(+ t, points));

    /// OPT 3
    // const points = list.map((v, i) => [+ data.time[i], v]);
    // const f = linearInterpolator(points);
    // return fixedTimes.map(x => f(+x));
  };

  data.resX = _resample(data.resX);
  data.resY = _resample(data.resY);
  data.resZ = _resample(data.resZ);

  data.rawTime = data.time;
  data.time    = fixedTimes;
}

export function pickAxis(data: DataInterface) {
  data.w    = data.y;
  data.resW = data.resY;
}

export function createReport(data: DataInterface) {
  // specific
  const from = 100;
  const to   = 200;
  data.time  = data.time.slice(from, to);

  data.w    = data.w.slice(from, 200);
  data.resW = data.resW.slice(from, 200);

  data.x    = data.x.map(e => e + 20);
  data.resX = data.resX.map(e => e + 20);

  data.y    = data.y.map(e => e + 15);
  data.resY = data.resY.map(e => e + 15);

  data.z    = data.z.map(e => e - 10);
  data.resZ = data.resZ.map(e => e - 10);

  const colors = [
    '#cd6a1c', '#cdc226',
    '#0d6c0b', '#37cd79',
    '#cd4665', '#3e95cd',
  ];

  const datasets = [];
  ['x', 'y', 'z'].map(k => {
    datasets.push({
      data       : data[k].slice(from, to),
      label      : 'RAW ' + k,
      borderColor: colors.pop(),
      fill       : false
    });
    datasets.push({
      data       : data['res' + k.toUpperCase()].slice(from, to),
      label      : 'PROCESSED ' + k,
      borderColor: colors.pop(),
      fill       : false
    })
  });

  data.reports.main = `
<html>
<body>
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.5.0/Chart.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js@2.9.1"></script>
<script src="https://cdn.jsdelivr.net/npm/hammerjs@2.0.8"></script>
<script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-zoom@0.7.4"></script>

<style>.myChartDiv {
  max-width: 1600px;
  max-height: 600px;
}</style>
  <div class="myChartDiv"><canvas id="line-chart" width="1600" height="600"></canvas></div>
  <script>
  
  new Chart(document.getElementById("line-chart"), {
  type: 'line',
  data: {
    labels: [${ data.time.map((o, i) => i).join(', ') }],
    datasets: ${ JSON.stringify(datasets) }
  },
  options: {
    title: {
      display: true,
      text: 'Acc.'
    },
      scales: {
            yAxes: [{
                ticks: {
                    beginAtZero:true
                }
            }]
        },
        pan: {
            enabled: true,
            mode: 'x'
        },
        zoom: {
            enabled: true,
            mode: 'x',
             sensitivity: 0.1,
  speed: 100 // would be a percentage
        }
  },

});
  </script>
  </body>
  </html>
  `;
}
