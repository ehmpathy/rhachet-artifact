import { withExpectOutput } from 'as-procedure';
import { DomainEntity } from 'domain-objects';
import { given, then, when } from 'test-fns';

import type { Artifact } from './Artifact';

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

/**
 * .what = an example generic artifact type
 * .why = demonstrates the issue with generic classes losing type parameters
 */
interface GenericGitFile<TContent> {
  uri: string;
  hash: string;
  content: TContent;
}
class GenericGitFile<TContent> extends DomainEntity<GenericGitFile<TContent>> {
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

  given('an Artifact<GenericGitFile> with string content', () => {
    const initialFile: GenericGitFile<string> = {
      uri: '/src/index.ts',
      hash: 'abc123',
      content: 'console.log("hello")',
    };

    let currentContent: string | null = initialFile.content;

    const artifact: Artifact<typeof GenericGitFile, string> = {
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
      then(
        'it should return content typed as string, not unknown',
        async () => {
          const result = await artifact.get();
          const typedContent: string | undefined = result?.content;
          expect(typedContent).toBe('console.log("hello")');
        },
      );
    });

    when('calling set()', () => {
      then(
        'it should return content typed as string, not unknown',
        async () => {
          const result = await artifact.set({
            content: 'console.log("updated")',
          });
          const typedContent: string = result.content;
          expect(typedContent).toBe('console.log("updated")');
        },
      );
    });
  });
});
