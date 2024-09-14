import axios from 'axios';

import {Result} from '../devkit';

export class DatabaseClient {
  private readonly ENDPOINT = process.env.REACT_APP_DATABASE_ENDPOINT || '';

  constructor() {
    this.showAndThrowError = this.showAndThrowError.bind(this);
  }

  async query(q: string): Promise<Result<Record<string, any>[]>> {
    let result = await Result.fromExecutionAsync(async () => {
      const res = await axios.post(this.ENDPOINT, {q});
      return res.data;
    });
    result = result.errThen(this.showAndThrowError);
    return result;
  }

  private showAndThrowError(err: any): never {
    console.error(err);
    throw err;
  }
}
