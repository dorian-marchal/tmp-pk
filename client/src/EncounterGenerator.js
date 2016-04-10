var shuffle = require('array-shuffle');

/**
 * Generates Pokémon encounters based on jeuxvideo.com forum posts.
 *
 * @param {object} pokemonRepartitionList See #setPokemonRepartitionList()
 * @param {float} wantedEncounterRate Global wanted encounter rate.
 * @constructor
 */
var EncounterGenerator = function(pokemonRepartitionList, wantedEncounterRate) {
    this.setPokemonRepartitionList(pokemonRepartitionList);
    this.setWantedEncounterRate(wantedEncounterRate || 1);
    this.update();
};

/**
 * Minimum gap between to post IDs on a jeuxvideo.com topic.
 * @type {int}
 */
EncounterGenerator.MIN_GAP_BETWEEN_POST_IDS = 8;

EncounterGenerator.prototype._pokemonRepartitionList = [];
EncounterGenerator.prototype._encounterPossibilities = [];

/**
 * @type {float} Approximate probability of encountering a Pokémon at each post,
 *       between 0 and 1.
 */
EncounterGenerator.prototype._wantedEncounterRate = 1;

/**
 * Sets the Pokémon repartition list.
 *
 * @param {Array} pokemonRepartitionList Encounterable Pokémon list :
 * [
 *     { id: 'Mew', frequencyFactor: 1 }, // factor 1, the rarest
 *     { id: 'Pikachu', frequencyFactor: 4 }, // 4 times more common than Mew
 *     { id: 'Rattata', frequencyFactor: 10 }, // 10 times  more common than Mew
 * ]
 * Frequency factors must be positive integers.
 *
 * @throws {Error} If the given list is not well-formed.
 */
EncounterGenerator.prototype.setPokemonRepartitionList = function(pokemonRepartitionList) {
    this._checkRepartitionList(pokemonRepartitionList);
    this._pokemonRepartitionList = pokemonRepartitionList;
};

/**
 * Checks that the Pokémon repartition list is well-formed.
 *
 * @param {object} pokemonRepartitionList To check repartition
 * @throws {Error} If the given list is not well-formed.
 */
EncounterGenerator.prototype._checkRepartitionList = function(pokemonRepartitionList) {
    if (pokemonRepartitionList.constructor !== Array) {
        throw new Error('Repartition list must be an array.');
    }
    pokemonRepartitionList.forEach(function(pokemon) {

        // x % 1 !== 0 is true if x is not an integer.
        if (typeof pokemon.frequencyFactor !== 'number' ||
            pokemon.frequencyFactor % 1 !== 0 ||
            pokemon.frequencyFactor < 1
        ) {
            throw new Error('Frequency factors must be positive integers.');
        }

        if (typeof pokemon.id === 'undefined') {
            throw new Error('Pokemon ID must be defined.');
        }
    });
};

/**
 * Sets the global encounter rate. The given rate is constrained on [0, 1].
 * It represents the probability of encountering a Pokémon (of any kind) at each
 * post.
 * This rate is approximate. To get the actual rate, #getActualEncounterRate()
 * can be called.
 *
 * @param {int} wantedEncounterRate Wanted global encounter rate.
 */
EncounterGenerator.prototype.setWantedEncounterRate = function(wantedEncounterRate) {
    this._wantedEncounterRate = Math.max(Math.min(wantedEncounterRate, 1), 0);
};

/**
 * @return {float} Wanted global encounter rate.
 */
EncounterGenerator.prototype.getWantedEncounterRate = function() {
    return this._wantedEncounterRate;
};

/**
 * @return {float} Actual global encounter rate.
 */
EncounterGenerator.prototype.getActualEncounterRate = function() {
    return this._getPokemonCount() / this._encounterPossibilities.length;
};

/**
 * Updates the generator data with the current attributes.
 * This method must be called after changing an attribute for it to take effect.
 */
EncounterGenerator.prototype.update = function() {
    this._generateEncounterPossibilities();
};

/**
 * Generates the list of potential Pokémon encounters.
 */
EncounterGenerator.prototype._generateEncounterPossibilities = function() {
    this._encounterPossibilities = [];

    if (this._wantedEncounterRate === 0) {
        return;
    }

    this._pokemonRepartitionList.forEach(function(pokemon) {
        for (var i = 0; i < pokemon.frequencyFactor; i++) {
            this._encounterPossibilities.push(pokemon.id);
        }
    }.bind(this));

    // Adds null elements to the encounter list to reduce the encounter rate
    // down to `wantedEncounterRate`.
    var nullPossibilitiesToAdd = this._encounterPossibilities.length /
        this._wantedEncounterRate - this._encounterPossibilities.length;

    for (var i = 0; i < nullPossibilitiesToAdd; i++) {
        this._encounterPossibilities.push(null);
    }

    // Shuffles the encounter list to avoid obvious encounter cycles.
    this._encounterPossibilities = shuffle(this._encounterPossibilities);
};

/**
 * Returns the encountered Pokémon ID for a particular post ID.
 *
 * @param {int} postId
 * @return {string} Encountered Pokémon ID or null if there is no encounter for
 *         this post ID.
 */
EncounterGenerator.prototype.getEncounterForPost = function(postId) {

    // Divides the post ID by MIN_GAP_BETWEEN_POST_IDS to solve problems related
    // to the fact that the minimum gap between two post ID on a single topic
    // is not 1 on jeuxvideo.com forums.
    var dividedId = Math.floor(postId / this.constructor.MIN_GAP_BETWEEN_POST_IDS);
    var encounterIndex = dividedId % this._encounterPossibilities.length;
    return this._encounterPossibilities[encounterIndex];
};

/**
 * Returns the encounter rate of a Pokémon.
 *
 * @param {string} pokemonId Pokémon ID
 * @return {float} Probability of encountering the Pokémon at each post,
 *         between 0 and 1.
 */
EncounterGenerator.prototype.getPokemonEncounterRate = function(pokemonId) {
    var pokemonRatio = this.getPokemonRatio(pokemonId);
    return pokemonRatio * this.getActualEncounterRate();
};

/**
 * @return {int} Minimum number of consecutive posts to ensure that all the
 *         Pokémon have been encountered at least one time.
 */
EncounterGenerator.prototype.getCycleLength = function() {
    return this._encounterPossibilities.length * this.constructor.MIN_GAP_BETWEEN_POST_IDS;
};

/**
 * @param {string} pokemonId
 * @return {number} Ratio of the Pokémon compared to the total mass of all the
 *         Pokémon.
 */
EncounterGenerator.prototype.getPokemonRatio = function(pokemonId) {
    var pokemonCount = this._getPokemonCount();

    if (pokemonCount > 0) {
        var numberOfOccurences = this._getNumberOfOccurences(pokemonId);
        return numberOfOccurences / pokemonCount;
    }
    return 0;
};

/**
 * @return {int} Returns the total Pokémon count in the encounter possibility list.
 */
EncounterGenerator.prototype._getPokemonCount = function() {
    var nonNullPossibilities = this._encounterPossibilities.filter(function(el) { return el !== null; });
    return nonNullPossibilities.length;
};

/**
 * @param {string} pokemonId
 * @return {int} Number of occurences of the Pokémon in the encounter possibility list.
 */
EncounterGenerator.prototype._getNumberOfOccurences = function(pokemonId) {
    var countOccurences = function(occurences, currentId) {
        if (currentId === pokemonId) {
            return occurences + 1;
        }
        return occurences;
    };

    return this._encounterPossibilities.reduce(countOccurences, 0);
};

module.exports = EncounterGenerator;
