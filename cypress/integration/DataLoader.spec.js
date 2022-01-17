import { exportDataToJSON, importDataFromJSON } from '../../src/loader/DataLoader.js';

describe('The data loader', () => {
  it('should have expected structure', () => {
    let formatType = 'exampleV1';
    let exported = exportDataToJSON(formatType, {}, {});
    assert.hasAnyKeys(exported, ['_type', '_data', '_meta']);
    assert.equal(exported._type, formatType);
  });
  it('should be persistent', () => {
    let formatType = 'exampleV1';
    let data = { data: 'data', random: Math.floor(Math.random() * 100) };
    let metadata = { meta: 'meta', random: Math.floor(Math.random() * 100) };
    let exported = exportDataToJSON(formatType, data, metadata);
    let [imported, importedMeta] = importDataFromJSON(exported, formatType, (data, metadata) => [
      data,
      metadata,
    ]);
    assert.deepStrictEqual(imported, data);
    // Ignore time metadata
    delete importedMeta.time;
    assert.deepStrictEqual(importedMeta, metadata);
  });
});
