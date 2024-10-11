import axios from 'axios';
import {Either, left, orElseW} from 'fp-ts/Either';
import {tryCatch} from 'fp-ts/TaskEither';

export type QueryOutput = Record<string, any>[];

export class DatabaseClient {
  private readonly ENDPOINT = process.env.REACT_APP_DATABASE_ENDPOINT || '';

  constructor() {
    this.showAndReturnErr = this.showAndReturnErr.bind(this);
  }

  async query(q: string): Promise<Either<unknown, QueryOutput>>;
  async query(q: string[]): Promise<Either<unknown, QueryOutput[]>>;
  async query(q: string | string[]): Promise<Either<unknown, QueryOutput | QueryOutput[]>> {
    let either = await tryCatch<unknown, QueryOutput | QueryOutput[]>(
      async () => {
        const res = await axios.post(this.ENDPOINT, {q});
        return res.data;
      },
      (err) => err,
    )();
    orElseW(this.showAndReturnErr)(either);
    return either;
  }

  private showAndReturnErr(err: any): Either<unknown, never> {
    console.error(err);
    return left(err);
  }
}
