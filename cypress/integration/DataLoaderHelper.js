import { downloadText } from '../../src/util/downloader.js';

/**
 * @typedef {import('../../src/loader/DataLoader.js').ImportDataFormat} ImportDataFormat
 */

/**
 * @template T
 * @param {string} jsonFormat
 * @param {() => T} jsonDataFactory
 * @param {(target: T) => object} jsonExporter
 * @param {(target: object) => T} jsonImporter
 */
export function describeJSONFormat(jsonFormat, jsonDataFactory, jsonExporter, jsonImporter) {
  it('should be ' + jsonFormat, () => {
    let created = jsonDataFactory();
    let exported = jsonExporter(created);
    assert.equal(exported._type, jsonFormat);
  });
  it('should be json', () => {
    let created = jsonDataFactory();
    let exported = jsonExporter(created);
    assert.exists(exported);
    assert.typeOf(exported, 'object');
    let imported = jsonImporter(exported);
    assert.exists(imported);
    assert.typeOf(imported, 'object');
  });
  it('should export stringify-able json', () => {
    let created = jsonDataFactory();
    let exported = jsonExporter(created);
    let jsonString = JSON.stringify(exported);
    assert.exists(jsonString);
    assert.notEqual(jsonString, '[Object object]');
    let parsed;
    assert.doesNotThrow(() => (parsed = JSON.parse(jsonString)));
    assert.isNotEmpty(parsed);
    assert.deepStrictEqual(parsed, exported);
  });
  it('should be idempotent to create', () => {
    let created = jsonDataFactory();
    let created2 = jsonDataFactory();
    assert.deepStrictEqual(created2, created);
  });
  it('should be idempotent to export', () => {
    let created = jsonDataFactory();
    let created2 = jsonDataFactory();
    let exported = jsonExporter(created);
    let exported2 = jsonExporter(created);
    // Ignore metadata since it is time-sensitive
    exported2._meta = exported._meta;
    assert.deepStrictEqual(created2, created, 'exports should not change source data.');
    assert.deepStrictEqual(exported2, exported, 'exports on the same data should have same results.');
  });
  it('should be idempotent to import', () => {
    let created = jsonDataFactory();
    let created2 = jsonDataFactory();
    let exported = jsonExporter(created);
    let exported2 = jsonExporter(created);
    // Ignore metadata since it is time-sensitive
    exported2._meta = exported._meta;
    let imported = jsonImporter(exported);
    let imported2 = jsonImporter(exported);
    assert.deepStrictEqual(created2, created, 'imports should not change source data.');
    assert.deepStrictEqual(exported2, exported, 'imports should not change export data.');
    assert.deepStrictEqual(imported2, imported, 'imports on the same data should have same results.');
  });
  it('should be isolated and deeply created', () => {
    let created = jsonDataFactory();
    let created2 = jsonDataFactory();
    deeplyMangleObject(created2);
    assert.isTrue(isObjectMangledDeeply(created2));
    assert.isFalse(isObjectMangledDeeply(created));
  });
  it('should be isolated deeply exported from source', () => {
    let created = jsonDataFactory();
    let exported = jsonExporter(created);
    deeplyMangleObject(exported);
    assert.isTrue(isObjectMangledDeeply(exported));
    assert.isFalse(isObjectMangledDeeply(created));
  });
  it('should be isolated deeply imported from source', () => {
    let created = jsonDataFactory();
    let exported = jsonExporter(created);
    let imported = jsonImporter(exported);
    deeplyMangleObject(imported);
    assert.isTrue(isObjectMangledDeeply(imported));
    assert.isFalse(isObjectMangledDeeply(exported));
    assert.isFalse(isObjectMangledDeeply(created));
  });
  it('should be persistent', () => {
    let created = jsonDataFactory();
    let exported = jsonExporter(created);
    let imported = jsonImporter(exported);
    assert.deepStrictEqual(imported, created, 'source and imported data should be the same.');
  });
}

/**
 * Helper function to generate and validate fixture files for data formats. Files are downloaded
 * to 'cypress/downloads'.
 *
 * @template T
 * @param {string} jsonFormat
 * @param {string} fixtureName
 * @param {() => T} jsonDataFactory
 * @param {(target: T) => object} jsonExporter
 * @param {(target: object) => T} jsonImporter
 */
 export function describeBackwardsCompatibleJSONFormat(jsonFormat, fixtureName, jsonDataFactory, jsonExporter, jsonImporter) {
  const created = jsonDataFactory();
  const exported = jsonExporter(created);
  const exportedPath = `${jsonFormat}_${fixtureName}.json`;

  if (exported._type === jsonFormat) {
    // Capture export output as a fixture for the future
    it(`should export correctly for ${fixtureName} data`, () => {
      assert.equal(exported._type, jsonFormat);
      downloadText(exportedPath, JSON.stringify(exported));
      assert.exists(exportedPath, 'should copy missing exported fixtures from "cypress/downloads" to "cypress/fixtures".');
    });
  } else {
    // Validate fixtures exist for the future
    it(`should have an exported fixture for ${fixtureName} data`, () => {
      assert.exists(exportedPath, 'missing exported fixture path');
    });
  }

  // Validate backwards-compatibility for importing
  it(`should import correctly for ${fixtureName} data`, () => {
    cy.fixture(exportedPath).then((uploaded) => {
      // Has expected fixture json format
      assert.equal(uploaded._type, jsonFormat);
      // Can import
      let imported = jsonImporter(uploaded);
      assert.deepStrictEqual(imported, created);
      // Can re-export
      let reExported = jsonExporter(imported);
      // Ignore metadata since it is time-sensitive
      reExported._meta = exported._meta;
      assert.deepStrictEqual(reExported, exported);
    });
  });
}

function deeplyMangleObject(obj) {
  obj.__FOO__ = '__BAR__';
  for (let key of Object.keys(obj)) {
    let value = obj[key];
    if (typeof value === 'object' && value !== null) {
      deeplyMangleObject(value);
    }
  }
}

function isObjectMangledDeeply(obj) {
  let keys = Object.keys(obj);
  for (let key of keys) {
    let value = obj[key];
    if (key === '__FOO__') {
      return value === '__BAR__';
    }
    if (typeof value === 'object' && value !== null && isObjectMangledDeeply(value)) {
      return true;
    }
  }
  return false;
}
