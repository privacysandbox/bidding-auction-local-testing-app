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

/**
 * Setup the app server and the B&A participant servers for web ads.
 *
 * This file contains the logic for the testing app,
 * and does not contain Protected Audience logic.
 */

import fs from 'fs';
import http from 'http';
import https from 'https';

import app from './app/server.js';
import advertiser from './participants/web/advertiser/server.js';
import publisher from './participants/web/publisher/server.js';
import sspTop from './participants/web/ssp-top/server.js';
import sspBA from './participants/web/ssp-ba/server.js';
import sspMix from './participants/web/ssp-mix/server.js';
import sspOD from './participants/web/ssp-od/server.js';
import dspA from './participants/web/dsp-a/server.js';
import dspB from './participants/web/dsp-b/server.js';
import dspX from './participants/web/dsp-x/server.js';
import dspY from './participants/web/dsp-y/server.js';

const APP_PORT = 3000;
const ADVERTISER_PORT = 4001;
const PUBLISHER_PORT = 4002;
const DSP_A_PORT = 5001;
const DSP_B_PORT = 5002;
const DSP_X_PORT = 5003;
const DSP_Y_PORT = 5004;
const SSP_TOP_PORT = 6001;
const SSP_X_PORT = 6002;
const SSP_Y_PORT = 6003;
const SSP_O_PORT = 6004;

const serverOptions = {
  key: fs.readFileSync('certs/localhost-key.pem'),
  cert: fs.readFileSync('certs/localhost.pem'),
};

export function start() {
  // The app itself is on http
  http.createServer(app).listen(APP_PORT);

  // The PA auction participants are on https
  https.createServer(serverOptions, advertiser).listen(ADVERTISER_PORT);
  https.createServer(serverOptions, publisher).listen(PUBLISHER_PORT);
  https.createServer(serverOptions, dspA).listen(DSP_A_PORT);
  https.createServer(serverOptions, dspB).listen(DSP_B_PORT);
  https.createServer(serverOptions, dspX).listen(DSP_X_PORT);
  https.createServer(serverOptions, dspY).listen(DSP_Y_PORT);
  https.createServer(serverOptions, sspTop).listen(SSP_TOP_PORT);
  https.createServer(serverOptions, sspBA).listen(SSP_X_PORT);
  https.createServer(serverOptions, sspMix).listen(SSP_Y_PORT);
  https.createServer(serverOptions, sspOD).listen(SSP_O_PORT);

  console.log('---');
  console.log(`App server available at http://localhost:${APP_PORT}`);
  console.log('---');
  console.log(
    `Advertiser server available at https://localhost:${ADVERTISER_PORT}`
  );
  console.log(
    `Publisher server available at https://localhost:${PUBLISHER_PORT}`
  );
  console.log('---');
  console.log(`DSP-A server available at https://localhost:${DSP_A_PORT}`);
  console.log(`DSP-B server available at https://localhost:${DSP_B_PORT}`);
  console.log(`DSP-X server available at https://localhost:${DSP_X_PORT}`);
  console.log(`DSP-Y server available at https://localhost:${DSP_Y_PORT}`);
  console.log('---');
  console.log(`SSP-TOP server available at https://localhost:${SSP_TOP_PORT}`);
  console.log(`SSP-BA server available at https://localhost:${SSP_X_PORT}`);
  console.log(`SSP-MIX server available at https://localhost:${SSP_Y_PORT}`);
  console.log(`SSP-OD server available at https://localhost:${SSP_O_PORT}`);
  console.log('---');
  console.log(`Open http://localhost:3000 in the browser`);
}
