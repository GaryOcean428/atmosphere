const path = require('path');
const fs = require('fs').promises;
const semver = require('semver');

/**
 * Synchronizes dependencies between atmosphere and integration packages
 *
 * @param {Object} options - Sync options
 * @param {boolean} options.bidirectional - Whether to sync in both directions (default: true)
 * @param {string} options.direction - Direction of sync: 'normal' (integrations → atmosphere) or 'reverse' (atmosphere → integrations)
 * @returns {Promise<void>}
 */
async function syncDependencies(
  options = { bidirectional: true, direction: 'normal' },
) {
  console.log(
    'Syncing dependencies between atmosphere and integration packages...',
  );

  // Set defaults
  options = {
    bidirectional: true,
    direction: 'normal',
    ...options,
  };

  // If direction is 'reverse', we're only doing atmosphere → integrations
  const syncIntegrationsToAtmosphere =
    options.bidirectional || options.direction === 'normal';
  const syncAtmosphereToIntegrations =
    options.bidirectional || options.direction === 'reverse';

  // Read the atmosphere package.json
  const atmospherePackageJsonPath = path.join(__dirname, '..', 'package.json');
  const atmospherePackageJson = JSON.parse(
    await fs.readFile(atmospherePackageJsonPath, 'utf-8'),
  );

  // Collect all dependencies and their versions from atmosphere
  const atmosphereDeps = {
    ...(atmospherePackageJson.dependencies || {}),
    ...(atmospherePackageJson.devDependencies || {}),
  };

  // Track dependencies to be added or updated
  const depsToUpdate = {};
  const depsToAdd = {};
  const integrationDepsMap = {};

  // Track integrations to update if bidirectional
  const integrationsToUpdate = new Map();

  // Find local integrations
  try {
    const localIntegrationsPath = path.join(
      __dirname,
      '..',
      '..',
      'atmosphere-integrations',
      'packages',
    );

    const localIntegrationDirs = await fs.readdir(localIntegrationsPath, {
      withFileTypes: true,
    });

    // First pass: gather all integration dependencies
    for (const dirent of localIntegrationDirs) {
      if (!dirent.isDirectory() || dirent.name === 'core') continue;

      const integrationName = dirent.name;
      const integrationPackageJsonPath = path.join(
        localIntegrationsPath,
        integrationName,
        'package.json',
      );

      const integrationPackageJson = JSON.parse(
        await fs.readFile(integrationPackageJsonPath, 'utf-8'),
      );

      // Store the integration package json for updates
      if (syncAtmosphereToIntegrations) {
        integrationsToUpdate.set(integrationName, {
          path: integrationPackageJsonPath,
          json: integrationPackageJson,
          changed: false,
        });
      }

      // Only process dependencies from integrations if we're syncing that direction
      if (syncIntegrationsToAtmosphere) {
        // Process dependencies from this integration
        const dependencies = integrationPackageJson.dependencies || {};

        for (const [dep, version] of Object.entries(dependencies)) {
          // Skip workspace dependencies and atmosphere-integrations
          if (
            version === 'workspace:*' ||
            dep.startsWith('@atmosphere-integrations/')
          ) {
            continue;
          }

          // Track which integrations use each dependency
          if (!integrationDepsMap[dep]) {
            integrationDepsMap[dep] = [];
          }
          integrationDepsMap[dep].push({
            integration: integrationName,
            version,
          });

          if (!atmosphereDeps[dep]) {
            // This is a new dependency to add
            depsToAdd[dep] = version;
          } else if (atmosphereDeps[dep] !== version) {
            // This dependency exists but with a different version
            // Determine which version is newer
            try {
              // Handle non-semver versions like git urls or local paths
              if (
                !version.startsWith('^') &&
                !version.startsWith('~') &&
                !semver.valid(semver.clean(version))
              ) {
                // For non-standard versions, prefer the integration version if flagged for update
                if (depsToUpdate[dep]) {
                  console.log(
                    `Warning: Non-standard version for ${dep}: ${version}, keeping existing`,
                  );
                }
                continue;
              }

              const currentVersion = atmosphereDeps[dep].replace(/[\^~]/, '');
              const newVersion = version.replace(/[\^~]/, '');

              if (semver.gt(newVersion, currentVersion)) {
                depsToUpdate[dep] = version;
                console.log(
                  `Updating ${dep}: ${atmosphereDeps[dep]} → ${version} (from ${integrationName})`,
                );
              }
            } catch (e) {
              console.log(
                `Warning: Unable to compare versions for ${dep}: ${e.message}`,
              );
            }
          }
        }
      }
    }

    let hasChanges = false;

    // First direction: Integrations → Atmosphere
    if (syncIntegrationsToAtmosphere) {
      console.log('\nSyncing from integrations to atmosphere...');

      // Add new dependencies
      for (const [dep, version] of Object.entries(depsToAdd)) {
        console.log(
          `Adding new dependency ${dep}@${version} to atmosphere, used by: ${integrationDepsMap[
            dep
          ]
            .map((d) => d.integration)
            .join(', ')}`,
        );
        atmospherePackageJson.dependencies[dep] = version;
        hasChanges = true;
      }

      // Update existing dependencies
      for (const [dep, version] of Object.entries(depsToUpdate)) {
        const usedBy = integrationDepsMap[dep]
          .map((d) => d.integration)
          .join(', ');

        // Check if it's in dependencies or devDependencies
        if (
          atmospherePackageJson.dependencies &&
          atmospherePackageJson.dependencies[dep]
        ) {
          atmospherePackageJson.dependencies[dep] = version;
          console.log(
            `Updated dependency ${dep}@${version} in atmosphere, used by: ${usedBy}`,
          );
          hasChanges = true;
        } else if (
          atmospherePackageJson.devDependencies &&
          atmospherePackageJson.devDependencies[dep]
        ) {
          atmospherePackageJson.devDependencies[dep] = version;
          console.log(
            `Updated devDependency ${dep}@${version} in atmosphere, used by: ${usedBy}`,
          );
          hasChanges = true;
        }
      }

      // Sort dependencies alphabetically
      if (atmospherePackageJson.dependencies) {
        atmospherePackageJson.dependencies = Object.fromEntries(
          Object.entries(atmospherePackageJson.dependencies).sort((a, b) =>
            a[0].localeCompare(b[0]),
          ),
        );
      }

      if (atmospherePackageJson.devDependencies) {
        atmospherePackageJson.devDependencies = Object.fromEntries(
          Object.entries(atmospherePackageJson.devDependencies).sort((a, b) =>
            a[0].localeCompare(b[0]),
          ),
        );
      }

      // Write back the updated package.json if there were changes
      if (hasChanges) {
        await fs.writeFile(
          atmospherePackageJsonPath,
          JSON.stringify(atmospherePackageJson, null, 2),
        );
        console.log(
          'Updated atmosphere package.json with synchronized dependencies',
        );
      } else {
        console.log('No dependency changes needed for atmosphere');
      }
    }

    let integrationUpdates = 0;

    // Second direction: Atmosphere → Integrations
    if (syncAtmosphereToIntegrations) {
      console.log('\nSyncing from atmosphere to integration packages...');

      // Update dependencies in atmosphere if we didn't already do it
      if (!syncIntegrationsToAtmosphere && hasChanges) {
        const updatedAtmosphere = JSON.parse(
          await fs.readFile(atmospherePackageJsonPath, 'utf-8'),
        );
        Object.assign(
          atmosphereDeps,
          updatedAtmosphere.dependencies || {},
          updatedAtmosphere.devDependencies || {},
        );
      }

      // Now update all integrations based on atmosphere dependencies
      for (const [integrationName, integration] of integrationsToUpdate) {
        const integrationPackageJson = integration.json;
        let integrationChanged = false;

        // Update integration dependencies based on atmosphere
        for (const [dep, version] of Object.entries(
          integrationPackageJson.dependencies || {},
        )) {
          // Skip workspace dependencies and atmosphere-integrations
          if (
            version === 'workspace:*' ||
            dep.startsWith('@atmosphere-integrations/')
          ) {
            continue;
          }

          // If atmosphere has this dependency, check if we need to update
          if (atmosphereDeps[dep] && atmosphereDeps[dep] !== version) {
            try {
              // Handle non-semver versions
              if (
                !atmosphereDeps[dep].startsWith('^') &&
                !atmosphereDeps[dep].startsWith('~') &&
                !semver.valid(semver.clean(atmosphereDeps[dep]))
              ) {
                console.log(
                  `Warning: Skipping non-standard version for ${dep}: ${atmosphereDeps[dep]}`,
                );
                continue;
              }

              // Update integration dependency to match atmosphere
              console.log(
                `Updating ${dep} in ${integrationName}: ${version} → ${atmosphereDeps[dep]}`,
              );
              integrationPackageJson.dependencies[dep] = atmosphereDeps[dep];
              integrationChanged = true;
            } catch (e) {
              console.log(
                `Warning: Unable to update version for ${dep} in ${integrationName}: ${e.message}`,
              );
            }
          }
        }

        // Sort dependencies alphabetically
        if (integrationPackageJson.dependencies) {
          integrationPackageJson.dependencies = Object.fromEntries(
            Object.entries(integrationPackageJson.dependencies).sort((a, b) =>
              a[0].localeCompare(b[0]),
            ),
          );
        }

        // Save changes if necessary
        if (integrationChanged) {
          await fs.writeFile(
            integration.path,
            JSON.stringify(integrationPackageJson, null, 2),
          );
          console.log(`Updated dependencies in ${integrationName}`);
          integrationUpdates++;
        }
      }

      if (integrationUpdates > 0) {
        console.log(
          `\nUpdated dependencies in ${integrationUpdates} integration packages`,
        );
      } else {
        console.log('\nNo integration packages needed dependency updates');
      }
    }

    if (hasChanges || integrationUpdates > 0) {
      console.log('\nPlease run `pnpm install` to update the dependencies');
    }
  } catch (e) {
    console.error('Error syncing dependencies:', e);
  }
}

// Run the sync function if this script is called directly
if (require.main === module) {
  // Check for command line options
  const options = {
    bidirectional:
      !process.argv.includes('--one-way') &&
      !process.argv.includes('--reverse'),
    direction: process.argv.includes('--reverse') ? 'reverse' : 'normal',
  };

  syncDependencies(options);
}

module.exports = { syncDependencies };
