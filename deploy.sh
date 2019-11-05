#!/usr/bin/env sh

set -e

npm run content:build
cp {CNAME,favicon.ico,avatar.jpeg} docs/
git add .
git commit -m 'computed的文章纠错'
git push 