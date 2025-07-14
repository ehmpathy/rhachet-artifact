# rhachet-artifact

![test](https://github.com/ehmpathy/rhachet-artifact/workflows/test/badge.svg)
![publish](https://github.com/ehmpathy/rhachet-artifact/workflows/publish/badge.svg)

declare artifacts with a simple, universal contract

# purpose

- simplify usage of artifacts
- standardize shape of artifacts

# install

```sh
npm install rhachet-artifact
```

# use

usage should typically be implemented via an extension library

here's a few examples
- [rhachet-artifact-git](https://github.com/ehmpathy/rhachet-artifact-git)

here's a breakdown of how though

### declare the resource to use as an artifact

lets use a zip file as an artifact, for example

```ts
interface ZipFile {
  /**
   * .what = where this file is persisted
   */
  uri: string;

  /**
   * .what = the hash of the content for comparison
   */
  hash: string;

  /**
   * .what = the actual contents, in { [filename]: content } format
   */
  contents: Record<string, string>;
}
class ZipFile extends DomainEntity<ZipFile> implements ZipFile {
  public static unique = ['uri'] as const;
}
```

### declare how to create artifacts of that resource

create a generator which will fillout the get/set/del mechanisms of the artifact.

```ts
/**
 * .what = generates a ZipFile Artifact
 * .why = simplify usage of zip files via artifact contract
 */
export const genArtifactZipFile = (
  ref: { uri: string },
): Artifact<typeof ZipFile, Record<string, string>> => {
  return new Artifact<typeof ZipFile, Record<string, string>>({
    ref,
    get: withExpectOutput(async () => {
      const files = await getZipFile(ref.uri);
      if (!files) return null;

      const buffer = await fs.readFile(ref.uri);
      return new ZipFile({
        uri: ref.uri,
        hash: hashBuffer(buffer),
        files,
      });
    }),
    set: async ({ content }) => {
      const buffer = await setZipFile(ref.uri, content);
      return new ZipFile({
        uri: ref.uri,
        hash: hashBuffer(buffer),
        files: content,
      });
    },
    del: async () => {
      await deleteZipFile(ref.uri);
    },
  });
};
```

### use your artifacts

```ts
// 📦 write to a zip artifact
const zipArtifact = genArtifactZipFile({ uri: 'output.zip' });
await zipArtifact.set({
  content: {
    'hello.txt': 'hello world',
    'readme.md': '# this is a zip file',
  },
});

// 📂 read from a zip artifact
const result = await zipArtifact.get().expect('isPresent');
console.log(result.files['hello.txt']);  // → "hello world"
console.log(result.files['readme.md']);  // → "# this is a zip file"

// 🗑 delete the zip artifact
await zipArtifact.del();
```
