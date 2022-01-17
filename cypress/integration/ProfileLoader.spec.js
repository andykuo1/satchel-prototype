import {
  describeBackwardsCompatibleJSONFormat,
  describeCurrentJSONFormat,
  describeJSONFormat,
} from './DataLoaderHelper.js';

import { exportProfileToJSON, importProfileFromJSON } from '../../src/loader/ProfileLoader.js';
import { createProfile } from '../../src/satchel/profile/Profile.js';

function createFullProfile(profileId) {
  let created = createProfile(profileId);
  (created.albums = ['test']), (created.displayName = 'Test Profile');
  (created.invs = ['test']), (created.profileId = 'test');
  return created;
}

function assertProfileLinksV1Compatibility(target, profileLinkV1) {
  // No differences. This is the same version.
  assert.deepStrictEqual(target, profileLinkV1);
}

describe('The default profile links data format', () => {
  describe('for default profile links', () => {
    describeJSONFormat('profile_links_v1', createProfile, exportProfileToJSON, importProfileFromJSON);
  });
  describe('for full profile links', () => {
    it('should be modifiable', () => {
      let created = createProfile('test');
      let fullCreated = createFullProfile('test');
      assert.notDeepEqual(fullCreated, created);
    });
    describeJSONFormat('profile_links_v1', createFullProfile, exportProfileToJSON, importProfileFromJSON);
  });
});

const PROFILE_V1_FIXTURES = {
  default: ['profile_links_v1_default.json', 'profile_links_v1_default_export.json'],
  full: ['profile_links_v1_full.json', 'profile_links_v1_full_export.json'],
};
describe('The "profile_links_v1" data format', () => {
  describeBackwardsCompatibleJSONFormat(
    'profile_links_v1',
    importProfileFromJSON,
    assertProfileLinksV1Compatibility,
    PROFILE_V1_FIXTURES
  );
  describeCurrentJSONFormat(createProfile, exportProfileToJSON, PROFILE_V1_FIXTURES);
});
