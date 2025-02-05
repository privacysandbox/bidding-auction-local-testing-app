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
 * SSP-TOP top-level seller for the multi-seller PA auction
 */
class MultiSellerAdAuction {
  #componentAuctionConfigs = {};

  /**
   * Collect component auction configs
   *
   * Each component seller submits their auction config to the top-level seller.
   *
   * For implementation simplicity, the MultiSellerAdAuction instance is set on
   * the window, and each component seller submits the config by calling:
   * window.multiSellerAdAuction.setComponentAuctionConfig()
   *
   * @param {string} sellerName hardcoded SSP name
   * @param {object} config component auction config
   */
  setComponentAuctionConfig(sellerName, config) {
    this.#componentAuctionConfigs[sellerName] = config;

    // For implementation simplicity, we hardcode the number of sellers
    if (Object.keys(this.#componentAuctionConfigs).length === 3) {
      // When all 3 component sellers have submitted their configs,
      // the multi-seller auction begins
      this.#run();
    }
  }

  /**
   * Run the multi-seller auction
   *
   * The auction starts when 3 hardcoded component sellers submit their configs
   */
  async #run() {
    const auctionConfig = {
      // SSP-OD on-device seller
      seller: 'https://localhost:6001',
      decisionLogicUrl: 'https://localhost:6001/score-ad.js',
      // The component auction configs are submitted by the component sellers
      // calling window.multiSellerAdAuction.setComponentAuctionConfig()
      componentAuctions: [
        // SSP-OD on-device-only component auction
        this.#componentAuctionConfigs.sspOD,

        // SSP-BA B&A-only component auction
        this.#componentAuctionConfigs.sspBA,

        // SSP-MIX mixed-mode component auction
        // SSP-MIX submits two configs, one for on-device and one for B&A
        ...this.#componentAuctionConfigs.sspMix,
      ],
      resolveToConfig: true,
    };

    const auctionResult = await navigator.runAdAuction(auctionConfig);
    this.#renderAd(auctionResult);

    console.log('[SSP-TOP] Auction config - ', auctionConfig);
    console.log('[SSP-TOP] Auction result - ', auctionResult);
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
}

// Set the instance on the window to collect the component auction configs
window.multiSellerAdAuction = new MultiSellerAdAuction();

const sspScriptUrls = [
  'https://localhost:6002/get-component-config.js', // SSP-BA B&A-only seller
  'https://localhost:6003/get-component-config.js', // SSP-MIX mixed-mode seller
  'https://localhost:6004/get-component-config.js', // SSP-OD on-device-only seller
];

// Load each component seller's script
sspScriptUrls.forEach((scriptSrc) => {
  const scriptEl = document.createElement('script');
  scriptEl.setAttribute('allow', 'run-ad-auction');
  scriptEl.src = scriptSrc;

  document.body.appendChild(scriptEl);
});
