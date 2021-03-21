[![Build](https://github.com/yannismate/RocketLink/actions/workflows/electron-packager.yml/badge.svg)](https://github.com/yannismate/RocketLink/actions/workflows/electron-packager.yml)  

# RocketLink
RocketLink offers a P2P voice proximity chat with spatial audio for Rocket League on PC.  
It uses a BakkesMod plugin to get the necessary game data and WebRTC for voice data.  
Server repository: [Repo](https://github.com/yannismate/rocketlink-server)  
BakkesMod plugin repository: [Repo](https://github.com/yannismate/rocketlink-plugin)

## Installation
1. Install [BakkesMod](https://bakkesmod.com/) and [Rocket Plugin](https://bakkesplugins.com/plugins/view/26).
3. Install the [RocketLink plugin](https://bakkesplugins.com/plugins/view/204) through BakkesMod (approval awaiting)
4. Download the newest [release](https://github.com/yannismate/RocketLink/releases) of this repository and extract it.
5. Open RocketLink.exe

## Usage
You will need a RocketLink server which can be reached by the other players. The server files can be found [here](https://github.com/yannismate/rocketlink-server).  
1. Join a local game lobby with the other players through Rocket Plugin. Further instructions for this step can be found on the Rocket Plugin page.
2. Select the correct input and output device on RocketLink.
3. Connect to a voice server and Host/ Join the same lobby as the other players. (The host does not have to be the host of the Rocket League game lobby)
4. Join a team and start the game. Range settings can be adjusted by the host.

## Build
Prerequisites: Node.js 14+, npm
1. Clone this repository `git clone https://github.com/yannismate/RocketLink.git`
2. Install the needed dependencies `npm i`
3. Package the application `npm run package`

## Contributing
Contributions to this, the rocketlink-server and the rocketlink-plugin are very welcome!
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Credits
Thank you to:  
- Athena - for the idea for this project
- Makmans98, JonBee and ChromeHypz - for investing time into testing this before release
- Bakkes, CinderBlock and SimpleAOB - for making the [Simple Overlay System](https://gitlab.com/bakkesplugins/sos/sos-plugin) for Rocket League which the plugin code is based on
- Ottomated - for making [CrewLink](https://github.com/ottomated/CrewLink) where I got the idea of using P2P WebRTC from

## License
GNU General Public License v3.0. See [LICENSE](https://github.com/yannismate/RocketLink/blob/master/LICENSE) for more information.

## Donations
[PayPal](https://paypal.me/yannismate)  
Donations are by no means necessary, but if you enjoyed using this feel free to buy me a small snack :). I made this just for fun and out of own interest in Rocket League and programming.
