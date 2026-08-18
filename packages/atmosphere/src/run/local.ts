import dns from 'node:dns';
import path from 'path';
import cors from 'cors';
import express from 'express';
import Atmosphere from '~/Atmosphere';
import { handleUncaughtErrors } from '~/utils';
handleUncaughtErrors(process);

// ref: https://github.com/nodejs/node/issues/40702#issuecomment-1103623246
dns.setDefaultResultOrder('ipv4first');

const server = express();
server.enable('trust proxy');
server.use(cors());
const ncGuiPath = path.join(__dirname, 'atmosphere-gui');
process.env.ATMOSPHERE_GUI_DIST_PATH = process.env.ATMOSPHERE_GUI_DIST_PATH ?? ncGuiPath;
server.use('/', express.static(ncGuiPath));
server.set('view engine', 'ejs');

(async () => {
  const httpServer = server.listen(process.env.PORT || 8080, async () => {
    console.log(`App started successfully.\nVisit -> ${Atmosphere.dashboardUrl}`);
    server.use(await Atmosphere.init({}, httpServer, server));
  });
})().catch((e) => console.log(e));
