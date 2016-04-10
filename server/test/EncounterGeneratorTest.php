<?php

class EncounterGeneratorTest extends PHPUnit_Framework_TestCase {

    const NEAR_IMPOSSIBLE_FACTOR = 1;
    const LEGENDARY_FACTOR = 2;
    const RARE_FACTOR = 4;
    const MEDIUM_FACTOR = 6;
    const COMMON_FACTOR = 8;

    private $pokemonRepartition = [];

    /** @var \EncounterGenerator */
    private $generator = null;

    public function __construct() {
        $this->pokemonRepartition = json_decode('[
            { "id": "Rattata", "frequencyFactor": 8 },
            { "id": "Roucool", "frequencyFactor": 8 },
            { "id": "Chenipan", "frequencyFactor": 8 },
            { "id": "Piafabec", "frequencyFactor": 6 },
            { "id": "Pikachu", "frequencyFactor": 6 },
            { "id": "Tauros", "frequencyFactor": 4 },
            { "id": "Artikodin", "frequencyFactor": 2 },
            { "id": "Sulfura", "frequencyFactor": 2 },
            { "id": "Electhor", "frequencyFactor": 2 },
            { "id": "Mew", "frequencyFactor": 1 }
        ]');
        $this->generator = new EncounterGenerator($this->pokemonRepartition, 0.15);
    }

    public function testSetPokemonRepartitionListNotArray() {
        $this->setExpectedException('InvalidArgumentException');
        $this->generator->setPokemonRepartitionList('test');
    }

    public function testSetPokemonRepartitionListBadFactors() {
        $this->setExpectedException('InvalidArgumentException');
        $this->generator->setPokemonRepartitionList(json_decode('[
            { "frequencyFactor" : 0.5, "id": "test" }
        ]'));
    }

    public function testSetPokemonRepartitionListMissingIds() {
        $this->setExpectedException('InvalidArgumentException');
        $this->generator->setPokemonRepartitionList(json_decode('[
            { "frequencyFactor" : 1 }
        ]'));
    }

    public function testSetWantedEncounterRate() {
        // Check the upper limit (1).
        $this->generator->setWantedEncounterRate(2);
        $this->assertEquals(1, $this->generator->getWantedEncounterRate());

        // Check the lower limit (0).
        $this->generator->setWantedEncounterRate(-1);
        $this->assertEquals(0, $this->generator->getWantedEncounterRate());

        // Check that a rate within the bounds is preserved.
        $this->generator->setWantedEncounterRate(0);
        $this->assertEquals(0, $this->generator->getWantedEncounterRate());

        $this->generator->setWantedEncounterRate(0.5);
        $this->assertEquals(0.5, $this->generator->getWantedEncounterRate());

        $this->generator->setWantedEncounterRate(1);
        $this->assertEquals(1, $this->generator->getWantedEncounterRate());
    }

    public function testGetPokemonRatio() {

        // Counts the total number of Pokémon.
        $pokemonCount = 0;
        foreach ($this->pokemonRepartition as $pokemon) {
            $pokemonCount += $pokemon->frequencyFactor;
        }

        // Verifies the ratio for each Pokémon.
        foreach ($this->pokemonRepartition as $pokemon) {

            // If the encounter rate is null, the ratio is null, too.
            if ($this->generator->getWantedEncounterRate() === 0) {
                $expectedRatio = 0;
            } else {
                $expectedRatio = $pokemon->frequencyFactor / $pokemonCount;
            }
            $this->assertEquals($expectedRatio, $this->generator->getPokemonRatio($pokemon->id));
        }
    }

    public function testGetPokemonEncounterRate() {

        // Counts the total number of Pokémon.
        $pokemonCount = 0;
        foreach ($this->pokemonRepartition as $pokemon) {
            $pokemonCount += $pokemon->frequencyFactor;
        }

        // Verifies the encounter rate for each Pokémon.
        foreach ($this->pokemonRepartition as $pokemon) {
            $ratio = $pokemon->frequencyFactor / $pokemonCount;
            $expectedRate = $ratio * $this->generator->getActualEncounterRate();
            $this->assertEquals($expectedRate, $this->generator->getPokemonEncounterRate($pokemon->id));
        }
    }

    /**
     * Verifies the encounter rate for each Pokémon.
     */
    public function testEncounterProportion() {
        $DELTA = 0.0000001;
        $encounters = $this->simulateEncounters();
        foreach ($this->pokemonRepartition as $pokemon) {
            $expectedRate = $this->generator->getPokemonEncounterRate($pokemon->id);
            $this->assertEquals(
                $expectedRate,
                $encounters[$pokemon->id]['encounterRate'],
                '',
                $DELTA
            );
        }
    }

    /**
     * Simulates a large number of encounters and returns the result.
     * @return array Generated encounters.
     */
    private function simulateEncounters() {
        $NUMBER_OF_POST_TO_TEST = $this->generator->getCycleLength() * 2;

        // Tries $NUMBER_OF_POST_TO_TEST encounters and store the results.
        $encounters = [];
        $encounterCount = 0;

        for ($postId = 0; $postId < $NUMBER_OF_POST_TO_TEST; $postId++) {
            $pokemonId = $this->generator->getEncounterForPost($postId);

            $encounterCount++;

            if (is_null($pokemonId)) {
                continue;
            }

            if (!isset($encounters[$pokemonId])) {
                $encounters[$pokemonId] = [
                    'count' => 0,
                ];
            }
            $encounters[$pokemonId]['count']++;
        }

        // Calculates the encounter rate for each encountered Pokémon.
        foreach ($encounters as $pokemonId => &$currentEncounter) {
            $currentEncounter['encounterRate'] = $currentEncounter['count'] / $encounterCount;
        }
        unset($currentEncounter);

        return $encounters;
    }
}
