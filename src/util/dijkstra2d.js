/**
 * @callback EndCallback
 * @param {number} x The x coordinate to evaluate.
 * @param {number} y The y coordinate to evaluate.
 * @returns {boolean} Whether the passed-in coordinate can is an "end" coordinate for the dijkstra path search.
 */

/**
 * @callback NeighborCallback
 * @param {number} x The x coordinate to get neighbors for.
 * @param {number} y The y coordinate to get neighbors for.
 * @param {Array<number>} out The destination array of the coordinate's neighbor ids.
 * @returns {Array<number>} The output array containing the coordinate's neighbor ids.
 */

/**
 * @callback FromCoordCallback
 * @param {number} x The x coordinate to translate to the associated object id.
 * @param {number} y The y coordinate to translate to the associated object id.
 * @returns {number} The associated object id at the x and y coordinates.
 */

/**
 * @callback ToCoordCallback
 * @param {number} id The id of an object to get the coordinates of.
 * @param {Array<number>} out The destination array of neighbors.
 * @returns {Array<number>} The output array containing the x and y coordinates.
 */

/**
 * Performs Dijkstra's on a 2d coordinate system with the passed-in callback functions. It assumes that every
 * coordinate can be translated to an uniquely identifying number to represent node uniqueness. It also assumes
 * the reverse is also easily computable (from node to coordinates). This does NOT use a priority queue.
 *
 * @param {number} x The starting x coordinate.
 * @param {number} y The starting y coordinate.
 * @param {number} minX The minimum x coordinate.
 * @param {number} minY The minimum y coordinate.
 * @param {number} maxX The maximum x coordinate.
 * @param {number} maxY The maximum y coordinate.
 * @param {EndCallback} isEnd A callback that checks with the coordinate should be considered a successful result.
 * @param {NeighborCallback} getNeighbors A callback that gets the neighbor object ids for any given coordinates.
 * @param {FromCoordCallback} fromCoord A callback that converts object ids to coordinates.
 * @param {ToCoordCallback} toCoord A callback that converts coordinates to its associated object ids.
 * @returns {Array<number>} An array of x and y coordinates of the found end coordinates. If none are found, then
 * it will return [ -1, -1 ].
 */
export function dijkstra2d(x, y, minX, minY, maxX, maxY, isEnd, getNeighbors, fromCoord, toCoord) {
  if (Number.isNaN(maxX) || Number.isNaN(maxY)) {
    throw new TypeError('Maximum coordinates must be a number.');
  }

  if (minX < 0 || minY < 0 || maxX < 0 || maxY < 0) {
    throw new Error('Coordinates must be non-negative.');
  }

  if (minX > maxX || minY > maxY) {
    throw new Error('Minimum coordinates must be less than maximum coordinates.');
  }

  if (maxX !== (maxX & 0xff_ff) || maxY !== (maxY & 0xff_ff)) {
    throw new Error('Cannot find coordinates in dimensions larger than 2^16.');
  }

  const outNeighbors = Array.from({ length: 4 });
  const outCoord = Array.from({ length: 2 });

  const visited = new Set();
  const unvisited = [fromCoord(x, y)];
  while (unvisited.length > 0) {
    const node = unvisited.shift();
    const [nodeX, nodeY] = toCoord(node, outCoord);
    if (isEnd(nodeX, nodeY)) {
      return outCoord;
    }

    visited.add(node);

    for (const neighbor of getNeighbors(nodeX, nodeY, outNeighbors)) {
      if (visited.has(neighbor)) {
        continue;
      }

      const [neighborX, neighborY] = toCoord(neighbor, outCoord);
      if (neighborX >= minX && neighborY >= minY && neighborX <= maxX && neighborY <= maxY) {
        unvisited.push(neighbor);
      }
    }
  }

  outCoord[0] = -1;
  outCoord[1] = -1;
  return outCoord;
}
