import figlet from "figlet";
import { Command } from 'commander';
import { getAtmosphereConfig } from "./core";
import { SecretManager } from "./core";
import { AtError } from "./core";
import { logger } from "./core";

console.log(figlet.textSync("Atmosphere Secret CLI"));

const program = new Command();

program
  .version('1.0.0')
  .description('Atmosphere Secret CLI')
  .arguments('<prevSecret> <newSecret>')
  .option('--atm-db <char>', 'Atmosphere  connection database url, equivalent to ATMOSPHERE_DB env variable')
  .option('--atm-db-json <char>', 'Atmosphere connection database json, equivalent to ATMOSPHERE_DB_JSON env variable')
  .option('--atm-db-json-file <char>', 'Atmosphere connection database json file path, equivalent to ATMOSPHERE_DB_JSON_FILE env variable')
  .option('--database-url <char>', 'JDBC database url, equivalent to DATABASE_URL env variable')
  .option('--database-url-file <char>', 'JDBC database url file path, equivalent to DATABASE_URL_FILE env variable')
  .option('-p, --prev <char>', 'old secret string to decrypt sources and integrations')
  .option('-n, --new <char>', 'new secret string to encrypt sources and integrations')
  .action(async (prevVal, newVal) => {

    try {
      // extract options
      const options = program.opts();
      const config = await getAtmosphereConfig(options);
      const { prevSecret = prevVal, newSecret = newVal } = program.opts();

      if (!prevSecret || !newSecret) {
        console.error('Error: Both prevSecret and newSecret are required.');
        program.help();
      } else {
        const secretManager = new SecretManager(prevSecret, newSecret, config);

        // validate meta db config which is resolved from env variables
        await secretManager.validateConfig();

        // validate old secret
        const { sourcesToUpdate, integrationsToUpdate } = await secretManager.validateAndExtract();


        // update sources and integrations
        await secretManager.updateSecret(sourcesToUpdate, integrationsToUpdate);

      }
    } catch (e) {
      if (e instanceof AtError) {
        // print error message in a better way
        logger.error(e.message);
        process.exit(1);
      }
      console.error(e);
      process.exit(1);
    }
  });



// Add error handling
program.exitOverride((err) => {
  console.error(err.message);
  process.exit(1);
});

program.parse(process.argv);





