#!/usr/bin/env sh

set -e

npm run content:build
cp {CNAME,favicon.ico,avatar.jpeg} docs/
# git add -A
# git commit -m '初始化'
# git push 