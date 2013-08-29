var ac = require('./answer_checker');
ac = new ac();

var checkPairs = [
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
  ['antonantonantonanaaaaaaaaaatonanton', 'antonantonantonanaaaaaaaaaatonanton33']
];

for (var i = 0; i < checkPairs.length; ++i) {
  console.log(checkPairs[i][0]);
  console.log(checkPairs[i][1]);
  var passed = ac.checkAnswer({ title: checkPairs[i][0] }, checkPairs[i][1]);
  console.log(passed? 'OK!': 'FAIL.');
  console.log('');
}

