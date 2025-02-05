# bidding-auction-local-testing-app

The B&A Local Testing App (LTA) is a companion application to Bidding & Auction Service for Privacy Sandbox, and runs locally alongside the B&A Services stacks on your development machine or VM. The LTA can be configured to work with either [web](#web-client-demo) or [mobile](#mobile-client-demo) B&A clients.

## Web Client Demo

The LTA provides locally-running DSP and SSP test servers that allow you to test a variety of different auction scenarios from a web client, including:

* On-device-only auction
* B&A-only auction
* Mixed-mode auction
* Multi-seller auction

It also provides a demo web app to facilitate testing these scenarios:

[![](./docs/app-introduction.gif)](/README-web.md)

[Read more about the web client demo.](/README-web.md)

## Mobile Client Demo

The LTA provides locally-running DSP and SSP test servers that allow you to test a B&A auction from a mobile client.

It works alongside the [Project Flight](https://github.com/privacysandbox/project-flight) sample Android apps to demonstrate how an advertiser app and publisher app can participate in a B&A auction:

[![](./docs/mobile-demo.gif)](/README-mobile.md)

[Read more about the mobile client demo.](/README-mobile.md)