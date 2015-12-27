var ac = require('./answer_checker');
ac = new ac();

// TODO: all commented tests should pass!
var validPairs = [
  ['djakovo', 'đakovo'],
  ['nesto (nema) [nema ni ovog]', 'nesto'],
  ['ručak', 'rucak'],
  ['žiroskop', 'ziroskop'],
  ['ćup', 'cup'],
  ['šalica', 'salica'],
  ['šaš', 'sas'],
  ['šas', 'saš'],
  ['šalica kafe vozi džip u đakovu', 'salica kafe vozi dzip u djakovu'],
  ['aanton', 'aantoj'],
  ['antonantonantonanaaaaaaaaaatonanton', 'antonantonantonanaaaaaaaaaatonanton33'],
  ['un ane plane', 'Un Âne Plane'],
  ['madam reve', 'Madame Rêve'],
  ['cest ecrit', 'C\'est Écrit'],
  ['sdjccz','šđčćž'],
  ['aaaaa','áàâäã'],
  ['eeee','éèêë'],
  ['iii','íîï'],
  ['ooo','óôö'],
  ['uuuu','úùûü'],
  ['cnaeoe','çñæœ'],
  ['triptico', 'Tríptico'],
  ['para machucar meu coracao', 'Para Machucar Meu Coração'],
  ['up', 'Up!'],
  ['7', '7'],
  ['petite soeur', 'Petite Sœur'],
  ['ex aequo', 'Ex Æquo'],
  ['le chene liege', 'le chêne liège'],
  ['this is my answer #playon', 'this is my answer'],
  ['this is #playon my answer', 'this is my answer'],
  // ['2+2=5', '2 + 2 = 5'],
  // ['i cant get no satisfaction','(I Can\'t Get No) Satisfaction'],
  // ['nice dream', '(Nice dream)'],
];

var invalidPairs = [
  ['7', '5'],
  ['2+2=5', ''],
  // ['[]', '(...)'],
  // ['(Nice dream)', '()'],
  // ['Neighborhood #1 (Tunnels)', 'Neighborhood #4 (7 Kettles)'],
];

var validPairsFullItems = [
  [{title: 'nevalja', title2: 'valja'}, 'valja'],
  [{title: 'nevalja', title2: 'stvarnonevalja', title3: 'valja'}, 'valja'],
];

var invalidPairsFullItems = [
  [{artist: 'nevalja', titlA: 'valja'}, 'valja'],
];

var counter = 0;
function check(item, answer, shouldPass) {
  var passed = ac.checkAnswer(item, answer);
  if (passed != shouldPass) {
    console.log("Test failed. Expected: ",
        shouldPass ? "CORRECT" : "NOT CORRECT", " for: ");
    console.log(item, answer);
    ++counter;
    console.log('');
  }
}

console.log('');
for (i = 0; i < validPairs.length; ++i) {
  check({ title: validPairs[i][0] }, validPairs[i][1], true);
}

for (i = 0; i < invalidPairs.length; ++i) {
  check({ title: invalidPairs[i][0] }, invalidPairs[i][1], false);
}

for (i = 0; i < validPairsFullItems.length; ++i) {
  check(validPairsFullItems[i][0], validPairsFullItems[i][1], true);
}

for (i = 0; i < invalidPairsFullItems.length; ++i) {
  check(invalidPairsFullItems[i][0], invalidPairsFullItems[i][1], false);
}

if (counter){
  console.log('Failed ' + counter + ' tests.  :(');
} else {
  console.log(
    'Passed all ' + (validPairs.length + invalidPairs.length) + ' tests \\o/'
  );
}
console.log('');

