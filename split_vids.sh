set -euo pipefail

INPUT_DIR="./game-vids"
OUTPUT_DIR="$INPUT_DIR/segments"
SEG=600   # segment length in seconds (600s = 10m)

mkdir -p "$OUTPUT_DIR"

for src in "$INPUT_DIR"/*.mp4; do
  name="$(basename "$src" .mp4)"
  echo "Splitting $name.mp4 into $((SEG/60))-minute pieces…"

  ffmpeg -hide_banner -loglevel error \
    -i "$src" \
    -an \
    -c:v copy \
    -f segment \
    -segment_time "$SEG" \
    -reset_timestamps 1 \
    "$OUTPUT_DIR/${name}-%03d.mp4"
  
  echo "  → done: see $OUTPUT_DIR/${name}-*.mp4"
done

echo "All videos split and saved under $OUTPUT_DIR."
