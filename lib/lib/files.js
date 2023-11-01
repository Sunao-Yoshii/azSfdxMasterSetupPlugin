"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findCsv = void 0;
const fs = require("fs");
const regStr = '^([0-9]+)_(insert|update|delete)_(.+?)\\.csv$';
function extension(element) {
    const fileRegex = new RegExp(regStr, 'g');
    return fileRegex.test(element);
}
;
function listupCsv(targetDir) {
    const filePaths = [];
    return new Promise((resolve, reject) => {
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
async function findCsv(targetDir) {
    // console.log('at findCsv');
    // search directory
    const allFiles = await listupCsv(targetDir);
    // console.log(allFiles);
    // sort map
    const fileNumberMap = new Map();
    let maxNumber = 0;
    allFiles.forEach((value) => {
        const fileRegex = new RegExp(regStr, 'g');
        const matches = fileRegex.exec(value);
        const currentNumber = Number(matches[1]);
        maxNumber = maxNumber < currentNumber ? currentNumber : maxNumber;
        fileNumberMap.set(currentNumber, value);
    });
    const result = [];
    for (let n = 1; n <= maxNumber; n++) {
        if (!fileNumberMap.has(n))
            continue;
        result.push(fileNumberMap.get(n));
    }
    return result;
}
exports.findCsv = findCsv;
//# sourceMappingURL=files.js.map