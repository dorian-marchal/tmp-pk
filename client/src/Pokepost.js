var EncounterGenerator = require('./EncounterGenerator');
var PageUtil = require('./util/PageUtil');
var Pokemon = require('./Pokemon');
var PokepostConfig = require('./config/pokemon-data.json');

/** @constructor */
var Pokepost = function() {};

Pokepost.prototype = {
    constructor: Pokepost,

    /** @type {EncounterGenerator} */
    encounterGenerator: null,

    /** @type {object} { post:Post, pokemon:Pokemon }  */
    encounter: null,

    init: function() {
        console.log('Pokepost init...');

        this.encounterGenerator = new EncounterGenerator(
            PokepostConfig.pokemonList,
            PokepostConfig.globalEncounterRate
        );

        this._loadEncounter();

        if (this.encounter !== null) {
            this._addEncounterIndicator();
        }
    },

    /**
     * Generates the encounter if it exists on the page.
     */
    _loadEncounter: function() {
        var newPost = PageUtil.getNewlySentPost(PokepostConfig.postMaxAgeMs);

        if (newPost === null) {
            return;
        }

        var pokemonId = this.encounterGenerator.getEncounterForPost(newPost.id);

        if (pokemonId === null) {
            return;
        }

        this.encounter = {
            post: newPost,
            pokemon: Pokemon.findById(pokemonId),
        };

        console.log('Encounter:', this.encounter);
    },
};

module.exports = Pokepost;
