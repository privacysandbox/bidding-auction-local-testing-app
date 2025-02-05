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
 * Provide the on-device component auction config to the top-level seller
 */
function runSspODAuction() {
  class AdAuction {
    getConfig() {
      return {
        seller: 'https://localhost:6004', // SSP-OD on-device seller
        interestGroupBuyers: [
          'https://localhost:5001', // DSP-A on-device buyer
          'https://localhost:5002', // DSP-B on-device buyer
        ],
        decisionLogicUrl: 'https://localhost:6004/score-ad.js',
      };
    }
  }

  const adAuction = new AdAuction();
  const auctionConfig = adAuction.getConfig();

  // The config is submitted to the top-level seller
  window.multiSellerAdAuction.setComponentAuctionConfig('sspOD', auctionConfig);
}

runSspODAuction();
