# Satchel

## Ideas
[ ] Different item styles: foil, metallic, pearlescent, etc.
[ ] Resizable inventory
[ ] Moveable inventory


Missing Online status for remote inventories
- Need a way to keep a list of those and update that over time.

Join a lobby then pick a profile to be the role as. Switch profiles later?
+ Create/Import Porfile

Password protect a profile. This is a temporary profile and does not save for autoload.

Gift box - right click to open and reveal contents. Should be the same size at the item within.

Each profile can be toggle online or offline.
- Cannot be chosen by players if offline.
- But what if changed while the player has already assumed the role?
  - Kick them out and have them restart
  - The profile select screen should be continuously updated and synced from the dm-side.
- The player view is always READ-ONLY

Does not work on Firefox yet.


Feedback
- Paste Item code is confusing.
- Limited, Limitless, Single
- Rename to Recent

- Trash one-click to open trash

- Cloud icon should show the time since last save.

Gift box or loot boxes. Right click opens a menu so that you can open it? Or right click always opens it?


- ZOOM

a chunked, boundless inventory like space but it expands per chunk as you place things down (and deletes if nothing is there)

As a chunked map editor.
As a collage editor.

Decor items - cannot be edited

What if for a Boundless board, it becomes inset and scrollable inside???

- What do we need? A scrollable inside. A view-resizable board (doesn't resize internal inventory, just the viewport)



To make chunked inventories, we need something like albums. Maybe infinite maps? Is this a Crawl?

A Crawl - a crawling map
- Each inventory chunk is 16 by 16 (cause tradition)
- The viewport keeps track of the current position (should this be saved to the data object?)
  - METADATA!!!
- THe viewport loads only that chunk and its surrounding chunks.
- On scroll, it loads more. But if loading too much, it will wait until scrolling stops, then load.
- Items can go across chunk borders. The chunk with the topleft cell should reneder the item.
  - this means overflow must be visible.
  - This also means that chunks need to be drawn in the correct order? Or maybe just have items be 1 level higher.
- How to store chunks?
- Similar to albums or profiles:

CrawlData:
- crawlId
- chunks: {
  chunkId: chunkData
}
ChunkData:
- chunkId
- chunkX
- chunkY
- invId



drag select box to move multiple items
- after the box is drawn, all items within "pop" into the middle and that can be dragged around to the next spot. On lose focus, it dumps its items into its neighbors in the original position if possible.


metadata should force no stacksize. This way we can have item containers that store their item info in the metadata.


