import { Connection } from '@salesforce/core';
export declare function executeByCsv(dirname: string, filename: string, connection: Connection, idMap: Map<string, string>, transactSize: number): Promise<Map<string, string>>;
