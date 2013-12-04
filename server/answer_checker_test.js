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

console.log('');
var counter = 0, passed, i;
for (i = 0; i < validPairs.length; ++i) {
  passed = ac.checkAnswer({ title: validPairs[i][0] }, validPairs[i][1]);
  if (!passed) {
    console.log('FAILED ON: (false negative)');
    console.log(validPairs[i][0]);
    console.log(validPairs[i][1]);
    ++counter;
    console.log('');
  }
}

for (i = 0; i < invalidPairs.length; ++i) {
  passed = ac.checkAnswer({ title: invalidPairs[i][0] }, invalidPairs[i][1]);
  if (passed) {
    console.log('FAILED ON: (false positive)');
    console.log(invalidPairs[i][0]);
    console.log(invalidPairs[i][1]);
    ++counter;
    console.log('');
  }
}

if (counter){
  console.log('Failed ' + counter + ' tests.  :(');
} else {
  console.log(
    'Passed all ' + (validPairs.length + invalidPairs.length) + ' tests \\o/'
  );
}
console.log('');

