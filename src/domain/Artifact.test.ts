import { withExpectOutput } from 'as-procedure';
import { DomainEntity } from 'domain-objects';
import { given, when, then } from 'test-fns';

import { Artifact } from './Artifact';

/**
 * .what = an example artifact type
 */
interface GitFile {
  uri: string;
  hash: string;
  content: string;
}
class GitFile extends DomainEntity<GitFile> implements GitFile {
  public static primary = ['uri'] as const;
  public static unique = ['uri'] as const;
}

describe('Artifact', () => {
  given('an Artifact<GitFile>', () => {
    const initialFile: GitFile = {
      uri: '/src/index.ts',
      hash: 'abc123',
      content: 'console.log("hello")',
    };

    let currentContent: string | null = initialFile.content;

    const artifact: Artifact<typeof GitFile> = {
      ref: { uri: 'file-001' },
      get: withExpectOutput(async () =>
        currentContent === null
          ? null
          : {
              ...initialFile,
              content: currentContent,
            },
      ),
      set: async () => {
        currentContent = 'console.log("updated")';
        return { ...initialFile, content: currentContent };
      },
      del: async () => {
        currentContent = null;
      },
    };

    when('calling get()', () => {
      then('it should return the initial GitFile content', async () => {
        const result = await artifact.get();
        expect(result?.content).toBe('console.log("hello")');
      });
    });

    when('calling set()', () => {
      then('it should update and return the modified GitFile', async () => {
        const result = await artifact.set({
          content: 'console.log("updated")',
        });
        expect(result.content).toBe('console.log("updated")');
      });
    });

    when('calling del()', () => {
      then('it should remove the content (get returns null)', async () => {
        await artifact.del();
        const result = await artifact.get();
        expect(result).toBeNull();
      });
    });
  });
});
