import { describeBackwardsCompatibleJSONFormat, describeJSONFormat } from './DataLoaderHelper.js';

import { exportProfileToJSON, importProfileFromJSON } from '../../src/loader/ProfileLoader.js';
import { createProfile } from '../../src/satchel/profile/Profile.js';

function createDefaultProfile() {
  let created = createProfile('test');
  return created;
}

function createFullProfile() {
  let created = createProfile('test');
  created.albums = ['test'];
  created.displayName = 'Test Profile';
  created.invs = ['test'];
  created.profileId = 'test';
  return created;
}

function assertProfileLinksV1Compatibility(target, profileLinkV1) {
  // No differences. This is the same version.
  assert.deepStrictEqual(target, profileLinkV1);
}

describe('The default profile links data format', () => {
  describe('for default profile links', () => {
    describeJSONFormat('profile_links_v1', createDefaultProfile, exportProfileToJSON, importProfileFromJSON);
  });
  describe('for full profile links', () => {
    it('should be modifiable', () => {
      let created = createDefaultProfile();
      let fullCreated = createFullProfile();
      assert.notDeepEqual(fullCreated, created);
    });
    describeJSONFormat('profile_links_v1', createFullProfile, exportProfileToJSON, importProfileFromJSON);
  });
});

describe('The "profile_links_v1" data format', () => {
  describeBackwardsCompatibleJSONFormat(
    'profile_links_v1',
    'default_export',
    createDefaultProfile,
    exportProfileToJSON,
    importProfileFromJSON
  );
  describeBackwardsCompatibleJSONFormat(
    'profile_links_v1',
    'full_export',
    createFullProfile,
    exportProfileToJSON,
    importProfileFromJSON
  );
});
