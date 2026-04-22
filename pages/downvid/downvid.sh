#!/bin/bash
# $1 = video URL, $2 = output path
yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4" "$1" -o "$2" --force-overwrites
