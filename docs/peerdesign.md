# Peerful Design

The goal is to make a reliable peer-to-peer system that does not lose data and can change format easily.

Server -> Many Clients

What we need:
- On Client connection, Server gives source of truth back to start the Client where they should be.
- Client makes local changes and sends to Server
- Server stores Client data

Actions:
- Create
  - A new player has joined.
  - Do they have an existing inventory for them?
    - Create one if not.
    - Otherwise, give them their last stored inventory state.
- Sync
  - A connected player sends an update to the server.
  - Does it conflict with what is already there?
    - Do we overwrite?
      - The server should keep both versions and be made aware there is a deviation.
      - The server can reconcile in the future.
- Reset
  - The server has a new inventory state for the player.
  - Does it conflict with what is already there?
    - Let the player choose if they want to overwrite what they have, or maybe fix the differences?
- Edit
  - The server has an update for an item.
  - Send it.
- Gift
  - A player (or Server) wants to give an Item to another player.


- Always use Player positioning.
- Item details can be remedied in a special menu.


- Every Player should be able to Create an Item and Gift it to Someone.
- The Server should be able to restore any lost data on Player side.
  - How does the Server associate Player with StoredData?
    - Player needs an ID?
    - PlayerName: .....
    - DisplayName: (same as player name, but can be changed?)
- The Server should also be a Player.


Auto-Join: (inventory to be non-existant)

PlayerList (reassign per inventory)
- 


