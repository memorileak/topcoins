import {IResult} from '../intfcs/IResult';
import {Option} from './Option';

class Ok<T> implements IResult<T> {
  static new<T>(data: T): Ok<T> {
    return new Ok(data);
  }

  private data: T;

  private constructor(data: T) {
    this.data = data;
  }

  isOk(): boolean {
    return true;
  }

  isErr(): boolean {
    return false;
  }

  getInner(): T {
    return this.data;
  }

  unwrap(): T {
    return this.data;
  }
}

class Err<E> implements IResult<E> {
  static new<E>(err: E) {
    return new Err(err);
  }

  private err: E;

  constructor(err: E) {
    this.err = err;
  }

  isOk(): boolean {
    return false;
  }

  isErr(): boolean {
    return true;
  }

  getInner(): E {
    return this.err;
  }

  unwrap(): E {
    throw this.err;
  }
}

export class Result<T> implements IResult<T> {
  static ok<T>(data: T): Result<T> {
    return new Result(Ok.new(data));
  }

  static err<E>(error: E): Result<E> {
    return new Result(Err.new(error));
  }

  static fromExecution<T>(task: () => T): Result<T> {
    try {
      return new Result(Ok.new(task()));
    } catch (err: any) {
      return new Result(Err.new(err));
    }
  }

  static async fromExecutionAsync<T>(task: () => Promise<T>): Promise<Result<T>> {
    try {
      const taskResult = await task();
      return new Result(Ok.new(taskResult));
    } catch (err: any) {
      return new Result(Err.new(err));
    }
  }

  private result: IResult<T>;

  constructor(result: IResult<T>) {
    this.result = result;
  }

  isOk(): boolean {
    return this.result.isOk();
  }

  isErr(): boolean {
    return this.result.isErr();
  }

  getInner(): T {
    return this.result.getInner();
  }

  // Throw error if the inner result is Err
  unwrap(): T {
    return this.result.unwrap();
  }

  // Return default value if inner result is Err
  unwrapOr(defaultValue: T): T {
    if (this.result.isOk()) {
      return this.result.unwrap();
    } else {
      return defaultValue;
    }
  }

  okThen<U>(task: (inner: T) => U): Result<U | T> {
    if (this.result.isOk()) {
      return Result.fromExecution(() => task(this.result.getInner()));
    } else {
      return this;
    }
  }

  errThen<U>(task: (inner: T) => U): Result<U | T> {
    if (this.result.isErr()) {
      return Result.fromExecution(() => task(this.result.getInner()));
    } else {
      return this;
    }
  }

  async okThenAsync<U>(task: (inner: T) => Promise<U>): Promise<Result<U | T>> {
    if (this.result.isOk()) {
      return Result.fromExecutionAsync(() => task(this.result.getInner()));
    } else {
      return this;
    }
  }

  async errThenAsync<U>(task: (inner: T) => Promise<U>): Promise<Result<U | T>> {
    if (this.result.isErr()) {
      return Result.fromExecutionAsync(() => task(this.result.getInner()));
    } else {
      return this;
    }
  }

  intoOption(): Option<T> {
    if (this.result.isOk()) {
      return Option.some(this.result.unwrap());
    } else {
      return Option.none();
    }
  }

  flatten<LeafT>(): Result<LeafT> {
    return Result.fromExecution(() => {
      let result: any = this.result;
      while (result instanceof Result || result instanceof Ok || result instanceof Err) {
        result = result.unwrap();
      }
      return result as LeafT;
    });
  }
}
