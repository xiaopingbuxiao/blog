#!/usr/bin/env sh

set -e

npm run content:build
cp {CNAME,favicon.ico,avatar.jpeg} docs/
git add .
git commit -m '前后端都用得上的cors设置'
git push 