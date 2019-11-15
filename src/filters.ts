import { DataInterface } from './interfaces';
const Fili          = require('fili');
const iirCalculator = new Fili.CalcCascades();
const firCalculator = new Fili.FirCoeffs();

export function lowPassFilter(data: DataInterface) {
  const firFilterCoeffs = firCalculator.lowpass({
    order         : 5,
    Fs            : data.fs,
    Fc            : 10
  });
  const firFilter = new Fili.FirFilter(firFilterCoeffs);
  data.resX = firFilter.multiStep(data.resX);
  data.resY = firFilter.multiStep(data.resY);
  data.resZ = firFilter.multiStep(data.resZ);
}

export function highPassFilter(data: DataInterface) {
  const iirFilterCoeffs = iirCalculator.highpass({
    order         : 5,
    characteristic: 'bessel',
    Fs            : data.fs,
    Fc            : 10
  });
  const iirFilter       = new Fili.IirFilter(iirFilterCoeffs);
  iirFilter.multiStep(data.resX);
  iirFilter.multiStep(data.resY);
  iirFilter.multiStep(data.resZ);
}
