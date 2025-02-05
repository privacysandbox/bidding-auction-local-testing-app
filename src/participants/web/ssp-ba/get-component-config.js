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
 * Provide SSP-BA B&A-only component auction config
 */
async function runSspBAAuction() {
  class AdAuction {
    // The SFE network address is supplied by the App UI
    constructor(sfeAddress) {
      this.sfeAddress = sfeAddress;
    }

    /**
     * Get the component auction config to be sent to the top-level seller
     *
     * The component auction config contains the B&A server-side auction result,
     * and the top-level seller will finish the auction on the client.
     */
    async getConfig() {
      const { request, requestId } = await this.#getAdAuctionData();
      const serverAdAuctionResult = await this.#runServerAdAuction(request);

      return {
        seller: 'https://localhost:6002', // SSP-BA B&A seller
        requestId,
        serverResponse: serverAdAuctionResult,
      };
    }

    /**
     * Get the ad auction data
     *
     * The navigator.getInterestGroupAdAuctionData() call provides the encrypted
     * bundle of each buyer's interest group data
     *
     * @returns ad auction data. contains two values: request and requestId
     */
    #getAdAuctionData() {
      const serverAdAuctionDataConfig = {
        seller: 'https://localhost:6002', // SSP-BA B&A-only seller
        requestSize: 51200,
        perBuyerConfig: {
          'https://localhost:5003': { targetSize: 8192 }, // DSP-X B&A buyer
          'https://localhost:5004': { targetSize: 8192 }, // DSP-Y B&A buyer
        },
      };

      return navigator.getInterestGroupAdAuctionData(serverAdAuctionDataConfig);
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
      const response = await fetch('https://localhost:6002/ad-auction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Required to trigger ad auction result verification
        adAuctionHeaders: true,
        body: JSON.stringify({
          isComponentAuction: true,
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
    'sfe1Address'
  );
  const sfeAddress = decodeURIComponent(encodedSfeAddress);

  const adAuction = new AdAuction(sfeAddress);
  const auctionConfig = await adAuction.getConfig();

  // Send the component auction config to the top-level seller
  window.multiSellerAdAuction.setComponentAuctionConfig('sspBA', auctionConfig);
}

runSspBAAuction();
