import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages, AuthInfo, Connection } from '@salesforce/core';
import { findCsv } from '../../../libs/files.js';
import { executeByCsv } from '../../../libs/migrate.js';
Messages.importMessagesDirectory(dirname(fileURLToPath(import.meta.url)));
const messages = Messages.loadMessages('azalea-works', 'azalea.data.apply');
export default class AzaleaDataApply extends SfCommand {
    static summary = messages.getMessage('summary');
    static description = messages.getMessage('description');
    static examples = messages.getMessages('examples');
    static flags = {
        user: Flags.string({
            summary: messages.getMessage('flags.user.summary'),
            char: 'u',
            required: true,
        }),
        'data-folder': Flags.string({
            summary: messages.getMessage('flags.data-folder.summary'),
            char: 'd',
            default: 'data',
        }),
        transactsize: Flags.integer({
            summary: messages.getMessage('flags.transactsize.summary'),
            char: 't',
            min: 1,
            max: 200,
            default: 20,
        }),
    };
    async run() {
        const { flags } = await this.parse(AzaleaDataApply);
        const user = flags.user;
        const directory = flags['data-folder'];
        const maxsize = flags.transactsize;
        this.log(`Running as ${user}. Searching csv files from ${directory}.(Transaction size : ${maxsize})`);
        // load files.
        const csvNames = await findCsv(directory);
        this.log(`Execution files: [${csvNames.join(',')}]`);
        // return if no files.
        if (csvNames.length === 0) {
            return {
                executedFiles: [],
            };
        }
        // Initialize the authorization for the provided username
        this.log(`Auth as ${user}.`);
        const authInfo = await AuthInfo.create({ username: user });
        const connection = await Connection.create({ authInfo });
        // definition id marker.
        const idMap = new Map();
        for (const filename of csvNames) {
            this.log(`Executing ${filename}.....`);
            await executeByCsv(directory, filename, connection, idMap, Number(maxsize));
        }
        return {
            executedFiles: csvNames,
        };
    }
}
//# sourceMappingURL=apply.js.map