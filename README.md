# bidding-auction-dev-local-console

![](./docs/app-introduction.gif)

Local developer console for Bidding and Auction Services

## Quickstart

TL;DR: 
1. Install prerequisites
2. Setup repositories
3. Build the services
4. Build and start the local companion app
5. Start the services
6. ???
7. $$$

### Install prerequisites

#### Prepare a linux machine

Use a linux local machine, or provision a linux VM of the cloud provider of your choice. Note that we will be connecting to http://localhost:3000 of this machine. If the VM does not provide a GUI, then make sure the port is accessible to your local machine so you can connect to it. 

#### Install Docker

```bash
# Install Docker
> curl -fsSL https://get.docker.com -o get-docker.sh
> sudo sh get-docker.sh

# Setup sudo-less Docker
> sudo groupadd docker
> sudo usermod -aG docker $USER
> newgrp docker

# Test
> docker run hello-world
```

> With the sudo-less setup, the docker group grants root-level privileges to the user. Read the [sudo-less Docker](https://docs.docker.com/engine/install/linux-postinstall/#manage-docker-as-a-non-root-user) guide to learn more. 

#### Install Node 

The following commands installs `node` using `nvm`: 

```bash
> curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
> source ~/.bashrc
> nvm install --lts
> node -v
```

Doc: [Detailed `nvm` installation instruction](https://github.com/nvm-sh/nvm?tab=readme-ov-file#installing-and-updating)

### Setup the services

#### Pull down the Bidding and Auction Services repository

For our demo, we will be using two stacks of B&A to simulate auctions involving multiple buyers and sellers. 

```bash
> git clone https://github.com/privacysandbox/bidding-auction-servers.git bidding-auction-servers-1
> git clone https://github.com/privacysandbox/bidding-auction-servers.git bidding-auction-servers-2
```

##### Apply Git patch

> This is a temporary step that won't be necessary in 4.5+ release in the future

There are some changes we need to the B&A code to allow the local companion app to run. The changes in this patch will be included in a future B&A release, and the patch will not be necessary then. 

We will use the 4.3 release. 

1. Download the patch and place it in the B&A repository folder
2. Apply the patch in Stack 1 repository (in the `bidding-auction-servers-1` folder)

```bash
> cd bidding-auction-servers-1
> git checkout release-4.3
> curl https://raw.githubusercontent.com/privacysandbox/bidding-auction-local-console/refs/heads/main/resources/stack-1.patch > stack.patch
> git apply stack.patch
> git status
```

3. Apply the patch in Stack 2 repository (in the `bidding-auction-servers-2` folder). This is a different patch from the stack 1 patch.

```bash
> cd ../bidding-auction-servers-2
> git checkout release-4.3
> curl https://raw.githubusercontent.com/privacysandbox/bidding-auction-local-console/refs/heads/main/resources/stack-2.patch > stack.patch
> git apply stack.patch
> git status
```

#### Build the services

Execute the following command from the root of each stack's repository to build the services: 

```bash
> ./production/packaging/build_and_test_all_in_docker \
  --service-path bidding_service \
  --service-path auction_service \
  --service-path buyer_frontend_service \
  --service-path seller_frontend_service \
  --platform gcp \
  --instance local \
  --no-precommit \
  --no-tests \
  --build-flavor non_prod \
  --gcp-skip-image-upload
```

This step may take up to 3 hours on an 8-core machine and an hour on a 32-core machine (Sorry! We are working on improving this process!).  

[Relevant xkcd meme](https://xkcd.com/303/): 

<img src="https://imgs.xkcd.com/comics/compiling.png" alt="drawing" width="300"/>

### Build and run local development companion app

Pull and build the service: 

```bash
> git clone https://github.com/privacysandbox/bidding-auction-local-console.git
> cd bidding-auction-local-dev-console
> ./setup 
```
Start the service:

```bash
> ./start
```

### Open Chrome

Start Chrome from the command line with the following flags: 
```
google-chrome --enable-privacy-sandbox-ads-apis --disable-features=EnforcePrivacySandboxAttestations,FledgeEnforceKAnonymity --enable-features=FledgeBiddingAndAuctionServerAPI,FledgeBiddingAndAuctionServer:FledgeBiddingAndAuctionKeyURL/https%3A%2F%2Fstorage.googleapis.com%2Fba-test-buyer%2Fcoordinator-test-key.json 
```

Make sure you have fully exited out of all Chrome instances before opening it from the command line with the B&A flags. 

### Open the page in Chrome

Visit the UI at https://localhost:3000 or your VM's address and `:3000`.  

### Start the services in local mode

Execute each command in a separate terminal window. 

#### Stack 1 (DSP-X and SSP-X)

Run the following commands in root folder of the first B&A Stack

##### DSP-X Bidding Service

```bash
EXTRA_DOCKER_RUN_ARGS="--ip=192.168.84.101" \
BIDDING_JS_URL="https://192.168.84.100:5003/generate-bid.js" \
  ./tools/debug/start_bidding_ldc
```

##### DSP-X BFE Service

```bash
BUYER_KV_SERVER_ADDR="https://192.168.84.100:5003/kv" \
  ./tools/debug/start_bfe_ldc
```

##### SSP-X Auction Service 

```bash
AUCTION_JS_URL="https://192.168.84.100:6002/score-ad.js" \
  ./tools/debug/start_auction_ldc
```

##### SSP-X SFE Service A

```bash
SELLER_ORIGIN_DOMAIN="https://localhost:6002" \
KEY_VALUE_SIGNALS_HOST="https://192.168.84.100:6002/kv" \
  ./tools/debug/start_sfe_ldc
```

#### Stack 2 (DSP-Y and SSP-Y)

Run the following commands in root folder of the second B&A Stack

##### DSP-Y Bidding Service

```bash
BIDDING_JS_URL="https://192.168.84.100:5004/generate-bid.js" \
  ./tools/debug/start_bidding_ldc
```

##### DSP-Y BFE Service

```bash
BUYER_KV_SERVER_ADDR="https://192.168.84.100:5004/kv" \
  ./tools/debug/start_bfe_ldc
```

##### SSP-Y Auction Service

```bash
AUCTION_JS_URL="https://192.168.84.100:6003/score-ad.js" \
  ./tools/debug/start_auction_ldc
```

##### SSP-Y SFE Service

```bash
SELLER_ORIGIN_DOMAIN="https://localhost:6003" \
KEY_VALUE_SIGNALS_HOST="https://192.168.84.100:6003/kv" \
  ./tools/debug/start_sfe_ldc
```

## Design

* `SSP-TOP` - The top-level seller 
* `SSP-X` - B&A-only seller
* `SSP-Y` - B&A + on-device (mixed-mode) seller
* `SSP-O` - On-device-only seller
* `DSP-A` and `DSP-B` - On-device buyers
* `DSP-X` and `DSP-Y` - B&A buyers

The demo runs the following set of auctions: 
* On-device single-seller auction with `SSP-O`, `DSP-A`, and `DSP-B`
* B&A single-seller auction with `SSP-X`, `DSP-X`, and `DSP-Y`
* B&A single-seller mixed-mode auction with `SSP-Y`, `DSP-X`, `DSP-Y`, `DSP-A`, and `DSP-B`
* B&A multi-seller auction by `SSP-TOP` with: 
  * `SSP-O` - on-device component auction
  * `SSP-X` - B&A-only component auction
  * `SSP-Y` - mixed-mode component auction

### Architecture

![](./docs/architecture.png)

* App UI - https://localhost:3000 / https://192.168.84.100:3000
* SSP-TOP - https://localhost:4001 / https://192.168.84.100:4001
* SSP-X - https://localhost:4002 / https://192.168.84.100:4002
* SSP-Y - https://localhost:4003 / https://192.168.84.100:4003
* SSP-O - https://localhost:4004 / https://192.168.84.100:4004
* DSP-A - https://localhost:5001 / https://192.168.84.100:5001
* DSP-B - https://localhost:5002 / https://192.168.84.100:5002
* DSP-X - https://localhost:5003 / https://192.168.84.100:5003
* DSP-Y - https://localhost:5004 / https://192.168.84.100:5004
