import {PriceTrackerConfig} from '../impls/PriceTrackerConfig';

export type PriceTrackerConfigRaw = Omit<PriceTrackerConfig, 'fill' | 'isFilled'>;
