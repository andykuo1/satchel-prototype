import { describeBackwardsCompatibleJSONFormat, describeJSONFormat } from './DataLoaderHelper.js';

import { exportAlbumToJSON, importAlbumFromJSON } from '../../src/loader/AlbumLoader.js';
import { ALBUM_FLAG_EXPAND_BIT, ALBUM_FLAG_HIDDEN_BIT, ALBUM_FLAG_LOCKED_BIT, createAlbum } from '../../src/satchel/album/Album.js';
import { createItem } from '../../src/satchel/item/Item.js';

function createDefaultAlbum() {
  let created = createAlbum('test');
  return created;
}

function createFullAlbum() {
  let created = createAlbum('test');
  created.displayName = 'Test Album';
  created.flags |= ALBUM_FLAG_EXPAND_BIT | ALBUM_FLAG_HIDDEN_BIT | ALBUM_FLAG_LOCKED_BIT;
  created.items = {
    test: createItem('test'),
  };
  return created;
}

describe('The default album data format', () => {
  describe('for default album', () => {
    describeJSONFormat('album_v3', createDefaultAlbum, exportAlbumToJSON, importAlbumFromJSON);
  });
  describe('for full album', () => {
    it('should be modifiable', () => {
      let created = createDefaultAlbum();
      let fullCreated = createFullAlbum();
      assert.notDeepEqual(fullCreated, created);
    });
    describeJSONFormat('album_v3', createFullAlbum, exportAlbumToJSON, importAlbumFromJSON);
  });
});

describe('The "album_v3" data format', () => {
  describeBackwardsCompatibleJSONFormat('album_v3', 'default_export', createDefaultAlbum, exportAlbumToJSON, importAlbumFromJSON);
  describeBackwardsCompatibleJSONFormat('album_v3', 'full_export', createFullAlbum, exportAlbumToJSON, importAlbumFromJSON);
});

describe('The "album_v2" data format', () => {
  describeBackwardsCompatibleJSONFormat('album_v2', 'default_export', createDefaultAlbum, exportAlbumToJSON, importAlbumFromJSON);
  describeBackwardsCompatibleJSONFormat('album_v2', 'full_export', createFullAlbum, exportAlbumToJSON, importAlbumFromJSON);
});

describe('The "album_v1" data format', () => {
  describeBackwardsCompatibleJSONFormat('album_v1', 'default_export', createDefaultAlbum, exportAlbumToJSON, importAlbumFromJSON);
  describeBackwardsCompatibleJSONFormat('album_v1', 'full_export', createFullAlbum, exportAlbumToJSON, importAlbumFromJSON);
});
