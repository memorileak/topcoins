import {asClass, Lifetime} from 'awilix';

import {container} from './container';
import {DatabaseClient} from './DatabaseClient';
import {PriceDataSource} from './PriceDataSource';

export enum Services {
  DatabaseClient = 'databaseClient',
  PriceDataSource = 'priceDataSource',
}

container.register({
  [Services.DatabaseClient]: asClass(DatabaseClient, {lifetime: Lifetime.SINGLETON}),
  [Services.PriceDataSource]: asClass(PriceDataSource, {lifetime: Lifetime.SINGLETON}),
});

export function inject<T>(serviceName: Services): T {
  return container.resolve<T>(serviceName);
}
