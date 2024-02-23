# Change Log

All notable changes to the "`CSO`" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Release]

**v1.2.1**

- Trim git result
- Fix github query URL

**v1.2.0**

- Add logger
- Implement closest line finder algo
- Open selected line in chromium code search, google git, and github

**v1.0.21**

- Link [CSO](https://marketplace.visualstudio.com/items?itemName=FangzhenSong.chromium-source-opener)(chromium-source-opener) with related
[Chrome Extension](https://chrome.google.com/webstore/detail/chromium-open-ide/oodolphplfmnljcohclgdikkoljjambi) and
[MSEdge Extension](https://microsoftedge.microsoft.com/addons/detail/chromium-open-ide/ggfoollpnfolfaejalpiihpobcpbegkl).

**v1.0**

- Link [CSO](https://marketplace.visualstudio.com/items?itemName=FangzhenSong.chromium-source-opener)(chromium-source-opener) with [COI](https://microsoftedge.microsoft.com/addons/detail/chromium-open-ide/ggfoollpnfolfaejalpiihpobcpbegkl)(chromium-open-ide).

**Initial release**

- What it does now?

    *It connects local `VSCode` dir to remote  [source.chromium.org](https://source.chromium.org).*
- What's the next step?

    *Will integrate [`omed.py`](https://source.chromium.org/chromium/chromium/src/+/main:tools/chrome_extensions/open_my_editor/omed.py) into this extension so that we can choose from  [source.chromium.org](https://source.chromium.org) and open in local `VSCode` dir through just one click.*
- Status:

    - *`VSCode` -> [source.chromium.org](https://source.chromium.org) (DONE)*

    - *[source.chromium.org](https://source.chromium.org)  -> `VSCode` (In plan)*
