export function distanceSquared(x1, y1, x2, y2)
{
    let dx = x2 - x1;
    let dy = y2 - y1;
    return dx * dx + dy * dy;
}

/**
 * Generates a uuid v4.
 * 
 * @param {number} a The placeholder (serves for recursion within function).
 * @returns {string} The universally unique id.
 */
export function uuid(a = undefined)
{
    // https://gist.github.com/jed/982883
    return a?(a^Math.random()*16>>a/4).toString(16):([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,uuid);
}

/**
 * Interpolates, or lerps, between 2 values by the specified amount, dt.
 * 
 * @param {number} a The initial value.
 * @param {number} b The final value.
 * @param {number} dt The amount changed.
 * @returns {number} The interpolated value.
 */
export function lerp(a, b, dt)
{
    return a * (1 - dt) + b * dt;
}

/**
 * Generates a number hash for the string. For an empty string, it will return 0.
 * 
 * @param {string} [value=''] The string to hash.
 * @returns {number} A hash that uniquely identifies the string.
 */
export function stringHash(value = '')
{
    let hash = 0;
    for(let i = 0, len = value.length; i < len; i++)
    {
        hash = Math.imul(31, hash) + value.charCodeAt(i) | 0;
    }
    return hash;
}

/**
 * @callback EndCallback
 * @param {Number} x The x coordinate to evaluate.
 * @param {Number} y The y coordinate to evaluate.
 * @returns {Boolean} Whether the passed-in coordinate can is an "end" coordinate for the dijkstra path search.
 */

/**
 * @callback NeighborCallback
 * @param {Number} x The x coordinate to get neighbors for.
 * @param {Number} y The y coordinate to get neighbors for.
 * @param {Array<Number>} out The destination array of the coordinate's neighbor ids.
 * @returns {Array<Number>} The output array containing the coordinate's neighbor ids.
 */

/**
 * @callback FromCoordCallback
 * @param {Number} x The x coordinate to translate to the associated object id.
 * @param {Number} y The y coordinate to translate to the associated object id.
 * @returns {Number} The associated object id at the x and y coordinates.
 */

/**
 * @callback ToCoordCallback
 * @param {Number} id The id of an object to get the coordinates of.
 * @param {Array<Number>} out The destination array of neighbors.
 * @returns {Array<Number>} The output array containing the x and y coordinates.
 */

/**
 * Performs Dijkstra's on a 2d coordinate system with the passed-in callback functions. It assumes that every
 * coordinate can be translated to an uniquely identifying number to represent node uniqueness. It also assumes
 * the reverse is also easily computable (from node to coordinates). This does NOT use a priority queue.
 * 
 * @param {Number} x The starting x coordinate.
 * @param {Number} y The starting y coordinate.
 * @param {Number} minX The minimum x coordinate.
 * @param {Number} minY The minimum y coordinate.
 * @param {Number} maxX The maximum x coordinate.
 * @param {Number} maxY The maximum y coordinate.
 * @param {EndCallback} isEnd A callback that checks with the coordinate should be considered a successful result.
 * @param {NeighborCallback} getNeighbors A callback that gets the neighbor object ids for any given coordinates.
 * @param {FromCoordCallback} fromCoord A callback that converts object ids to coordinates.
 * @param {ToCoordCallback} toCoord A callback that converts coordinates to its associated object ids.
 * @returns {Array<Number>} An array of x and y coordinates of the found end coordinates. If none are found, then
 * it will return [ -1, -1 ].
 */
export function dijkstra2d(x, y, minX, minY, maxX, maxY, isEnd, getNeighbors, fromCoord, toCoord)
{
    if (Number.isNaN(maxX) || Number.isNaN(maxY)) throw new Error('Maximum coordinates must be a number.');
    if (minX < 0 || minY < 0 || maxX < 0 || maxY < 0) throw new Error('Coordinates must be non-negative.');
    if (minX > maxX || minY > maxY) throw new Error('Minimum coordinates must be less than maximum coordinates.');
    if (maxX !== (maxX & 0xFFFF) || maxY !== (maxY & 0xFFFF)) throw new Error('Cannot find coordinates in dimensions larger than 2^16.');
    
    let outNeighbors = new Array(4);
    let outCoord = new Array(2);

    let visited = new Set();
    let unvisited = [
        fromCoord(x, y)
    ];
    while(unvisited.length > 0)
    {
        let node = unvisited.shift();
        let [ nodeX, nodeY ] = toCoord(node, outCoord);
        if (isEnd(nodeX, nodeY)) return outCoord;

        visited.add(node);

        for(let neighbor of getNeighbors(nodeX, nodeY, outNeighbors))
        {
            if (visited.has(neighbor)) continue;

            let [ neighborX, neighborY ] = toCoord(neighbor, outCoord);
            if (neighborX >= minX && neighborY >= minY && neighborX <= maxX && neighborY <= maxY)
            {
                unvisited.push(neighbor);
            }
        }
    }

    outCoord[0] = -1;
    outCoord[1] = -1;
    return outCoord;
}
