#!/bin/bash

npm install
mkdir discussion-hero
cd discussion-hero
git clone git@bitbucket.org:jcollinsnw/presto2.git .
git fetch git@bitbucket.org:northwesternitartsdg/discussion-hero.git
git subtree add --prefix=scripts/frontend/src/apps/discussionHero git@bitbucket.org:northwesternitartsdg/discussion-hero.git master

npm install
cd scripts/frontend/
npm install
