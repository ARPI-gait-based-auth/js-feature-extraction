import { Collection }                                                  from './interfaces';
import { createReport, mapToRes, pickAxis, resample, setInfo, smooth } from './utils';
import { highPassFilter, lowPassFilter }                               from './filters';

export async function processCollections(collection: Collection) {
  await Promise.all(collection.map(x => mapToRes(x)));
  await Promise.all(collection.map(x => smooth(x)));
  await Promise.all(collection.map(x => resample(x)));

  await Promise.all(collection.map(x => lowPassFilter(x)));
  // await Promise.all(collection.map(x => highPassFilter(x)));

  await Promise.all(collection.map(x => setInfo(x))); // like min, max, mean, stdev, ...
  await Promise.all(collection.map(x => pickAxis(x))); // detect best axis, should be Z in 99%

  await Promise.all(collection.map(x => createReport(x))); // make nice HTMl report charts
}