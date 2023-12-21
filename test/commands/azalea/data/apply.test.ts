import { TestContext } from '@salesforce/core/lib/testSetup.js';
import { expect } from 'chai';
import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
import AzaleaDataApply from '../../../../src/commands/azalea/data/apply.js';

describe('azalea data apply', () => {
  const $$ = new TestContext();
  let sfCommandStubs: ReturnType<typeof stubSfCommandUx>;

  beforeEach(() => {
    sfCommandStubs = stubSfCommandUx($$.SANDBOX);
  });

  afterEach(() => {
    $$.restore();
  });

  it('runs hello', async () => {
    await AzaleaDataApply.run([]);
    const output = sfCommandStubs.log
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(output).to.include('hello world');
  });

  it('runs hello with --json and no provided name', async () => {
    const result = await AzaleaDataApply.run([]);
    expect(result.path).to.equal(
      'D:\\OneDrive\\workspace\\sandbox\\sfdxMasterSetupPlugin\\azalea-works\\src\\commands\\azalea\\data\\apply.ts'
    );
  });

  it('runs hello world --name Astro', async () => {
    await AzaleaDataApply.run(['--name', 'Astro']);
    const output = sfCommandStubs.log
      .getCalls()
      .flatMap((c) => c.args)
      .join('\n');
    expect(output).to.include('hello Astro');
  });
});
