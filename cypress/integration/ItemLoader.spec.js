import {
  describeBackwardsCompatibleJSONFormat,
  describeCurrentJSONFormat,
  describeJSONFormat,
} from './DataLoaderHelper.js';

import { importItemFromJSON, exportItemToJSON } from '../../src/loader/ItemLoader.js';
import { createItem } from '../../src/satchel/item/Item.js';

function createFullItem(itemId) {
  let created = createItem(itemId);
  created.background = '#ff0000';
  created.description = 'Test notes.';
  created.displayName = 'Test';
  created.height = 4;
  created.imgSrc = 'some.url';
  created.itemId = 'test';
  created.metadata = { test: 'test' };
  created.stackSize = 10;
  created.width = 4;
  return created;
}

function assertItemV2Compatibility(target, itemV2) {
  // No differences. This is the same version.
  assert.deepStrictEqual(target, itemV2);
}

function assertItemV1Compatibility(target, itemV1) {
  // Ignore item id.
  target.itemId = itemV1.itemId;
  // No differences. V2 changes only the exchange format.
  assert.deepStrictEqual(target, itemV1);
}

describe('The default item data format', () => {
  describe('for default item', () => {
    describeJSONFormat('item_v2', createItem, exportItemToJSON, importItemFromJSON);
  });
  describe('for full item', () => {
    it('should be modifiable', () => {
      let created = createItem('test');
      let fullCreated = createFullItem('test');
      assert.notDeepEqual(fullCreated, created);
    });
    describeJSONFormat('item_v2', createFullItem, exportItemToJSON, importItemFromJSON);
  });
});

const ITEM_V2_FIXTURES = {
  default: ['item_v2_default.json', 'item_v2_default_export.json'],
  full: ['item_v2_full.json', 'item_v2_full_export.json'],
};
describe('The "item_v2" data format', () => {
  describeBackwardsCompatibleJSONFormat(
    'item_v2',
    importItemFromJSON,
    assertItemV2Compatibility,
    ITEM_V2_FIXTURES
  );
  describeCurrentJSONFormat(createItem, exportItemToJSON, ITEM_V2_FIXTURES);
});

const ITEM_V1_FIXTURES = {
  default: ['item_v1_default.json', 'item_v1_default_export.json'],
  full: ['item_v1_full.json', 'item_v1_full_export.json'],
};
describe('The "item_v1" data format', () => {
  describeBackwardsCompatibleJSONFormat(
    'item_v1',
    importItemFromJSON,
    assertItemV1Compatibility,
    ITEM_V1_FIXTURES
  );
});
