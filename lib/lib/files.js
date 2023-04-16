"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findCsv = void 0;
const fs = require("fs");
const fileRegex = new RegExp('^([0-9]+)_(insert|update|delete)_(.+?)\\.csv$', 'g');
function extension(element) {
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
                list.filter(extension).forEach(v => {
                    filePaths.push(v);
                });
            }
            resolve(filePaths);
        });
    });
}
async function findCsv(targetDir) {
    // search directory
    const allFiles = await listupCsv(targetDir);
    // sort map
    const fileNumberMap = new Map();
    allFiles.forEach((value) => {
        const matches = fileRegex.exec(value);
        fileNumberMap.set(Number(matches[1]), value);
    });
    let n = 1;
    const result = [];
    while (true) {
        if (!fileNumberMap.has(n))
            break;
        result.push(fileNumberMap.get(n));
        n++;
    }
    return result;
}
exports.findCsv = findCsv;
//# sourceMappingURL=files.js.map