import { ma }            from 'moving-averages';
import * as d3           from 'd3-interpolate';
import { DataInterface } from './interfaces';

const linearInterpolator      = require('linear-interpolator');
const timeseries    = require('timeseries-analysis');
const csv           = require('csvtojson');
const Fili          = require('fili');
const iirCalculator = new Fili.CalcCascades();

const SAMPLE_FREQ = 60;

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

export function duplicate(data: DataInterface) {
  const o = { ...data };
  o.x     = o.x.map(x => x);
  o.y     = o.y.map(x => x);
  o.z     = o.z.map(x => x);
  o.resX  = o.resX.map(x => x);
  o.resY  = o.resX.map(x => x);
  o.resZ  = o.resX.map(x => x);
  if (o.resW) {
    o.resW = o.resW.map(x => x);
  }
  return o;
}

export function mapToRes(data: DataInterface) {
  data.resX = data.x.map(x => x);
  data.resY = data.y.map(x => x);
  data.resZ = data.z.map(x => x);
}

export function smooth(data: DataInterface) {
  data.resX = ma(data.resX, 10);
  data.resY = ma(data.resY, 10);
  data.resZ = ma(data.resZ, 10);
}

export function resample(data: DataInterface) {
  const stepInMs = 1000 / SAMPLE_FREQ;

  // Figure out fixed time intervals
  const fixedTimes = [data.time[0]];
  while (+fixedTimes[fixedTimes.length - 1] + stepInMs < +data.time[data.time.length - 1]) {
    fixedTimes.push(new Date(+fixedTimes[fixedTimes.length - 1] + stepInMs))
  }

  const _resample = (list: number[]): number[] => {
    // /// OPT 1
    // return fixedTimes.map(t => {
    //   const nextTimeI = data.time.findIndex((a) => +a > +t);
    //   const prevTimeI = nextTimeI - 1;
    //   if (nextTimeI === -1) { return 0; }
    //   const diffT          = (+data.time[nextTimeI]) - (+data.time[prevTimeI]);
    //   const diffWithFixedT = (+data.time[nextTimeI]) - (+t);
    //   return d3.interpolateNumber(list[prevTimeI], list[nextTimeI])(diffWithFixedT / diffT);
    // });

    // OPT 2
    // const points = list.map((v, i) => [+ data.time[i], v]);
    // return fixedTimes.map(t => linterpol(+ t, points));

    /// OPT 3
    const points = list.map((v, i) => [+ data.time[i], v]);
    const f = linearInterpolator(points);
    return fixedTimes.map(x => f(+x));
  };

  data.resX = _resample(data.resX);
  data.resY = _resample(data.resY);
  data.resZ = _resample(data.resZ);

  data.rawTime = data.time;
  data.time    = fixedTimes;

  data.fs = SAMPLE_FREQ;
}

export function pickAxis(data: DataInterface) {
  data.w    = data.y;
  data.resW = data.resY;
}

export function createReport(data: DataInterface) {
  const colors = [
    '#cd6a1c', '#cdc226',
    '#0d6c0b', '#37cd79',
    '#cd4665', '#3e95cd',
  ];

  const dataSet: any[] = [/*{
    x: [0, 1, 2],
    y: [6, 10, 2],
    error_y: {
      type: 'data',
      array: [1, 2, 3],
      visible: true
    },
    type: 'scatter'
  }*/];
  ['x', 'y', 'z'].map((k, i) => {
    dataSet.push({
      type: 'scatter',
      mode: 'lines',
      name: `Raw [${ k }]`,
      x   : data.time,
      y   : data[k].map(x=>x+25*i),
      line: { color: colors.pop() }
    });
    dataSet.push({
      type: 'scatter',
      mode: 'lines',
      name: `R [${ k.toUpperCase() }]`,
      x   : data.time,
      y   : data['res' + k.toUpperCase()].map(x=>x+25*i),
      line: { color: colors.pop() }
    });
  });
  data.reports.main = `
<html>
<head><script src="https://cdn.plot.ly/plotly-latest.min.js"></script></head>
<body>
<style></style>
  <div id="chart"  style="height: 100vh"></div>
  <script>
    var layout = {
    title: '${ data.file }', 
    xaxis: {
      range: ['${ data.time[0] }', '${ data.time[data.time.length - 1] }'], 
      type: 'date',
      rangeslider: {range: ['${ data.time[0] }', '${ data.time[data.time.length - 1] }']},
      rangeselector: {buttons: [
        {
          count: 10,
          label: '10s',
          step: 'second',
          stepmode: 'backward'
        },
        {
           count: 20,
           label: '20s',
           step: 'second',
           stepmode: 'backward'
         },
         {
          count: 30,
          label: '30s',
          step: 'second',
          stepmode: 'backward'
        },
        {step: 'all'}
      ]},
    }, 
    yaxis: {
      autorange: true, 
      range: [-10, 10], 
      type: 'linear'
    }
  };
  
  Plotly.newPlot('chart', ${ JSON.stringify(dataSet) }, layout, {showSendToCloud: true});
  </script>
  </body>
  </html>
  `;
}
