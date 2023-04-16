import * as fs from 'fs';

const regStr = '^([0-9]+)_(insert|update|delete)_(.+?)\\.csv$';

function extension(element: string): boolean {
  const fileRegex = new RegExp(regStr, 'g');
  return fileRegex.test(element);
};

function listupCsv(targetDir: string): Promise<string[]> {
  const filePaths: string[] = [];
  return new Promise<string[]> ((resolve, reject) => {
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
  allFiles.forEach((value) => {
    const fileRegex = new RegExp(regStr, 'g');
    const matches = fileRegex.exec(value)
    fileNumberMap.set(Number(matches[1]), value);
  });

  let n = 1;
  const result: string[] = [];
  while(true) {
    if (!fileNumberMap.has(n)) break;
    result.push(fileNumberMap.get(n));
    n++;
  }
  return result;
}
