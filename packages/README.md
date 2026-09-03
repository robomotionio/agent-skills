# packages

Built copies of the two private packages every Robomotion App depends on:
`@robomotion/app-kit` (the widget kit and its Vite plugin) and
`@robomotion/apps-runtime` (the client and React hooks). They are not on npm.

Robots receive this directory with the rest of the skills bundle, and the
robot's `api-mcp` copies the packages beside each app checkout and installs
the app's dependencies on `create_app` and `sync_app`. Nothing here is
hand-written: regenerate it with `scripts/apps/sync-kit-to-skills.sh` in the
monorepo whenever either package changes, and commit the result.
