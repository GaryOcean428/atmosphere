import path from 'path';
import cors from 'cors';
import express from 'express';

import Atmosphere from '~/Atmosphere';
import { handleUncaughtErrors } from '~/utils';
handleUncaughtErrors(process);

const server = express();
server.enable('trust proxy');
server.use(cors());
server.use(
  process.env.ATMOSPHERE_DASHBOARD_URL ?? '/',
  express.static(path.join(__dirname, 'atmosphere-gui')),
);
server.set('view engine', 'ejs');

(async () => {
  const httpServer = server.listen(process.env.PORT || 8080, async () => {
    console.log(`App started successfully.\nVisit -> ${Atmosphere.dashboardUrl}`);
    server.use(await Atmosphere.init({}, httpServer, server));
  });
})().catch((e) => console.log(e));
