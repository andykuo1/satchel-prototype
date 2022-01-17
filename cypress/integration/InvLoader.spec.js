import {
  describeBackwardsCompatibleJSONFormat,
  describeCurrentJSONFormat,
  describeJSONFormat,
} from './DataLoaderHelper.js';

import { importInventoryFromJSON, exportInventoryToJSON } from '../../src/loader/InvLoader.js';
import { createInventory } from '../../src/satchel/inv/Inv.js';
import { createItem } from '../../src/satchel/item/Item.js';

function createFullInventory(invId) {
  let created = createInventory(invId, 'grid', 4, 2, 2);
  let testItem = createItem('test');
  testItem.width = 2;
  testItem.height = 1;
  created.displayName = 'Test Inventory';
  created.items = {
    [testItem.itemId]: testItem,
  };
  created.metadata = {
    test: 'test',
  };
  created.slots = [testItem.itemId, testItem.itemId, null, null];
  return created;
}

function createDefaultInventory(invId) {
  return createInventory(invId, 'grid', 1, 1, 1);
}

function assertInvV2Compatibility(target, invV2) {
  // No differences. This is the same version.
  assert.deepStrictEqual(target, invV2);
}

function assertInvV1Compatibility(target, invV1) {
  // Ignore inv id.
  target.invId = invV1.invId;
  // No differences. V1 is just the original without slot array compression.
  assert.deepStrictEqual(target, invV1);
}

describe('The default inv data format', () => {
  describe('for default inventory', () => {
    describeJSONFormat('inv_v2', createDefaultInventory, exportInventoryToJSON, importInventoryFromJSON);
  });
  describe('for full inventory', () => {
    it('should be modifiable', () => {
      let created = createDefaultInventory('test');
      let fullCreated = createFullInventory('test');
      assert.notDeepEqual(fullCreated, created);
    });
    describeJSONFormat('inv_v2', createFullInventory, exportInventoryToJSON, importInventoryFromJSON);
  });
});

const INV_V2_FIXTURES = {
  default: ['inv_v2_default.json', 'inv_v2_default_export.json'],
  full: ['inv_v2_full.json', 'inv_v2_full_export.json'],
};
describe('The "inv_v2" data format', () => {
  describeBackwardsCompatibleJSONFormat(
    'inv_v2',
    importInventoryFromJSON,
    assertInvV2Compatibility,
    INV_V2_FIXTURES
  );
  describeCurrentJSONFormat(createDefaultInventory, exportInventoryToJSON, INV_V2_FIXTURES);
});

const INV_V1_FIXTURES = {
  default: ['inv_v1_default.json', 'inv_v1_default_export.json'],
  full: ['inv_v1_full.json', 'inv_v1_full_export.json'],
};
describe('The "inv_v1" data format', () => {
  describeBackwardsCompatibleJSONFormat(
    'inv_v1',
    importInventoryFromJSON,
    assertInvV1Compatibility,
    INV_V1_FIXTURES
  );
});
