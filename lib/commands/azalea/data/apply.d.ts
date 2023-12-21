import { SfCommand } from '@salesforce/sf-plugins-core';
export type AzaleaDataApplyResult = {
    executedFiles: string[];
};
export default class AzaleaDataApply extends SfCommand<AzaleaDataApplyResult> {
    static readonly summary: string;
    static readonly description: string;
    static readonly examples: string[];
    static readonly flags: {
        user: import("@oclif/core/lib/interfaces/parser.js").OptionFlag<string, import("@oclif/core/lib/interfaces/parser.js").CustomOptions>;
        'data-folder': import("@oclif/core/lib/interfaces/parser.js").OptionFlag<string, import("@oclif/core/lib/interfaces/parser.js").CustomOptions>;
        transactsize: import("@oclif/core/lib/interfaces/parser.js").OptionFlag<number, import("@oclif/core/lib/interfaces/parser.js").CustomOptions>;
    };
    run(): Promise<AzaleaDataApplyResult>;
}
