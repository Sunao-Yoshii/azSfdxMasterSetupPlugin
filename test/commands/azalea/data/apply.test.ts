import { expect, test } from '@oclif/test';

describe('azalea data apply', () => {
  test
    .stdout()
    .command(['azalea data apply'])
    .it('runs hello', (ctx) => {
      expect(ctx.stdout).to.contain('hello world');
    });

  test
    .stdout()
    .command(['azalea data apply', '--name', 'Astro'])
    .it('runs hello --name Astro', (ctx) => {
      expect(ctx.stdout).to.contain('hello Astro');
    });
});
