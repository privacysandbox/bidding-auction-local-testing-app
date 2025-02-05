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

/**
 * Run the SSP-MIX mixed-mode auction
 */
function runSspMixAuction() {
  class AdAuction {
    // The SFE network address is supplied by the App UI
    constructor(sfeAddress) {
      this.sfeAddress = sfeAddress;
    }

    /**
     * The B&A auction follows these steps:
     *
     * 1. Get the ad auction data
     * 2. Run the B&A part of the ad auction on the server
     * 3. Finish the ad auction in the browser
     */
    async run() {
      // Get the ad auction data
      // The "request" data is used for the server-side part of the auction
      // The "requestId" data is used for the client-side part of the auction
      const { request, requestId } = await this.#getAdAuctionData();

      // Run the B&A part of the auction
      const serverAdAuctionResult = await this.#runServerAdAuction(request);

      // Finish the ad auction in the browser
      const clientAdAuctionResult = await this.#runClientAdAuction(
        requestId,
        serverAdAuctionResult
      );

      // Render ad
      this.#renderAd(clientAdAuctionResult);

      // Logs
      console.log('[SSP-MIX] Server-side ad auction data - ', {
        request,
        requestId,
      });
      console.log(
        '[SSP-MIX] Server-side ad auction result - ',
        serverAdAuctionResult
      );
      console.log(
        '[SSP-MIX] Client-side ad auction result - ',
        clientAdAuctionResult
      );
    }

    /**
     * Get the ad auction data
     *
     * For mixed-mode, the ad auction data configs needs only the buyers that are
     * participating in the B&A-part of the auction, which is DSP-X and DSP-Y
     *
     * @returns ad auction data. contains two values: request and requestId
     */
    #getAdAuctionData() {
      const adAuctionDataConfig = {
        seller: 'https://localhost:6003', // SSP-MIX mixed-mode seller
        requestSize: 51200,
        perBuyerConfig: {
          'https://localhost:5003': { targetSize: 8192 }, // DSP-X B&A buyer
          'https://localhost:5004': { targetSize: 8192 }, // DSP-Y B&A buyer
        },
      };

      return navigator.getInterestGroupAdAuctionData(adAuctionDataConfig);
    }

    /**
     * Run the B&A server-side auction
     *
     * The fetch call is sent to the seller's ad service (SAS), and SAS
     * forwards the encrypted B&A payload in this call to the SFE service
     *
     * In this example, only the B&A payload is sent, but in a real-life
     * scenario, this should be a unified auction request that contains both
     * the contextual auction payload and the B&A payload
     *
     * @param {Uint8Array} request encrypted payload
     * @returns B&A ad auction result
     */
    async #runServerAdAuction(request) {
      const response = await fetch('https://localhost:6003/ad-auction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Required to trigger ad auction result verification
        adAuctionHeaders: true,
        body: JSON.stringify({
          // The SFE address is supplied by the App UI
          sfeAddress: this.sfeAddress,
          // The request data is in a bytearray format (UInt8Array) which
          // is not a valid JSON value. Therefore, we apply the base64 encoding.
          adAuctionRequest: this.#encodeRequest(request),
        }),
      });

      const { serverAdAuctionResponse } = await response.json();

      // The response received from SAS is encoded in base64, so we
      // decode it back to the bytearray
      return this.#decodeResponse(serverAdAuctionResponse);
    }

    /**
     * Finish the ad auction on the client
     *
     * For a mixed-mode auction, the seller also acts as the top-level seller,
     * and each auction type (on-device and B&A) auctions are added as a
     * component ad auction
     *
     * @param {string} requestId id from the getIGAdAuctionData() call
     * @param {Uint8Array} serverAdAuctionResult B&A auction result from SFE
     * @returns ad auction result
     */
    #runClientAdAuction(requestId, serverAdAuctionResult) {
      const auctionConfig = {
        seller: 'https://localhost:6003', // SSP-MIX mixed-mode seller
        decisionLogicURL: 'https://localhost:6003/score-ad.js',
        // For mixed-mode, each auction type is added as a component auction
        componentAuctions: [
          // B&A auction
          {
            // For mixed-mode, the component seller is same as the top-level seller
            seller: 'https://localhost:6003', // SSP-MIX mixed-mode seller
            requestId,
            serverResponse: serverAdAuctionResult,
          },
          // On-device auction
          {
            // For mixed-mode, the component seller is same as the top-level seller
            seller: 'https://localhost:6003', // SSP-MIX mixed-mode seller
            decisionLogicURL: 'https://localhost:6003/score-ad.js',
            interestGroupBuyers: [
              'https://localhost:5001', // DSP-A on-device buyer
              'https://localhost:5002', // DSP-B on-device buyer
            ],
          },
        ],
        resolveToConfig: true,
      };

      console.log('[SSP-MIX] Auction config - ', auctionConfig);

      return navigator.runAdAuction(auctionConfig);
    }

    /**
     * Render the ad
     *
     * @param {object} auctionResult Fenced frame config of the winning ad
     */
    #renderAd(auctionResult) {
      const fencedFrameEl = document.createElement('fencedframe');
      fencedFrameEl.config = auctionResult;
      fencedFrameEl.id = 'ad';

      document.body.appendChild(fencedFrameEl);
    }

    /**
     * Encode the bytearray data to a base64 string
     *
     * @param {Uint8Array} data bytearray
     * @returns base64 encoded string
     */
    #encodeRequest(data) {
      return btoa(String.fromCharCode.apply(null, data));
    }

    /**
     * Decode base64 string to bytearray
     *
     * @param {string} base64response
     * @returns Uint8Array decoded data
     */
    #decodeResponse(base64response) {
      return new Uint8Array(
        atob(base64response)
          .split('')
          .map((char) => char.charCodeAt(0))
      );
    }
  }

  // Read the SFE address from the query param
  const encodedSfeAddress = new URLSearchParams(window.location.search).get(
    'sfe2Address'
  );
  const sfeAddress = decodeURIComponent(encodedSfeAddress);

  // Start the auction
  const adAuction = new AdAuction(sfeAddress);
  adAuction.run();
}

runSspMixAuction();
