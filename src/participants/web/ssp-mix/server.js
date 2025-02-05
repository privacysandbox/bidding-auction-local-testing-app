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

import { createHash } from 'crypto';
import grpc from '@grpc/grpc-js';
import cors from 'cors';
import express from 'express';
import morgan from 'morgan';

import createSfeClient from './sfe-client/index.js';

const sspMix = express();
sspMix.use(express.json());
sspMix.use(cors());
sspMix.use(
  morgan(
    '[:date[clf]] :remote-addr :remote-user :method :url :status :response-time ms'
  )
);

/**
 * Encode to a base64 string
 * @param {Uint8Array} response bytearray response from SFE
 * @returns base64 string
 */
function encodeResponse(response) {
  return btoa(String.fromCharCode.apply(null, response));
}

/**
 * Decode base64 request
 *
 * @param {string} auctionRequest Base64 encoded payload
 * @returns Uint8Array payload
 */
function decodeRequest(auctionRequest) {
  return new Uint8Array(
    atob(auctionRequest)
      .split('')
      .map((char) => char.charCodeAt(0))
  );
}

/**
 * Server-side B&A ad auction
 */
sspMix.post('/ad-auction', (req, res) => {
  const {
    adAuctionRequest, // Encrypted payload from the client. Base64 encoded.
    sfeAddress, // SFE address supplied by the app UI
    isComponentAuction, // A flag set by the demo
  } = req.body;

  // Metadata forwarding
  const metadata = new grpc.Metadata();
  metadata.add('X-Accept-Language', req.header('Accept-Language'));
  metadata.add('X-User-Agent', req.header('User-Agent'));
  metadata.add('X-BnA-Client-IP', req.ip);

  const selectAdRequest = {
    auction_config: {
      // For the single-seller mixed-mode auction, the top-level seller is the
      // same as the single-seller SSP-MIX. For the multi-seller auction, the top-level
      // seller is SSP-TOP
      top_level_seller: isComponentAuction
        ? 'https://localhost:6001' // SSP-TOP top-level seller
        : 'https://localhost:6003', // SSP-MIX mixed-mode seller
      seller: 'https://localhost:6003', // SSP-MIX mixed-mode seller
      auction_signals: '{"testKey":"someValue"}',
      seller_signals: '{"testKey":"someValue"}',
      buyer_list: [
        'https://localhost:5003', // DSP-X B&A buyer
        'https://localhost:5004', // DSP-Y B&A buyer
      ],
      per_buyer_config: {
        'https://localhost:5003': { buyer_signals: '{"testKey": "someValue"}' },
        'https://localhost:5004': { buyer_signals: '{"testKey": "someValue"}' },
      },
    },
    client_type: 'CLIENT_TYPE_BROWSER',
    // The base64 string is decoded first
    protected_auction_ciphertext: decodeRequest(adAuctionRequest),
  };

  // Create gRPC client for Stack 2 SFE
  const sfeClient = createSfeClient(sfeAddress);

  // Call SelectAd
  sfeClient.selectAd(selectAdRequest, metadata, (error, response) => {
    if (!response) {
      console.log('[SSP-MIX SFE client] !!! ', error);
      return;
    }

    // SFE response contains the auction result ciphertext
    const { auction_result_ciphertext } = response;

    // For auction result verification, we create a base64-encoded SHA-256 hash
    // of the ciphertext returned from SFE, and set it in the response header
    const ciphertextShaHash = createHash('sha256')
      .update(auction_result_ciphertext, 'base64')
      .digest('base64url');
    res.set('Ad-Auction-Result', ciphertextShaHash);

    // Since a JSON cannot handle a byte array, we base64 encode the ciphertext
    const serverAdAuctionResponse = encodeResponse(auction_result_ciphertext);
    res.json({ serverAdAuctionResponse });

    console.log(
      `[SSP-MIX] Encoded serverAdAuctionResponse - ${serverAdAuctionResponse}`
    );
    console.log(`[SSP-MIX] Ad-Auction-Result hash - ${ciphertextShaHash}`);
  });
});

sspMix.use(
  express.static('src/participants/web/ssp-mix', {
    setHeaders: (res, path) => {
      if (path.includes('score-ad.js')) {
        return res.set('Ad-Auction-Allowed', 'true');
      }
    },
  })
);

/**
 * Mock SSP-MIX K/V BYOB server
 */
sspMix.get('/kv', (req, res) => {
  res.setHeader('Ad-Auction-Allowed', true);

  res.json({
    renderUrls: {
      'https://localhost:5003/ad.html': [1, 2, 3],
      'https://localhost:5004/ad.html': [1, 2, 3],
    },
  });
});

export default sspMix;
