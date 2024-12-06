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
 * Setup the DSP-A on-device buyer server
 */
import express from 'express';
import morgan from 'morgan';

const dspA = express();
dspA.use(
  morgan(
    '[App] [:date[clf]] :remote-addr :remote-user :method :url :status :response-time ms'
  )
);

dspA.use(
  express.static('src/participants/dsp-a', {
    setHeaders: (res, path) => {
      if (path.includes('generate-bid.js')) {
        res.set('Ad-Auction-Allowed', 'true');
      }

      if (path.includes('ad.html')) {
        res.set('Supports-Loading-Mode', 'fenced-frame');
      }
    },
  })
);

export default dspA;