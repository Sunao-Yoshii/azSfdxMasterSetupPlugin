"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeByCsv = void 0;
const fs = require("fs");
const fileRegex = new RegExp('^[0-9]+_(insert|update|delete)_(.+?)\\.csv$', 'g');
const extractCoc = (filename) => {
    const splits = fileRegex.exec(filename);
    return [splits[1], splits[2]];
};
var FieldType;
(function (FieldType) {
    FieldType[FieldType["Id"] = 0] = "Id";
    FieldType[FieldType["Ref"] = 1] = "Ref";
    FieldType[FieldType["Text"] = 2] = "Text";
    FieldType[FieldType["Bool"] = 3] = "Bool";
    FieldType[FieldType["Num"] = 4] = "Num";
    FieldType[FieldType["Date"] = 5] = "Date";
    FieldType[FieldType["Time"] = 6] = "Time";
    FieldType[FieldType["Datetime"] = 7] = "Datetime";
})(FieldType || (FieldType = {}));
class ColumnDefinition {
    constructor(columnType, columnName) {
        this.columnName = columnName;
        this.columnType = columnType;
    }
}
class RowDefiniton {
}
class CsvLoader {
    constructor(idMap, fileName, dirname) {
        this.idMap = idMap;
        this.fileName = fileName;
        this.loadCsv(fileName, dirname);
    }
    loadCsv(fileName, dirname) {
        const filepath = `${dirname}/${fileName}`;
        const fileContent = fs.readFileSync(filepath, 'utf-8');
        const allRows = fileContent.split('\r?\n');
        console.log(allRows);
    }
}
async function executeByCsv(dirname, filename, connection, idMap) {
    const oprAndObj = extractCoc(filename);
    const operation = oprAndObj[0];
    const sobject = oprAndObj[1];
    const csvLoader = new CsvLoader(idMap, filename, dirname);
    // connection.insert()
    // TODO:
    return;
}
exports.executeByCsv = executeByCsv;
//# sourceMappingURL=migrate.js.map