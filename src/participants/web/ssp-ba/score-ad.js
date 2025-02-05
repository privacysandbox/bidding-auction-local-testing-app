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
 * Scoring logic for the SSP-TOP top-level seller for the multi-seller auction
 *
 * This file loaded by Auction Service
 */
function scoreAd(
  adMetadata,
  bid,
  auctionConfig,
  trustedScoringSignals,
  browserSignals
) {
  return {
    desirability: bid,
    allowComponentAuction: true,
    // There is a bug right now and the "ad" field cannot be empty
    ad: 'some-ad-metadata',
  };
}

function reportResult(auctionConfig, browserSignals) {}
