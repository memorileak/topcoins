import {EvaluatorConfig} from '../impls/EvaluatorConfig';

export type EvaluatorConfigRaw = Omit<EvaluatorConfig, 'fill' | 'isFilled'>;
