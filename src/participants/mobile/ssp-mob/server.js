/*
 Copyright 2025 Google LLC

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

const sspMob = express();
sspMob.use(express.json());
sspMob.use(cors());
sspMob.use(
  morgan(
    '[SSP-MOB] [:date[clf]] :remote-addr :remote-user :method :url :status :response-time ms'
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
 * Server-side B&A mobile ad auction
 */
sspMob.post('/ad-auction', (req, res) => {
  const {
    adAuctionRequest, // Encrypted payload from the client. Base64 encoded.
  } = req.body;

  // Metadata forwarding
  const metadata = new grpc.Metadata();
  metadata.add('X-Accept-Language', req.header('Accept-Language'));
  metadata.add('X-User-Agent', req.header('User-Agent'));
  metadata.add('X-BnA-Client-IP', req.ip);

  // SFE SelectAd request payload
  const selectAdRequest = {
    auction_config: {
      seller: 'https://localhost:8001', // SSP-MOB B&A seller
      auction_signals: '{"testKey":"someValue"}',
      seller_signals: '{"testKey":"someValue"}',
      buyer_list: [
        'privacy-sandbox-flight.web.app', // DSP-MOB B&A buyer
      ],
      per_buyer_config: {
        'privacy-sandbox-flight.web.app': { buyer_signals: '{"testKey": "someValue"}' },
      },
    },
    client_type: 'CLIENT_TYPE_ANDROID',
    // The base64 string is decoded first
    protected_auction_ciphertext: decodeRequest(adAuctionRequest),
  };

  // Create gRPC client for SFE
  const sfeClient = createSfeClient('192.168.84.104:50053');

  // Call SelectAd
  sfeClient.selectAd(selectAdRequest, metadata, (error, response) => {
    if (!response) {
      console.log('[SSP-MOB SFE client error] ', error);
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
      `[SSP-MOB] Encoded serverAdAuctionResponse - ${serverAdAuctionResponse}`
    );
    console.log(`[SSP-MOB] Ad-Auction-Result hash - ${ciphertextShaHash}`);
  });
});

sspMob.use(express.static('src/participants/mobile/ssp-mob'));

export default sspMob;
