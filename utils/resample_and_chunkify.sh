#!/bin/bash

file=$1

basename=$(basename $file)
chunks_folder=$(dirname $0)/../chunks
stripped_file=$chunks_folder/${basename}_stripped.mp3
out_file=$chunks_folder/${basename}_resampled.mp3

mkdir $chunks_folder 2> /dev/null

set -e

# strip out id3
mpgcat $file 2> /dev/null 1> $stripped_file

# encode to what chrome likes
lame --quiet -t --resample 48 --nores --cbr -b 96 \
  $stripped_file $out_file

inode=$(stat -f %i $file)
cd $chunks_folder
../utils/create_chunks $out_file $inode

rm -f $stripped_file $out_file

