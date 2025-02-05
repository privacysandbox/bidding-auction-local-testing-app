/*
 Copyright 2022 Google LLC

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

async function runSspMixAuction() {
  class AdAuction {
    constructor(sfeAddress) {
      this.sfeAddress = sfeAddress;
    }

    async getConfig() {
      const { request, requestId } = await this.#getServerAdAuctionData();
      const serverAdAuctionResult = await this.#runServerAdAuction(request);

      return [
        {
          seller: 'https://localhost:6003',
          requestId,
          serverResponse: serverAdAuctionResult,
        },
        {
          seller: 'https://localhost:6003',
          decisionLogicURL: 'https://localhost:6003/score-ad.js',
          interestGroupBuyers: [
            'https://localhost:5001',
            'https://localhost:5002',
          ],
        },
      ];
    }

    #getServerAdAuctionData() {
      const serverAdAuctionDataConfig = {
        seller: 'https://localhost:6003',
        requestSize: 51200,
        perBuyerConfig: {
          'https://localhost:5003': { targetSize: 8192 },
          'https://localhost:5004': { targetSize: 8192 },
        },
      };

      return navigator.getInterestGroupAdAuctionData(serverAdAuctionDataConfig);
    }

    async #runServerAdAuction(request) {
      const response = await fetch('https://localhost:6003/ad-auction', {
        method: 'POST',
        adAuctionHeaders: true,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adAuctionRequest: this.#encodeRequest(request),
          sfeAddress: this.sfeAddress,
          isComponentAuction: true,
        }),
      });

      const { serverAdAuctionResponse } = await response.json();

      return this.#decodeResponse(serverAdAuctionResponse);
    }

    #encodeRequest(request) {
      return btoa(String.fromCharCode.apply(null, request));
    }

    #decodeResponse(base64response) {
      return new Uint8Array(
        atob(base64response)
          .split('')
          .map((char) => char.charCodeAt(0))
      );
    }
  }

  const encodedSfeAddress = new URLSearchParams(window.location.search).get(
    'sfe2Address'
  );
  const sfeAddress = decodeURIComponent(encodedSfeAddress);

  const adAuction = new AdAuction(sfeAddress);
  const auctionConfig = await adAuction.getConfig();

  window.multiSellerAdAuction.setComponentAuctionConfig('sspMix', auctionConfig);
}

runSspMixAuction();
