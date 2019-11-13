import { Collection, DataInterface } from './src/interfaces';
import { processCollections }        from './src/process-data';
import * as fs                       from 'fs-extra';
import * as path                     from 'path';
import * as csv                      from 'csvtojson';

async function read(csvFiles: string[]): Promise<Collection> {
  const subjects = await Promise.all(
    csvFiles.map(async csvFilePath => {
      const jsonObj             = await csv()
        .fromFile(csvFilePath);
      const data: DataInterface = {
        fs      : 0,
        x       : [],
        y       : [],
        z       : [],
        time    : [],
        username: '',
        file    : csvFilePath,
        reports : {}
      };
      jsonObj.forEach(d => {
        data.username = d.username;
        data.time.push(new Date(+d.timestamp));

        data.x.push(+d.accX);
        data.y.push(+d.accY);
        data.z.push(+d.accZ);
      });
      return data;
    })
  );
  return subjects;
}

async function writeReport(data: DataInterface) {
  await Promise.all(
    Object.keys(data.reports).map(x => fs.writeFile(path.join('reports', x + '.html'), data.reports[x]))
  );
}

(async () => {
  const collection: Collection = await read([
    './data/n5_r_u0_0-fri.raw.csv',
  ]);

  await processCollections(collection);
  await Promise.all(collection.map(x => writeReport(x)));
})();


