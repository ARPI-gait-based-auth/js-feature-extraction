import { DataInterface } from './interfaces';
const Fili          = require('fili');
const iirCalculator = new Fili.CalcCascades();

export function lowPassFilter(data: DataInterface) {
  const iirFilterCoeffs = iirCalculator.lowpass({
    order         : 5, // cascade 3 biquad filters (max: 12)
    characteristic: 'butterworth',
    Fs            : data.fs, // sampling frequency
    Fc            : 10, // cutoff frequency / center frequency for bandpass, bandstop, peak
    BW            : 1, // bandwidth only for bandstop and bandpass filters - optional
    gain          : 0, // gain for peak, lowshelf and highshelf
    preGain       : false // adds one constant multiplication for highpass and lowpass
    // k = (1 + cos(omega)) * 0.5 / k = 1 with preGain == false
  });
  const iirFilter       = new Fili.IirFilter(iirFilterCoeffs);
  iirFilter.multiStep(data.resX);
  iirFilter.multiStep(data.resY);
  iirFilter.multiStep(data.resZ);
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
