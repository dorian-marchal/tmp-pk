<?php
/**
 * @author NPlay
 */

$arr = [
    'Bulbizarre',
    'Bulbizarre',
    'Bulbizarre',
    'Salamèche',
    'Salamèche',
    'Salamèche',
    'Carapuce',
    'Carapuce',
    'Carapuce',
    'Pikachu',
    'Pikachu',
    'Pikachu',
    'Mewtwo',
    'Artikodin',
    'Sulfura',
    'Electhor',
];

for ($i = 0, $n = count($arr); $i < $n; ++$i) {
    $arr[] = 'Que dalle. è_é';
    $arr[] = 'Que dalle. è_é';
    $arr[] = 'Que dalle. è_é';

    // Pour chaque élément, on rajoute trois éléments vides, du coup 25% de chances d'avoir un poké
}

shuffle($arr); // Parce que flemme de faire des maths, le random c'est cool aussi :hap:
ksort($arr); // Juste pour rendre le tableau plus lisible (de 0 à 63 ici)

var_dump($arr);


function get_pokemon($arr, $id_message) {

    $bits = $id_message >> 3; // On élimine les 3 derniers bits du message.
    $bits = $bits & (1 << log(count($arr), 2)) - 1;


    return $arr[$bits];
}

if (!is_power_of_two(count($arr))) {
    exit("Le tableau n'a pas une puissance de deux éléments !");
}

var_dump(get_pokemon($arr, 123456));
var_dump(get_pokemon($arr, 123464));
var_dump(get_pokemon($arr, 123472));
var_dump(get_pokemon($arr, 123480));
var_dump(get_pokemon($arr, 123488));



function is_power_of_two($n) {
    return !($n & ($n - 1));
}
