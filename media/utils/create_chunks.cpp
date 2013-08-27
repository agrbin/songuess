#include <cstdio>
#include <cstdlib>

// bitrate index is defined in mp3 structure
// http://www.multiweb.cz/twoinches/mp3inside.htm
#define BITRATE 96000
#define BITRATE_INDEX 7

#define FREQUENCY 48000
#define FREQUENCY_INDEX 1

// broj frame-ova u jednom chunk file-u
#define FRAMES_IN_CHUNK 100
#define FRAMES_OVERHEAD 2

// za frame buffer, nasi frameovi su veliki 313 ili 314 okteta.
#define MAX_FRAME_LENGTH 1000

typedef unsigned char uchar;

// this program works only if mp3 is encoded with
// lame --resample 48 --nores --cbr -b 96 inputfile.mp3 outputfile.mp3
void err(const char *what, int n) {
  fprintf(stderr, "frames: on frame %d: %s\n", n, what);
  exit(1);
}

// every header starts with 11 one bits (aligned to a whole byte?)
int seek_to_frame_start(FILE *fp, int n) {
  for (;;) {
    int byte = fgetc(fp);
    if (byte == EOF) {
      return -1;
    }
    if (byte == 0xff) {
      int next = fgetc(fp);
      if ((next >> 5) == 7) {
        ungetc(next, fp);
        ungetc(byte, fp);
        return 0;
      } else {
        ungetc(next, fp);
      }
    }
    if (n > 0) {
      err("next frame sync expected.", n);
    }
  }
}

// padded bit is bit G in the header. note endianes.
// AAAAAAAA   AAABBCCD   EEEEFFGH   IIJJKLMM
// in our endianes:
// AAAAAAAA   AAABBCCD   EEEEFFGH   IIJJKLMM
// f   f      f   b      7   0      0   4
// f   f      e   0      0   0      1   0
int is_padded(uchar *header) {
  return ((header[2] >> 1) & 1);
}

void assert_format(uchar *header, int n) {
  // bitrate
  if (!((header[2] >> 4) == BITRATE_INDEX)) {
    err("bitrate is not valid.", n);
  }
  // frequency
  if (!(((header[2] >> 2) & 3) == FREQUENCY_INDEX)) {
    err("sampling freq is not valid.", n);
  }
  if (!(header[1] & 1)) {
    err("we have crc protection and we don't want it.", n);
  }
}

// layer and mpeg versions are extracted from
// http://www.multiweb.cz/twoinches/mp3inside.htm
int samples_in_frame(uchar *header) {
  static int samples_per_frame[2][3] = {
    {   // MPEG Version 1
        384,    // Layer1
        1152,   // Layer2
        1152    // Layer3
    },
      {   // MPEG Version 2 & 2.5
        384,    // Layer1
        1152,   // Layer2
        576     // Layer3
      }
  };
  int mpeg_ver1 = (((header[1] >> 3) & 3) == 3);
  int layer = ((header[1] >> 1) & 3);
  if (layer & 1) layer ^= 2; // that's the table lookup.
  return samples_per_frame[mpeg_ver1][layer];
}

// load frame into char* and return frame size.
int load_frame(FILE *fp, int n, char *frame) {
  uchar header[4];
  if (seek_to_frame_start(fp, n) == -1) {
    return -1;
  }

  // read and unread header info.
  fread(header, 4, 1, fp);
  fseek(fp, ftell(fp) - 4, SEEK_SET);

  // make sure that sampling freq and bitrates are OK.
  assert_format(header, n);

  // calculate frame length.
  int paddingbit = is_padded(header);
  int framelength = (144 * BITRATE / FREQUENCY) + paddingbit;

  if (fread(frame, framelength, 1, fp) != 1) {
    err("couldn't read whole frame (fread).", n);
  }

  return framelength;
}

int last_opened = -1;

// lots of open operations, but it isn't botleneck
void write_to(int chunk_num, int bytes, char *buffer, int n, long long chunk_folder) {
  static char filename[1<<16];
  FILE *out;
  snprintf(filename, sizeof filename, "%lld/%d.mp3", chunk_folder, chunk_num);

  if (chunk_num > last_opened) {
    out = fopen(filename, "w");
    last_opened = chunk_num;
  } else {
    out = fopen(filename, "a");
  }

  if (fwrite(buffer, bytes, 1, out) != 1) {
    err("error while writing chunk.", n);
  }
  fclose(out);
}

int chunkify(FILE *fp, long long chunk_folder) {
  static char buffer[MAX_FRAME_LENGTH];
  int framelength, n;

  for (n = 0; ; ++n) {
    if ((framelength = load_frame(fp, n, buffer)) == -1) {
      break;
    }
    write_to(n / FRAMES_IN_CHUNK, framelength, buffer, n, chunk_folder);
    // write overhead
    if (n >= FRAMES_IN_CHUNK && n % FRAMES_IN_CHUNK < FRAMES_OVERHEAD) {
      write_to(n / FRAMES_IN_CHUNK - 1, framelength, buffer, n, chunk_folder);
    }
  }

  return n / FRAMES_IN_CHUNK + 1;
}

int main(int argc, char **argv) {
  long long chunk_folder;
  sscanf(argv[2], "%lld", &chunk_folder);

  FILE *in = fopen(argv[1], "r");
  printf("%d\n", chunkify(in, chunk_folder));
  fclose(in);
  return 0;
}

