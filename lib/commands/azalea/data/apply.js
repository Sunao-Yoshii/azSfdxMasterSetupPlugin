"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sf_plugins_core_1 = require("@salesforce/sf-plugins-core");
const core_1 = require("@salesforce/core");
const files_1 = require("../../../lib/files");
const migrate_1 = require("../../../lib/migrate");
core_1.Messages.importMessagesDirectory(__dirname);
const messages = core_1.Messages.load('azalea-works', 'azalea.data.apply', [
    'summary',
    'description',
    'examples',
    'flags.user.summary',
    'flags.transactsize.summary',
    'flags.directory.summary',
]);
class AzaleaDataApply extends sf_plugins_core_1.SfCommand {
    async run() {
        const { flags } = await this.parse(AzaleaDataApply);
        const user = flags.user;
        const directory = flags.directory;
        const maxsize = flags.execsize;
        this.log(`Running as ${user}. Searching csv files from ${directory}.(Transaction size : ${maxsize})`);
        // load files.
        const csvNames = await (0, files_1.findCsv)(directory);
        this.log(`Execution files: ${csvNames}`);
        // return if no files.
        if (csvNames.length === 0) {
            return {
                executedFiles: [],
            };
        }
        // Initialize the authorization for the provided username
        this.log(`Auth as ${user}.`);
        const authInfo = await core_1.AuthInfo.create({ username: user });
        const connection = await core_1.Connection.create({ authInfo });
        // definition id marker.
        const idMap = new Map();
        // loop execution files.
        for (const filename of csvNames) {
            this.log(`Executing ${filename}.....`);
            await (0, migrate_1.executeByCsv)(directory, filename, connection, idMap, Number(maxsize));
        }
        return {
            executedFiles: csvNames,
        };
    }
}
exports.default = AzaleaDataApply;
AzaleaDataApply.summary = messages.getMessage('summary');
AzaleaDataApply.description = messages.getMessage('description');
AzaleaDataApply.examples = messages.getMessages('examples');
AzaleaDataApply.flags = {
    user: sf_plugins_core_1.Flags.string({
        summary: messages.getMessage('flags.user.summary'),
        char: 'u',
        required: true,
    }),
    directory: sf_plugins_core_1.Flags.string({
        summary: messages.getMessage('flags.directory.summary'),
        char: 'd',
        required: false,
        default: 'data'
    }),
    execsize: sf_plugins_core_1.Flags.string({
        summary: messages.getMessage('flags.transactsize.summary'),
        char: 's',
        required: false,
        default: '20'
    }),
};
//# sourceMappingURL=apply.js.map