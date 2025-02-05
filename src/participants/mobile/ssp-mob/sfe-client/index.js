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

import path from 'path';
import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';

// Path of the SFE proto file
const protoPath = path.join(
  path.resolve(),
  'src/participants/mobile/ssp-mob/sfe-client/client.proto'
);

// Load the proto file
const packageDefinition = protoLoader.loadSync(protoPath, {
  keepCase: true,
  enums: String,
});

// Load the SFE SelectAd call definition
const {
  privacy_sandbox: {
    bidding_auction_servers: { SellerFrontEnd },
  },
} = grpc.loadPackageDefinition(packageDefinition);

/**
 * Create the gRPC client for the mobile SFE
 *
 * @param {string} sfeAddress Local network address of the mobile SFE
 * @returns gRPC client
 */
function createSfeClient(sfeAddress) {
  return new SellerFrontEnd(sfeAddress, grpc.credentials.createInsecure());
}

export default createSfeClient;
