import {
  describeBackwardsCompatibleJSONFormat,
  describeCurrentJSONFormat,
  describeJSONFormat,
} from './DataLoaderHelper.js';

import { exportAlbumToJSON, importAlbumFromJSON } from '../../src/loader/AlbumLoader.js';
import { createAlbum } from '../../src/satchel/album/Album.js';
import { createItem } from '../../src/satchel/item/Item.js';

function createFullAlbum(albumId) {
  let created = createAlbum(albumId);
  created.albumId = albumId;
  created.displayName = 'Test Album';
  created.expand = true;
  created.hidden = true;
  (created.items = { test: createItem('test') }), (created.locked = true);
  return created;
}

function assertAlbumV1Compatibility(target, albumV1) {
  // No differences. This is the same version.
  assert.deepStrictEqual(target, albumV1);
}

describe('The default album data format', () => {
  describe('for default album', () => {
    describeJSONFormat('album_v1', createAlbum, exportAlbumToJSON, importAlbumFromJSON);
  });
  describe('for full album', () => {
    it('should be modifiable', () => {
      let created = createAlbum('test');
      let fullCreated = createFullAlbum('test');
      assert.notDeepEqual(fullCreated, created);
    });
    describeJSONFormat('album_v1', createFullAlbum, exportAlbumToJSON, importAlbumFromJSON);
  });
});

const ALBUM_V1_FIXTURES = {
  default: ['album_v1_default.json', 'album_v1_default_export.json'],
  full: ['album_v1_full.json', 'album_v1_full_export.json'],
};
describe('The "album_v1" data format', () => {
  describeBackwardsCompatibleJSONFormat(
    'album_v1',
    importAlbumFromJSON,
    assertAlbumV1Compatibility,
    ALBUM_V1_FIXTURES
  );
  describeCurrentJSONFormat(createAlbum, exportAlbumToJSON, ALBUM_V1_FIXTURES);
});
