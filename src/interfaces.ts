export interface DataInterface {
  fs: number;

  time: Date[],  // SET AT READ TIME AND MODIFIED AT RESAMPLING

  x: number[],  // SET AT READ TIME
  y: number[],  // SET AT READ TIME
  z: number[],  // SET AT READ TIME

  resX?: number[], // PROCESSED OUTPUT
  resY?: number[], // PROCESSED OUTPUT
  resZ?: number[], // PROCESSED OUTPUT

  minX?: number;
  maxX?: number;
  meanX?: number;
  stdevX?: number;

  minY?: number;
  maxY?: number;
  meanY?: number;
  stdevY?: number;

  minZ?: number;
  maxZ?: number;
  meanZ?: number;
  stdevZ?: number;

  w?: number[],
  resW?: number[],

  rawTime?: Date[],
  username: string,
  file: string,

  reports: {[key:string]: string};
}

export type Collection = DataInterface[];