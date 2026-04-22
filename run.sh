#!/bin/sh
DATABASE_URL=postgres://hq:hq@localhost/hq deno run --allow-net --allow-read --allow-env --allow-run hq.js "$@"
