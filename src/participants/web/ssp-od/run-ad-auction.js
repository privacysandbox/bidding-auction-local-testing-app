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
 * Run the on-device Protected Audience auction
 */
function runSspODAuction() {
  class AdAuction {
    /**
     * Run the on-device PA auction
     */
    async run() {
      const auctionResult = await navigator.runAdAuction({
        seller: 'https://localhost:6004', // SSP-OD on-device seller
        interestGroupBuyers: [
          'https://localhost:5001', // DSP-A on-device buyer
          'https://localhost:5002', // DSP-B on-device buyer
        ],
        decisionLogicUrl: 'https://localhost:6004/score-ad.js',
        resolveToConfig: true,
      });

      this.#renderAd(auctionResult);
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

  const adAuction = new AdAuction();
  adAuction.run();
}

runSspODAuction();
