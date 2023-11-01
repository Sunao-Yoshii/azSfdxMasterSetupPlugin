"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeByCsv = void 0;
const fs = require("fs");
const sync_1 = require("csv-parse/sync");
const regStr = '^[0-9]+_([a-z]+)_(.+?)\\.csv$';
const extractCoc = (filename) => {
    const fileRegex = new RegExp(regStr, 'g');
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
class Col {
    constructor(key, value) {
        this.key = key;
        this.value = value;
    }
    get keyField() {
        return this.key.columnName;
    }
    getValue(idMap) {
        if (this.value === null || this.value === undefined || this.value.length === 0) {
            return null;
        }
        // console.log(`getValue : ${this.value}`);
        if (this.key.columnType === FieldType.Id || this.key.columnType === FieldType.Ref) {
            const res = idMap.get(this.value);
            return res === undefined ? null : res;
        }
        if (this.key.columnType === FieldType.Bool) {
            return (this.value.toLowerCase() === 'true');
        }
        if (this.key.columnType === FieldType.Num) {
            const num = +this.value;
            return num;
        }
        // その他は全部文字列として扱う
        return this.value;
    }
}
class Row {
    constructor(fields, values) {
        // TODO implemengts
        if (fields.length !== values.length) {
            throw new Error(`Invalid columns : ${values}`);
        }
        const columns = [];
        for (let n = 0; n < fields.length; n++) {
            columns.push(new Col(fields[n], values[n]));
        }
        this.columns = columns;
    }
    getIdKey() {
        return this.columns.find(v => v.keyField.toLowerCase() === 'id').value;
    }
    toJson(idMap) {
        const result = {};
        this.columns.forEach(col => {
            result[col.keyField] = col.getValue(idMap);
        });
        return result;
    }
}
class CsvLoader {
    constructor(idMap, fileName, dirname) {
        this.idMap = idMap;
        this.fileName = fileName;
        this.loadCsv(fileName, dirname);
    }
    static parseHeader(columns) {
        return columns.map(v => {
            const test = v.trim();
            // Id 項目
            if (test.toLowerCase() === 'id') {
                return new ColumnDefinition(FieldType.Id, 'Id');
            }
            // カラムをパース
            const fieldRegex = new RegExp('^(.+?)\\(([a-z]+)\\)$', 'g');
            const elems = fieldRegex.exec(test);
            if (!elems || elems.length < 3) {
                throw new Error('Field definition must be `fieldName(type)` : ' + v);
            }
            const fieldType = elems[2];
            const fieldName = elems[1];
            switch (fieldType) {
                case 'ref':
                    return new ColumnDefinition(FieldType.Ref, fieldName);
                case 'bool':
                    return new ColumnDefinition(FieldType.Bool, fieldName);
                case 'num':
                    return new ColumnDefinition(FieldType.Num, fieldName);
                case 'per':
                    return new ColumnDefinition(FieldType.Num, fieldName);
                case 'date':
                    return new ColumnDefinition(FieldType.Date, fieldName);
                case 'time':
                    return new ColumnDefinition(FieldType.Time, fieldName);
                case 'datetime':
                    return new ColumnDefinition(FieldType.Datetime, fieldName);
                default:
                    return new ColumnDefinition(FieldType.Text, fieldName);
            }
        });
    }
    getAsJson() {
        return this.rows.map(v => v.toJson(this.idMap));
    }
    loadCsv(fileName, dirname) {
        const filepath = `${dirname}/${fileName}`;
        const fileContent = fs.readFileSync(filepath, 'utf-8');
        const records = (0, sync_1.parse)(fileContent);
        // ヘッダ読み込み
        this.columnDefs = CsvLoader.parseHeader(records.shift());
        // 行データの読み込み
        this.rows = records.map(row => new Row(this.columnDefs, row));
    }
}
function outputError(saveRes, filename, index) {
    console.error(`Error occurs in ${filename}, at ${index + 1} :`);
    saveRes.errors.forEach(v => {
        console.error(v);
    });
}
function chunk(arr, size) {
    if (size <= 0)
        return [];
    const result = [];
    let buf = [];
    console.log(`chunking: split ${arr.length} contains array to ${size} sized arrays.`);
    for (let i = 0, j = arr.length; i < j; i++) {
        buf.push(arr[i]);
        if (buf.length >= size) {
            result.push(buf);
            buf = [];
        }
    }
    if (buf.length > 0) {
        result.push(buf);
    }
    console.log(`chunking(splitted : ${result.length} arrays.)`);
    return result;
}
async function insertDatas(connection, sobject, csvLoader, idMap, transactSize) {
    const dataset = csvLoader.getAsJson();
    console.log(`insert transactSize: ${transactSize}`);
    let index = 0;
    const chunkedArrays = chunk(dataset, transactSize);
    for (const data of chunkedArrays) {
        console.log('try');
        // insert リクエスト
        const saveResult = await connection.sobject(sobject).create(data);
        let hasError = false;
        for (const saveRes of saveResult) {
            if (saveRes.errors.length > 0) {
                outputError(saveRes, csvLoader.fileName, index);
                hasError = true;
            }
            else {
                const idKey = csvLoader.rows[index]?.getIdKey();
                const idValue = saveRes.id;
                console.log(`index: [${index}] ${idKey} = ${idValue}`);
                idMap.set(idKey, idValue);
            }
            index++;
            if (index > dataset.length) {
                return idMap;
            }
        }
        if (hasError) {
            process.exit(1);
        }
        console.log(`next: ${index}`);
    }
    return idMap;
}
async function deleteDatas(connection, sobject, csvLoader, idMap, transactSize) {
    const dataset = csvLoader.getAsJson();
    const deleteIds = dataset.map(v => v['Id']);
    console.log('delete:');
    const chunkedArrays = chunk(deleteIds, transactSize);
    let index = 0;
    console.log(`start: ${index}`);
    for (const targets of chunkedArrays) {
        // delete リクエスト
        const saveResult = await connection.sobject(sobject).del(targets);
        let hasError = false;
        for (const saveRes of saveResult) {
            if (saveRes.errors.length > 0) {
                outputError(saveRes, csvLoader.fileName, index);
                hasError = true;
            }
            else {
                const idKey = csvLoader.rows[index]?.getIdKey();
                console.log(`index: ${idKey} = ${index}`);
                idMap.delete(idKey);
            }
            index++;
        }
        if (hasError) {
            process.exit(1);
        }
    }
    return idMap;
}
async function updateDatas(connection, sobject, csvLoader, idMap, transactSize) {
    const dataset = csvLoader.getAsJson();
    console.log('update:');
    const chunkedArrays = chunk(dataset, transactSize);
    let index = 0;
    console.log(`start: ${index}`);
    for (const targets of chunkedArrays) {
        // 更新対象を org から取得
        const targetIds = targets.map(v => v['Id']);
        let recs = await connection.sobject(sobject)
            .find({ Id: { $in: targetIds } }, 'Id');
        // 更新項目の適用
        recs = recs.map(rec => {
            const id = rec.Id;
            const updateValues = targets.find(v => v['Id'] === id);
            return {
                Id: id,
                ...updateValues
            };
        });
        // update リクエスト
        const saveResult = await connection.sobject(sobject).update(recs);
        saveResult.forEach(saveRes => {
            if (saveRes.errors.length > 0) {
                outputError(saveRes, csvLoader.fileName, index);
            }
            index++;
        });
    }
    return idMap;
}
async function executeByCsv(dirname, filename, connection, idMap, transactSize) {
    const oprAndObj = extractCoc(filename);
    console.log('at executeByCsv:');
    console.log(oprAndObj);
    const operation = oprAndObj[0];
    const sobject = oprAndObj[1];
    // CSV パースとJSON化
    const csvLoader = new CsvLoader(idMap, filename, dirname);
    if (operation === 'insert') {
        return insertDatas(connection, sobject, csvLoader, idMap, transactSize);
    }
    if (operation === 'delete') {
        return deleteDatas(connection, sobject, csvLoader, idMap, transactSize);
    }
    if (operation === 'update') {
        return updateDatas(connection, sobject, csvLoader, idMap, transactSize);
    }
    // TODO:
    return null;
}
exports.executeByCsv = executeByCsv;
//# sourceMappingURL=migrate.js.map