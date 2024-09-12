import {PriceCrawlerConfig} from '../impls/PriceCrawlerConfig';

export type PriceCrawlerConfigRaw = Omit<PriceCrawlerConfig, 'fill' | 'isFilled'>;
