import {DbExposerConfig} from '../impls/DbExposerConfig';

export type DbExposerConfigRaw = Omit<DbExposerConfig, 'fill' | 'isFilled'>;
