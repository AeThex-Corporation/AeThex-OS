#!/bin/bash
# Dev Launcher - runs dev tools in isolated container

FILE="$1"
EXT="${FILE##*.}"

case "$EXT" in
  py)
    docker run -it --rm -v "$(pwd):/workspace" python:3.11 python "/workspace/$FILE"
    ;;
  js)
    docker run -it --rm -v "$(pwd):/workspace" node:20 node "/workspace/$FILE"
    ;;
  rs)
    docker run -it --rm -v "$(pwd):/workspace" rust:latest cargo run --manifest-path "/workspace/$FILE"
    ;;
  *)
    echo "Unknown dev file type: $EXT"
    exit 1
    ;;
esac
