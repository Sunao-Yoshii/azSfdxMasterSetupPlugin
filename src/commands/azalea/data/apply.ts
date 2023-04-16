import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages, AuthInfo, Connection } from '@salesforce/core';
import { findCsv } from '../../../lib/files';
import { executeByCsv } from '../../../lib/migrate';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.load('azalea-works', 'azalea.data.apply', [
  'summary',
  'description',
  'examples',
  'flags.user.summary',
  'flags.directory.summary',
]);

export type AzaleaDataApplyResult = {
  executedFiles: string[];
};

export default class AzaleaDataApply extends SfCommand<AzaleaDataApplyResult> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');

  public static readonly flags = {
    user: Flags.string({
      summary: messages.getMessage('flags.user.summary'),
      char: 'u',
      required: true,
    }),
    directory: Flags.string({
      summary: messages.getMessage('flags.directory.summary'),
      char: 'd',
      required: false,
      default: 'data'
    }),
  };

  public async run(): Promise<AzaleaDataApplyResult> {
    const { flags } = await this.parse(AzaleaDataApply);

    const user = flags.user;
    const directory = flags.directory;

    this.log(`Running as ${user}. Searching csv files from ${directory}.`);

    // load files.
    const csvNames = await findCsv(directory);
    this.log(`Execution files: ${csvNames}`);

    // return if no files.
    if (csvNames.length === 0) {
      return {
        executedFiles:[],
      };
    }

    // Initialize the authorization for the provided username
    this.log(`Auth as ${user}.`);
    const authInfo = await AuthInfo.create({ username: user });
    const connection = await Connection.create({ authInfo });

    // definition id marker.
    const idMap: Map<string, string> = new Map<string, string> ();

    // loop execution files.
    for (const filename of csvNames) {
      this.log(`Executing ${filename}.....`);
      await executeByCsv(directory, filename, connection, idMap);
    }

    return {
      executedFiles: csvNames,
    };
  }
}
