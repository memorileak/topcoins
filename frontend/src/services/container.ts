import * as awilix from 'awilix';

// Create the container and set the injectionMode to PROXY (which is also the default).
// Enable strict mode for extra correctness checks (highly recommended).
export const container = awilix.createContainer({
  injectionMode: awilix.InjectionMode.PROXY,
  strict: true,
});
