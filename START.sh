#!/bin/bash

# Install deps if missing
if ! which node > /dev/null; then
    # Installing from https://github.com/nodesource/distributions/blob/master/README.md#installation-instructions
    curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# If running for the first time, delete node_packages, shrink-wrap.yml and package-lock.json
read -n 1 -t 3 -p "Do you want to fetch new changes (OVERRIDES local changes!) " sync
if [ "$sync" == "y" ]; then
  echo
  echo "Checking for remote changes..."
  OLD_PACK=`cat package.json`
  # Delete local changes
  git reset --hard HEAD
  git pull

  # Only install new packages if package.json was changed
  NEW_PACK=`cat package.json`
  if [ "$OLD_PACK" != "$NEW_PACK" ]
  then
    echo "Updating packages..."
    npm install
  fi
fi

# Install npm packages
if [ -f "$FILE" ]; then
    echo "Updating packages..."
    npm install
fi

# Create backup of accounts.json file
cp scores.json dist/scores-backup.json

echo "Pitch Reader" | figlet
echo "$(cat README.md)"

xdg-open "localhost:3000"
npm start