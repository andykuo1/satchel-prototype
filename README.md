# Satchel

So every player has an initial inventory size. This is their main inventory given to them from the start. It can be changed with a character update.

To start, a player needs to import a character sheet. This will set the initial inventory size, permissions, etc. This can be changed later by character updates.

To add items to the inventory, a player can receive Loot or Gift.

Loot is from the DM, also known as Server.
Gift is from another player, also known as Client.

Each of these transactions are done through file transfers of JSON objects. They ALWAYS have a required destination (so people cannot share the same item, duplicating the transaction).

All these transactions are logged and validated to be accurate and non-duplicate. Meaning, there wil be a transactional log keeping track of all these.

There won't be a log on removal of items though, such as dumping things onto the Ground.

The Ground is an empty inventory space players can use as extra temporary space. This space is used to let players dump trash. It it also the place where everything goes into if it cannot fit in the player's inventory. If it cannot fit on the Ground either, it will be permanently destroyed.

Each loot transfer: (these cannot be changed)
- Transaction Id (for Server identification)
- Owner Id (usually the original player id this is intended for)
- Description (for the player to know where this came from)
- Title (for style)
- Transaction Checksum (a hash to verify the contents are correct)

Each gift transfer: (these cannot be changed)
- Source id (the player giving the gift)
- Destination id (the player receiving the gift)
- Gift description (for the player, this replaces the old description)
- Gift checksum

This does mean once sealed, it cannot be re-opened by the sender. It must be resent back as another Gift.

To see if a transaction is valid, we simply check the content with the checksum. If it is okay, we then check the transaction log for the transaction id. If it not in there, we check the checksum for the transaction log. If it is correct, we append it to the log and make a new checksum. Otherwise, it has already been added.

Transaction objects should also be able to drag and drop.

Backups
- Transaction log
- Transaction checksum
- Inventory state => This is not checksum as it can have items removed. As long as item being added are always done through transactions, this should be okay.


