import { Connection } from '@salesforce/core';
import { SaveResult } from 'jsforce';
import * as fs from 'fs';
import { parse } from 'csv-parse/sync';

const regStr = '^[0-9]+_([a-z]+)_(.+?)\\.csv$';

const extractCoc = (filename: string): string[] => {
  const fileRegex = new RegExp(regStr, 'g');
  const splits = fileRegex.exec(filename);
  return [ splits[1], splits[2] ];
};

enum FieldType {
  Id = 0,
  Ref = 1,
  Text = 2,
  Bool = 3,
  Num = 4,
  Date = 5,
  Time = 6,
  Datetime = 7
}

class ColumnDefinition {
  public columnType: FieldType;
  public columnName: string;

  public constructor(columnType: FieldType, columnName: string) {
    this.columnName = columnName;
    this.columnType = columnType;
  }
}

class Col {
  public key: ColumnDefinition;
  public value: string;

  public constructor(key: ColumnDefinition, value: string) {
    this.key = key;
    this.value = value;
  }

  public get keyField(): string {
    return this.key.columnName;
  }

  public getValue(idMap: Map<string, string>): undefined {
    if (this.value === null || this.value === undefined || this.value.length === 0) {
      return null;
    }
    // console.log(`getValue : ${this.value}`);
    if (this.key.columnType === FieldType.Id || this.key.columnType === FieldType.Ref) {
      const res = idMap.get(this.value);
      return res === undefined ? null : res as undefined;
    }
    if (this.key.columnType === FieldType.Bool) {
      return (this.value.toLowerCase() === 'true') as undefined;
    }
    if (this.key.columnType === FieldType.Num) {
      const num: number = +this.value;
      return num as undefined;
    }

    // その他は全部文字列として扱う
    return this.value as undefined;
  }
}

class Row {
  public columns: Col[];

  public constructor(fields: ColumnDefinition[], values: string[]) {
    // TODO implemengts
    if (fields.length !== values.length) {
      throw new Error(`Invalid columns : ${values}`);
    }

    const columns: Col[] = [];
    for (let n = 0; n < fields.length; n++) {
      columns.push(new Col(fields[n], values[n]));
    }
    this.columns = columns;
  }

  public getIdKey() {
    return this.columns.find(v => v.keyField.toLowerCase() === 'id').value;
  }

  public toJson(idMap: Map<string, string>): object {
    const result = {};
    this.columns.forEach(col => {
      result[col.keyField] = col.getValue(idMap);
    });
    return result;
  }
}

class CsvLoader {

  private idMap: Map<string, string>;
  public fileName: string;
  private dirname: string;
  private columnDefs: ColumnDefinition[];
  public rows: Row[];

  public constructor(idMap: Map<string, string>, fileName: string, dirname: string) {
    this.idMap = idMap;
    this.fileName = fileName;
    this.loadCsv(fileName, dirname);
  }

  public static parseHeader(columns: string[]): ColumnDefinition[] {
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

  public getAsJson(): object[] {
    return this.rows.map(v => v.toJson(this.idMap));
  }

  private loadCsv(fileName: string, dirname: string): void {
    const filepath = `${dirname}/${fileName}`;
    const fileContent = fs.readFileSync(filepath, 'utf-8');
    const records = parse(fileContent) as string[][];

    // ヘッダ読み込み
    this.columnDefs = CsvLoader.parseHeader(records.shift());

    // 行データの読み込み
    this.rows = records.map(row => new Row(this.columnDefs, row));
  }
}

function outputError(saveRes: SaveResult, filename: string, index: number): void {
  console.error(`Error occurs in ${filename}, at ${index+1} :`);
  saveRes.errors.forEach(v => {
    console.error(v);
  });
}

function chunk<T extends any[]>(arr: T, size: number) {
  return arr.reduce(
      (newarr, _, i) => (i % size ? newarr : [...newarr, arr.slice(i, i + size)]),
      [] as T[][]
  )
}

async function insertDatas(connection: Connection, sobject: string, csvLoader: CsvLoader, idMap: Map<string, string>, transactSize: number): Promise<Map<string, string>> {
  const dataset = csvLoader.getAsJson();
  console.log('insert:');

  let index = 0;
  const chunkedArrays = chunk(dataset, transactSize);
  for (const data of chunkedArrays) {

    // insert リクエスト
    const saveResult = await connection.sobject(sobject).create(data);
    saveResult.forEach(saveRes => {
      if (saveRes.errors.length > 0) {
        outputError(saveRes, csvLoader.fileName, index);
      } else {
        const idKey = csvLoader.rows[index].getIdKey();
        const idValue = saveRes.id;
        idMap.set(idKey, idValue);
      }
      index++;
    });
  }

  return idMap;
}

async function deleteDatas(connection: Connection, sobject: string, csvLoader: CsvLoader, idMap: Map<string, string>, transactSize: number): Promise<Map<string, string>> {
  const dataset = csvLoader.getAsJson();
  const deleteIds = dataset.map(v => v['Id'] as string);

  console.log('delete:');
  const chunkedArrays = chunk(deleteIds, transactSize);
  let index = 0;

  for (const targets of chunkedArrays) {

    // delete リクエスト
    const saveResult = await connection.sobject(sobject).del(targets);

    saveResult.forEach(saveRes => {
      if (saveRes.errors.length > 0) {
        outputError(saveRes, csvLoader.fileName, index);
      } else {
        const idKey = csvLoader.rows[index].getIdKey();
        idMap.delete(idKey);
      }
      index++;
    });
  }


  return idMap;
}

async function updateDatas(connection: Connection, sobject: string, csvLoader: CsvLoader, idMap: Map<string, string>, transactSize: number): Promise<Map<string, string>> {
  const dataset = csvLoader.getAsJson();
  console.log('update:');

  const chunkedArrays = chunk(dataset, transactSize);

  let index = 0;
  for (const targets of chunkedArrays) {
    // 更新対象を org から取得
    const targetIds = targets.map(v => v['Id'] as string);
    let recs = await connection.sobject(sobject)
      .find({ Id: { $in : targetIds } }, 'Id');

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

export async function executeByCsv(dirname: string, filename: string, connection: Connection, idMap: Map<string, string>, transactSize: number): Promise<Map<string, string>> {
  const oprAndObj = extractCoc(filename);
  console.log('at executeByCsv:');
  console.log(oprAndObj);
  const operation = oprAndObj[0];
  const sobject = oprAndObj[1];

  // CSV パースとJSON化
  const csvLoader = new CsvLoader(idMap, filename, dirname);

  if (operation === 'insert') {
    return insertDatas(connection, sobject, csvLoader, idMap, transactSize);
  } if (operation === 'delete') {
    return deleteDatas(connection, sobject, csvLoader, idMap, transactSize);
  } if (operation === 'update') {
    return updateDatas(connection, sobject, csvLoader, idMap, transactSize);
  }

  // TODO:
  return null;
}
