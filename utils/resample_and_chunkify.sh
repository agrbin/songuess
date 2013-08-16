#!/bin/bash

file=$1
set -e

basename=$(basename "$file" mp3)
chunks_folder=$(dirname $0)/../chunks
stripped_file=$chunks_folder/${basename}stripped.mp3
out_file=$chunks_folder/${basename}resampled.mp3

mkdir -p "$chunks_folder" 2> /dev/null
rm -f "$chunks_folder/*.mp3" 2> /dev/null

# strip out id3
mpgcat "$file" 2> /dev/null 1> "$stripped_file"

# encode to what chrome likes
lame --quiet -t --resample 48 --nores --cbr -b 96 \
  "$stripped_file" "$out_file"

# it looks like linux and osx have different format_flag
# option in stat program?
if [ $(uname) = Linux ]; then
  format_flag=c
else
  format_flag=i
fi

inode=$(stat -$format_flag %i "$file")

cd "$chunks_folder"
mkdir -p $inode 2> /dev/null
../utils/create_chunks "$out_file" $inode

rm -f "$stripped_file" "$out_file"
