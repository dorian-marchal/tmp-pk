var pokemonList = require('./config/pokemon-data.json').pokemonList;

/**
 * Represents a Pokémon creature.
 * @param {string} id
 * @param {int} no Pokédex number no
 * @param {string} name
 * @param {int} frequencyFactor
 * @param {float} captureRate
 * @constructor
 */
var Pokemon = function(id, no, name, frequencyFactor, captureRate) {
    this.id = id;
    this.no = no;
    this.name = name;
    this.frequencyFactor = frequencyFactor;
    this.captureRate = captureRate;
};

/**
 * @param {string} pokemonId
 * @return {Pokemon} found Pokémon
 * @throws {Error} if the Pokémon is not found
 */
Pokemon.findById = function(pokemonId) {
    for (var i = 0; i < pokemonList.length; i++) {
        var pokemon = pokemonList[i];
        if (pokemon.id === pokemonId) {
            return new Pokemon(pokemon.id, pokemon.no, pokemon.name,
                    pokemon.frequencyFactor, pokemon.captureRate);
        }
    }

    throw new Error('No Pokémon found for id: ' + pokemonId);
};

Pokemon.prototype = {
    constructor: Pokemon,

    /** @type {string} */
    id: null,

    /** @type {int} Pokédex number */
    no: null,

    /** @type {string} */
    name: null,

    /** @type {int} */
    frequencyFactor: null,

    /** @type {float} */
    captureRate: null,
};

module.exports = Pokemon;
