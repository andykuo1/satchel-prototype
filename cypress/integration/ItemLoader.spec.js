import { describeBackwardsCompatibleJSONFormat, describeJSONFormat } from './DataLoaderHelper.js';

import { importItemFromJSON, exportItemToJSON } from '../../src/loader/ItemLoader.js';
import { createItem } from '../../src/satchel/item/Item.js';

function createDefaultItem() {
  let created = createItem('test');
  return created;
}

function createFullItem() {
  let created = createItem('test');
  created.background = '#ff0000';
  created.description = 'Test notes.';
  created.displayName = 'Test';
  created.height = 4;
  created.imgSrc = 'some.url';
  created.metadata = { test: 'test' };
  created.stackSize = 10;
  created.width = 4;
  return created;
}

describe('The default item data format', () => {
  describe('for default item', () => {
    describeJSONFormat('item_v2', createDefaultItem, exportItemToJSON, importItemFromJSON);
  });
  describe('for full item', () => {
    it('should be modifiable', () => {
      let created = createDefaultItem();
      let fullCreated = createFullItem();
      assert.notDeepEqual(fullCreated, created);
    });
    describeJSONFormat('item_v2', createFullItem, exportItemToJSON, importItemFromJSON);
  });
});

describe('The "item_v2" data format', () => {
  describeBackwardsCompatibleJSONFormat(
    'item_v2',
    'default_export',
    createDefaultItem,
    exportItemToJSON,
    importItemFromJSON
  );
  describeBackwardsCompatibleJSONFormat(
    'item_v2',
    'full_export',
    createFullItem,
    exportItemToJSON,
    importItemFromJSON
  );
});

describe('The "item_v1" data format', () => {
  describeBackwardsCompatibleJSONFormat(
    'item_v1',
    'default_export',
    createDefaultItem,
    exportItemToJSON,
    importItemFromJSONForV1
  );
  describeBackwardsCompatibleJSONFormat(
    'item_v1',
    'full_export',
    createFullItem,
    exportItemToJSON,
    importItemFromJSONForV1
  );
});

function importItemFromJSONForV1(data) {
  let result = importItemFromJSON(data);
  // HACK: Ignore item id checks since V1 always generates unique ones.
  result.itemId = 'test';
  return result;
}
