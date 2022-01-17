/**
 * @typedef {import('../../src/loader/DataLoader.js').ImportDataFormat} ImportDataFormat
 */

import { downloadText } from '../../src/util/downloader.js';

/**
 * Helper function to generate fixture files for data formats. Files are downloaded
 * to 'cypress/downloads'.
 *
 * @template T
 * @param {string} formatType
 * @param {string} fixtureType
 * @param {(id: string) => T} create
 * @param {(target: T) => object} exportToJSON
 */
export function generateJSONFormatFixture(formatType, fixtureType, create, exportToJSON) {
  let created = create('test');
  downloadText(`${formatType}_${fixtureType}.json`, JSON.stringify(created));
  let exported = exportToJSON(created);
  downloadText(`${formatType}_${fixtureType}_export.json`, JSON.stringify(exported));
}

/**
 * @template T
 * @param {string} formatType
 * @param {(id: string) => T} create
 * @param {(target: T) => object} exportToJSON
 * @param {(target: object) => T} importFromJSON
 */
export function describeJSONFormat(formatType, create, exportToJSON, importFromJSON) {
  it('should be ' + formatType, () => {
    let created = create('test');
    let exported = exportToJSON(created);
    assert.equal(exported._type, formatType);
  });
  it('should be json', () => {
    let created = create('test');
    let exported = exportToJSON(created);
    assert.exists(exported);
    assert.typeOf(exported, 'object');
    let imported = importFromJSON(exported);
    assert.exists(imported);
    assert.typeOf(imported, 'object');
  });
  it('should export stringify-able json', () => {
    let created = create('test');
    let exported = exportToJSON(created);
    let jsonString = JSON.stringify(exported);
    assert.exists(jsonString);
    assert.notEqual(jsonString, '[Object object]');
    let parsed = JSON.parse(jsonString);
    assert.isNotEmpty(parsed);
    assert.deepStrictEqual(parsed, exported);
  });
  it('should be consistent', () => {
    let created = create('test');
    let exported = exportToJSON(created);
    let exported2 = exportToJSON(created);
    // Ignore metadata since it is time-sensitive
    exported2._meta = exported._meta;
    assert.deepStrictEqual(exported2, exported, 'exports on the same data should be the same.');
    let imported = importFromJSON(exported);
    let imported2 = importFromJSON(exported);
    assert.deepStrictEqual(imported2, imported, 'imports on the same data should be the same.');
  });
  it('should be persistent', () => {
    let created = create('test');
    let exported = exportToJSON(created);
    let imported = importFromJSON(exported);
    assert.deepStrictEqual(imported, created, 'source and imported data should be the same.');
  });
}

export function describeCurrentJSONFormat(create, exportToJSON, sourceExportMap) {
  it('should be unchanged as default export', () => {
    assert.hasAnyKeys(sourceExportMap, ['default'], 'missing default key for current json format.');
    // Get the second value in the array
    const [, exportedPath] = sourceExportMap.default;
    assert.exists(exportedPath, 'missing exported fixture path.');
    cy.fixture(exportedPath).then((defaultExported) => {
      let created = create('test');
      let exported = exportToJSON(created);
      // Ignore metadata since it is time-sensitive
      exported._meta = defaultExported._meta;
      assert.deepStrictEqual(exported, defaultExported);
    });
  });
}

/**
 * @template T
 * @param {string} formatType
 * @param {(data: ImportDataFormat) => T} importFromJSON
 * @param {(target: T, source: object) => void} assertCompatible
 * @param {Record<string, Array<string>>} sourceExportMap
 */
export function describeBackwardsCompatibleJSONFormat(
  formatType,
  importFromJSON,
  assertCompatible,
  sourceExportMap
) {
  for (let key of Object.keys(sourceExportMap)) {
    const [sourcePath, exportedPath] = sourceExportMap[key];
    it(`should be typed ${formatType} for ${key} data`, () => {
      assert.exists(exportedPath, 'missing exported fixture path.');
      cy.fixture(exportedPath).then((exported) => {
        assert.equal(exported._type, formatType);
      });
    });
    it(`should be importable for ${key} data`, () => {
      assert.exists(sourcePath, 'missing source fixture path.');
      cy.fixture(exportedPath).then((exported) => {
        cy.fixture(sourcePath).then((source) => {
          let imported = importFromJSON(exported);
          assertCompatible(imported, source);
        });
      });
    });
  }
}
