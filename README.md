# discord-onlybans

This is a Discord application that combats spam-bot posting in the simplest way possible, post in a channel - get banned. This is effective because the spam bot accounts post their ads in all channels that are available to them.

## Configuration

- `/only-bans`: Manage your (channel) ban list settings
- `/settings`: Manage global settings, like requiring multiple channels to be banned and confirmation settings

## 🛠️ Installation

Please note, a [Discord Application](https://wiki.mirasaki.dev/docs/discord-create-application#go-to-discord-developer-portal) is required for both installation methods.

**Also note,** the **Message Content** and **Guild Members** intents are required! (under the `Bot` section)

### 📦 Run as a Docker container (preferred)

The quickest, and easiest, way to host/use this bot is by deploying it inside of a [Docker](https://www.docker.com/) container. We recommend [Docker Desktop](https://www.docker.com/products/docker-desktop/).

1. Download the [latest release](<https://github.com/mirasaki/discord-onlybans/releases`>) or `git clone git@github.com:mirasaki/discord-onlybans.git` the repo
2. Rename `/config.example.json` to `config.json` and provide your configuration
3. Start the application: `docker compose up`

### 🖥️ Run as a plain NodeJS app

- Install the additional pre-requisites:
  - [Node.js](https://nodejs.org/en/) v16.6.0 or newer
- Download the [latest release](<https://github.com/mirasaki/discord-onlybans/releases`>) or `git clone git@github.com:mirasaki/discord-onlybans.git` the repo
- Run `npm install --omit=dev` in the project root folder
- Rename `/config.example.json` to `config.json` and provide your configuration
- Start the application: `npm run start`
