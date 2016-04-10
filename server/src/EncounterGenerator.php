<?php

/**
 * Generates Pokémon encounters based on jeuxvideo.com forum posts.
 */
class EncounterGenerator {

    /**
     * Minimum gap between to post IDs on a jeuxvideo.com topic.
     * @var int
     */
    const MIN_GAP_BETWEEN_POST_IDS = 8;

    private $pokemonRepartitionList = [];
    private $encounterPossibilities = [];

    /**
     * @var float Approximate probability of encountering a Pokémon at each post,
     *      between 0 and 1.
     */
    private $wantedEncounterRate = 1;

    /**
     * @param array $pokemonRepartitionList See #setPokemonRepartitionList()
     * @param float $wantedEncounterRate Global wanted encounter rate.
     */
    public function __construct($pokemonRepartitionList, $wantedEncounterRate = 1) {
        $this->setPokemonRepartitionList($pokemonRepartitionList);
        $this->setWantedEncounterRate($wantedEncounterRate);
        $this->update();
    }

    /**
     * Sets the Pokémon repartition list.
     *
     * @param array $pokemonRepartitionList Encounterable Pokémon list :
     * [
     *     Object { id: 'Mew', frequencyFactor: 1 }, // factor 1, the rarest
     *     Object { id: 'Pikachu', frequencyFactor: 4 }, // 4 times more common than Mew
     *     Object { id: 'Rattata', frequencyFactor: 10 }, // 10 times  more common than Mew
     * ]
     * Frequency factors must be positive integers.
     *
     * @throws \Exception If the given list is not well-formed.
     */
    public function setPokemonRepartitionList($pokemonRepartitionList) {
        $this->checkRepartitionList($pokemonRepartitionList);
        $this->pokemonRepartitionList = $pokemonRepartitionList;
    }

    /**
     * Checks that the Pokémon repartition list is well-formed.
     * @param array $pokemonRepartitionList To check repartition
     * @throws \Exception If the given list is not well-formed.
     */
    private function checkRepartitionList($pokemonRepartitionList) {
        if (!is_array($pokemonRepartitionList)) {
            throw new \InvalidArgumentException('Repartition list must be an array.');
        }

        foreach ($pokemonRepartitionList as $pokemon) {
            if (!is_int($pokemon->frequencyFactor) || $pokemon->frequencyFactor < 1) {
                throw new \InvalidArgumentException('Frequency factors must be positive integers.');
            }

            if (empty($pokemon->id)) {
                throw new \InvalidArgumentException('Pokemon ID must be defined.');
            }
        }
    }

    /**
     * Sets the global encounter rate. The given rate is constrained on [0, 1].
     * It represents the probability of encountering a Pokémon (of any kind) at each
     * post.
     * This rate is approximate. To get the actual rate, #getActualEncounterRate()
     * can be called.
     * @param int $wantedEncounterRate Wanted global encounter rate.
     */
    public function setWantedEncounterRate($wantedEncounterRate) {
        $this->wantedEncounterRate = max(min($wantedEncounterRate, 1), 0);
    }

    /**
     * @return float Wanted global encounter rate.
     */
    public function getWantedEncounterRate() {
        return $this->wantedEncounterRate;
    }

    /**
     * @return float Actual global encounter rate.
     */
    public function getActualEncounterRate() {
        return $this->getPokemonCount() / count($this->encounterPossibilities);
    }

    /**
     * Updates the generator data with the current attributes.
     * This method must be called after changing an attribute for it to take effect.
     */
    public function update() {
        $this->generateEncounterPossibilities();
    }

    /**
     * Generates the list of potential Pokémon encounters.
     */
    private function generateEncounterPossibilities() {
        $this->encounterPossibilities = [];

        if ($this->wantedEncounterRate === 0) {
            return;
        }

        foreach ($this->pokemonRepartitionList as $pokemon) {
            for ($i = 0; $i < $pokemon->frequencyFactor; $i++) {
                $this->encounterPossibilities[] = $pokemon->id;
            }
        }

        // Adds null elements to the encounter list to reduce the encounter rate
        // down to `wantedEncounterRate`.
        $this->encounterPossibilities = array_pad($this->encounterPossibilities,
            (int) (count($this->encounterPossibilities) / $this->wantedEncounterRate), null);

        // Shuffles the encounter list to avoid obvious encounter cycles.
        shuffle($this->encounterPossibilities);
    }

    /**
     * Returns the encountered Pokémon ID for a particular post ID.
     * @param int $postId
     * @return string Encountered Pokémon ID or null if there is no encounter for
     *         this post ID.
     */
    public function getEncounterForPost($postId) {
        // Divides the post ID by MIN_GAP_BETWEEN_POST_IDS to solve problems related
        // to the fact that the minimum gap between two post ID on a single topic
        // is not 1 on jeuxvideo.com forums.
        $dividedId = floor($postId / self::MIN_GAP_BETWEEN_POST_IDS);
        $encounterIndex = $dividedId % count($this->encounterPossibilities);

        return $this->encounterPossibilities[$encounterIndex];
    }

    /**
     * Returns the encounter rate of a Pokémon.
     *
     * @param string $pokemonId Pokémon ID
     * @return float Probability of encountering the Pokémon at each post,
     *         between 0 and 1.
     */
    public function getPokemonEncounterRate($pokemonId) {
        $pokemonRatio = $this->getPokemonRatio($pokemonId);
        return $pokemonRatio * $this->getActualEncounterRate();
    }

    /**
     * @return int Minimum number of consecutive posts to ensure that all the
     *         Pokémon have been encountered at least one time.
     */
    public function getCycleLength() {
        return count($this->encounterPossibilities) * self::MIN_GAP_BETWEEN_POST_IDS;
    }

    /**
     * @param string $pokemonId
     * @return float Ratio of the Pokémon compared to the total mass of all the
     *         Pokémon.
     */
    public function getPokemonRatio($pokemonId) {
        $pokemonCount = $this->getPokemonCount();

        if ($pokemonCount > 0) {
            $numberOfOccurences = $this->getNumberOfOccurences($pokemonId);
            return $numberOfOccurences / $pokemonCount;
        }
        return 0;
    }

    /**
     * @return int Returns the total Pokémon count in the encounter possibility list.
     */
    private function getPokemonCount() {
        return count(array_filter($this->encounterPossibilities));
    }

    /**
     * @return int Number of occurences of the Pokémon in the encounter possibility list.
     */
    private function getNumberOfOccurences($pokemonId) {
        $countOccurences = function ($occurences, $currentId) use ($pokemonId) {
            if ($currentId === $pokemonId) {
                $occurences++;
            }
            return $occurences;
        };

        return array_reduce($this->encounterPossibilities, $countOccurences, 0);
    }
}
