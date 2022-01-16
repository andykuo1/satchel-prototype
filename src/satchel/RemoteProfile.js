import { getClient, isClientSide } from './app/PeerSatchelConnector.js';
import { ActivityProfileSelect } from './peer/ActivityProfile.js';

export function isProfileRemote(store, profileId) {
  if (isClientSide()) {
    let client = getClient();
    for(let remote of client.remotes) {
      let chosenId = ActivityProfileSelect.getChosenProfile(remote);
      if (chosenId === profileId) {
        return true;
      }
    }
  }
  return false;
}
