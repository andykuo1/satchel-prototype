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
    let data = { data: 'data', random: Math.random() };
    let metadata = { meta: 'meta', random: Math.random() };
    let exported = exportDataToJSON(formatType, data, metadata);
    let [imported, importedMeta] = importDataFromJSON(exported, formatType, (data, metadata) => [
      data,
      metadata,
    ]);
    assert.deepStrictEqual(imported, data);
    assert.deepStrictEqual(importedMeta, metadata);
  });
});
