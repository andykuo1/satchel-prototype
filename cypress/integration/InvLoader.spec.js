import { describeBackwardsCompatibleJSONFormat, describeJSONFormat } from './DataLoaderHelper.js';

import { importInventoryFromJSON, exportInventoryToJSON } from '../../src/loader/InvLoader.js';
import { createInventory } from '../../src/satchel/inv/Inv.js';
import { createItem } from '../../src/satchel/item/Item.js';

function createDefaultInventory() {
  let created = createInventory('test', 'grid', 1, 1, 1);
  return created;
}

function createFullInventory() {
  let result = createFullInventoryPreV2();
  result.flags = 0x7;
  return result;
}

function createFullInventoryPreV2() {
  let created = createInventory('test', 'grid', 4, 2, 2);
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

describe('The default inv data format', () => {
  describe('for default inventory', () => {
    describeJSONFormat('inv_v3', createDefaultInventory, exportInventoryToJSON, importInventoryFromJSON);
  });
  describe('for full inventory', () => {
    it('should be modifiable', () => {
      let created = createDefaultInventory();
      let fullCreated = createFullInventory();
      assert.notDeepEqual(fullCreated, created);
      let fullCreatedPreV2 = createFullInventoryPreV2();
      assert.notDeepEqual(fullCreatedPreV2, fullCreated);
      assert.notDeepEqual(fullCreatedPreV2, created);
    });
    describeJSONFormat('inv_v3', createFullInventory, exportInventoryToJSON, importInventoryFromJSON);
  });
});

describe('The "inv_v3" data format', () => {
  describeBackwardsCompatibleJSONFormat(
    'inv_v3',
    'default_export',
    createDefaultInventory,
    exportInventoryToJSON,
    importInventoryFromJSON
  );
  describeBackwardsCompatibleJSONFormat(
    'inv_v3',
    'full_export',
    createFullInventory,
    exportInventoryToJSON,
    importInventoryFromJSON
  );
});

describe('The "inv_v2" data format', () => {
  describeBackwardsCompatibleJSONFormat(
    'inv_v2',
    'default_export',
    createDefaultInventory,
    exportInventoryToJSON,
    importInventoryFromJSON
  );
  describeBackwardsCompatibleJSONFormat(
    'inv_v2',
    'full_export',
    createFullInventoryPreV2,
    exportInventoryToJSON,
    importInventoryFromJSON
  );
});

describe('The "inv_v1" data format', () => {
  describeBackwardsCompatibleJSONFormat(
    'inv_v1',
    'default_export',
    createDefaultInventory,
    exportInventoryToJSON,
    importInventoryFromJSON
  );
  describeBackwardsCompatibleJSONFormat(
    'inv_v1',
    'full_export',
    createFullInventoryPreV2,
    exportInventoryToJSON,
    importInventoryFromJSON
  );
});
