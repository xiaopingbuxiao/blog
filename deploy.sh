#!/usr/bin/env sh

set -e

npm run content:build
cp {CNAME,favicon.ico,avatar.jpeg} docs/
git add .
git commit -m 'fix: promise'
git push 