<?php

/**
 * Permet de générer des rencontres de pokémons à partir d'ID de posts sur les
 * forums de jeuxvideo.com.
 */
class EncounterGenerator {

    private $pokemonRepartitionList = [];
    private $encounterPossibilities = [];
    /**
     * @var float Probabilité de rencontrer n'importe quel pokémon à chaque
     *      post (entre 0 et 1). Ce taux est approximatif. Les calculs peuvent
     *      faire varier légérement le taux réel.
     */
    private $expectedEncounterRate = 1;

    /**
     * Met à jour les données du générateur en fonction des attributs courants.
     * Cette méthode doit être appelée après la modification d'un attribut
     * pour que celui-ci soit pris en compte.
     */
    public function update() {
        $this->generateEncounterPossibilities();
        $this->pokemonShuffle();
    }

    /**
     * Vérifie que la répartition passée en paramètre est bien formée.
     * @throws \Exception
     */
    private function checkRepartitionList($pokemonRepartitionList) {
        if (!is_array($pokemonRepartitionList)) {
            throw new \Exception('Repartition list must be an array.');
        }

        foreach (array_keys($pokemonRepartitionList) as $frequencyFactor) {
            if (!is_int($frequencyFactor)) {
                throw new \Exception('Frequency factors must be positive integers.');
            }
        }
    }

    /**
     * Génère la liste des rencontres potentielles.
     */
    private function generateEncounterPossibilities() {
        $this->encounterPossibilities = [];

        if ($this->expectedEncounterRate === 0) {
            return;
        }

        foreach ($this->pokemonRepartitionList as $frequencyFactor => $pokemonIds) {
            foreach ($pokemonIds as $pokemonId) {
                for ($i = 0; $i < $frequencyFactor; $i++) {
                    $this->encounterPossibilities[] = $pokemonId;
                }
            }
        }

        // Ajoute des éléments null à la liste de rencontre pour réduire le
        // taux de rencontre à $expectedEncounterRate.
        $this->encounterPossibilities = array_pad($this->encounterPossibilities,
            (int) (count($this->encounterPossibilities) / $this->expectedEncounterRate), null);

        $this->padEncounterPossibilitiesToPowerOfTwoElements();
    }

    /**
     * Mélange le tableau de rencontres potentielles.
     */
    private function pokemonShuffle() {
        shuffle($this->encounterPossibilities);
    }

    /**
     * Ajoute des éléments nulls à la liste des rencontres potentielles jusqu'à
     * ce qu'elle fasse une taille de 2^x éléments.
     */
    private function padEncounterPossibilitiesToPowerOfTwoElements() {
        $closestPowerOfTwo = self::closestPowerOfTwo(count($this->encounterPossibilities));
        $this->encounterPossibilities = array_pad(
            $this->encounterPossibilities, $closestPowerOfTwo, null
        );
    }

    /**
     * Retourne 2^n avec n valant la plus petite valeur entière qui vérifie
     * 2^n >= $number.
     */
    private static function closestPowerOfTwo($number) {
        return pow(2, ceil(log($number, 2)));
    }

    /**
     * Retourne le pokémon rencontré pour un ID de post particulier.
     * @return string ID du pokémon rencontré ou null s'il n'y a pas de
     *         rencontre pour cet ID.
     * @throws \Exception si la taille du tableau des rencontre potentielles
     *         n'est pas une puissance de deux.
     */
    public function getEncounterForPost($postId) {
        if (!self::isPowerOfTwo(count($this->encounterPossibilities))) {
            throw new \Exception(
                'count($this->encounterPossibilities) must be a power of two.'
            );
        }

        $encounterIndex = $this->getEncounterIndexForPost($postId);

        return $this->encounterPossibilities[$encounterIndex];
    }

    private static function isPowerOfTwo($number) {
        return !($number & ($number - 1));
    }

    /**
     * @param int $postId
     * @return int
     */
    private function getEncounterIndexForPost($postId) {
        // Élimine les trois derniers bits de l'ID du post.
        // Résout les problèmes liés au fait que l'écart minimum entre deux ID
        // de message d'un même topic est de 8 sur les forums de jeuxvideo.com.
        $postBits = $postId >> 3;
        $mask = (1 << log(count($this->encounterPossibilities), 2)) - 1;
        $index = $postBits & $mask;

        return $index;
    }

    /**
     * Retourne le taux de rencontre du pokémon d'id passé en paramètre.
     *
     * @param string $pokemonId
     * @return float Probabilité de rencontrer le Pokémon d'ID passé en paramètre
     *         À chaque post, entre 0 et 1.
     */
    public function getPokemonEncounterRate($pokemonId) {
        $pokemonRatio = $this->getPokemonRatio($pokemonId);
        return $pokemonRatio * $this->getActualEncounterRate();
    }

    /**
     * Retourne la proportion du Pokémon d'ID passé en paramètre par rapport
     * à la masse totale de tous les Pokémons.
     * @param string $pokemonId
     * @return float
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
     * @return int Retourne le nombre total de pokémons dans la liste des
     * possibilités de rencontre.
     */
    private function getPokemonCount() {
        return count(array_filter($this->encounterPossibilities));
    }

    /**
     * @return int Nombre d'occurences d'un Pokémon dans la liste des rencontres
     * potentielles.
     */
    private function getNumberOfOccurences($pokemonId) {

        $incrementNumberOfOccurences = function ($occurences, $possibility) use ($pokemonId) {
            if ($possibility === $pokemonId) {
                $occurences++;
            }
            return $occurences;
        };

        return array_reduce($this->encounterPossibilities, $incrementNumberOfOccurences, 0);
    }

    /**
     * Modifie la liste de répartition des pokémons.
     *
     * @param array $pokemonRepartitionList Liste des différents id de pokémons
     * classés par coefficient de fréquence, de la forme :
     * [
     *     1 => ['Mew', 'Mewtwo'], // coefficient 1, les plus rares
     *     4 => ['Pikachu'], // 4 fois plus fréquents que ceux du dessus
     *     10 => ['Rattata', 'Roucool'], // 10 fois plus fréquents que ceux du dessus
     * ]
     * Les coefficients doivent être des entiers positifs.
     *
     * @throws \Exception si la liste passée est mal formée.
     */
    public function setPokemonRepartitionList($pokemonRepartitionList) {
        $this->checkRepartitionList($pokemonRepartitionList);
        $this->pokemonRepartitionList = $pokemonRepartitionList;
    }

    public function getExpectedEncounterRate() {
        return $this->expectedEncounterRate;
    }

    public function setExpectedEncounterRate($expectedEncounterRate) {
        $this->expectedEncounterRate = $expectedEncounterRate;
    }

    /**
     * Retourne le taux de rencontre réél, basé sur les données utilisées pour
     * les calculs. Ce taux peut être légérement différent d'$expectedEncounterRate.
     * @return float
     */
    public function getActualEncounterRate() {
        $encounterPossibilityCount = count($this->encounterPossibilities);

        if ($encounterPossibilityCount > 0) {
            return $this->getPokemonCount() / count($this->encounterPossibilities);
        }

        return 0;
    }
}
