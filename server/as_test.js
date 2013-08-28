var as = require('./answer_checker');
as = new as();

var checkPairs = [
  ['djakovo', 'đakovo'],
  ['ručak', 'rucak'],
  ['žiroskop', 'ziroskop'],
  ['ćup', 'cup'],
  ['šalica', 'salica'],
  ['šaš', 'sas'],
  ['šas', 'saš'],
  ['šalica kafe vozi džip u đakovu', 'salica kafe vozi dzip u djakovu']
];

for (var i = 0; i < checkPairs.length; ++i) {
  console.log(checkPairs[i][0]);
  console.log(checkPairs[i][1]);
  var passed = as.checkAnswer({ title: checkPairs[i][0] }, checkPairs[i][1]);
  console.log(passed? 'OK!': 'FAIL.');
  console.log('');
}

