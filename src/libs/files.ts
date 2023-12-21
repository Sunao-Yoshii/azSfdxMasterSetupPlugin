/* tslint:disable */
import * as fs from 'node:fs';

const regStr = '^([0-9]+)_(insert|update|delete)_(.+?)\\.csv$';

function extension(element: string): boolean {
  const fileRegex = new RegExp(regStr, 'g');
  return fileRegex.test(element);
};

function listupCsv(targetDir: string): Promise<string[]> {
  const filePaths: string[] = [];
  return new Promise<string[]>((resolve, reject) => {
    fs.readdir(targetDir, (err, list) => {
      if (err) {
        reject(err);
        return;
      }
      if (list !== undefined) {
        // console.log('list');
        // console.log(list);
        list.filter(extension).forEach(v => {
          filePaths.push(v);
        });
        // console.log(filePaths);
      }
      resolve(filePaths);
    });
  });
}

export async function findCsv(targetDir: string): Promise<string[]> {
  // console.log('at findCsv');

  // search directory
  const allFiles = await listupCsv(targetDir);
  // console.log(allFiles);

  // sort map
  const fileNumberMap = new Map<number, string>();
  let maxNumber = 0;
  allFiles.forEach((value) => {
    const fileRegex = new RegExp(regStr, 'g');
    const matches = fileRegex.exec(value);
    if (!matches) return;
    const currentNumber = Number(matches[1]);
    maxNumber = maxNumber < currentNumber ? currentNumber : maxNumber;
    fileNumberMap.set(currentNumber, value);
  });

  const result: string[] = [];
  for (let n = 1; n <= maxNumber; n++) {
    const data = fileNumberMap.get(n);
    if (data) {
      result.push(data);
    }
  }
  return result;
}
