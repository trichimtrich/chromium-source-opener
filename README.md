# CSO(Chromium Source Opener)

[![.github/workflows/CI.yml](https://img.shields.io/github/workflow/status/EFanZh/Graphviz-Preview/CI/master)](https://github.com/EFanZh/Graphviz-Preview/actions?query=workflow%3A.github%2Fworkflows%2FCI.yml)
[![Bors enabled](https://img.shields.io/badge/bors-enabled-brightgreen)](https://app.bors.tech/repositories/23758)

Link your local chromium code path to remote [source.chromium.org](https://source.chromium.org).

## Installation

You can install this extension from the [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=FangzhenSong.chromium-source-opener).

*Tips: To enable the ability of linking remote 
[source.chromium.org](https://source.chromium.org) code path to your local chromium src, you should also install related 
[Chrome Extension](https://chrome.google.com/webstore/detail/chromium-open-ide/oodolphplfmnljcohclgdikkoljjambi)/
[MSEdge Extension](https://microsoftedge.microsoft.com/addons/detail/chromium-open-ide/ggfoollpnfolfaejalpiihpobcpbegkl).*

## Usage

Right click on the line you want to visit on remote [source.chromium.org](https://source.chromium.org).

For example in `//base/values.h:104`

<img src="images/CSO01.png" onerror="this.onerror=null; this.remove();" alt="CSO01.png" width="600"/>

Then the same line will be opened in the browser on remote [source.chromium.org](https://source.chromium.org).

<img src="images/CSO02.png" onerror="this.onerror=null; this.remove();" alt="CSO02.png" width="600"/>

And one tip message will show on the right-bottom of your VsCode Browser if open operation is executed succesfully.

<img src="images/CSO03.png" onerror="this.onerror=null; this.remove();" alt="CSO03.png" width="400"/>

(No need to worry about, it will disappear in serveral seconds or you can close it manully. :))

**Enjoy!**
