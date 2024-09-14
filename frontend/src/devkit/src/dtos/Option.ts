/* eslint-disable */
import {IOption} from '../intfcs/IOption';
import {Result} from './Result';

class Some<T> implements IOption<T> {
  static new<T>(data: T): Some<T> {
    return new Some(data);
  }

  private data: T;

  constructor(data: T) {
    this.data = data;
  }

  isSome(): boolean {
    return true;
  }

  isNone(): boolean {
    return false;
  }

  getInner(): T {
    return this.data;
  }

  unwrap(): T {
    return this.data;
  }
}

class None implements IOption<any> {
  static new() {
    return new None();
  }

  isSome(): boolean {
    return false;
  }

  isNone(): boolean {
    return true;
  }

  getInner(): any {
    return;
  }

  unwrap(): any {
    throw new Error('None Unwrapped');
  }
}

export class Option<T> implements IOption<T> {
  static some<T>(value: T): Option<T> {
    return new Option(Some.new(value));
  }

  static none(): Option<any> {
    return new Option(None.new());
  }

  private option: IOption<T>;

  constructor(option: IOption<T>) {
    this.option = option;
  }

  isSome(): boolean {
    return this.option.isSome();
  }

  isNone(): boolean {
    return this.option.isNone();
  }

  getInner(): T {
    return this.option.getInner();
  }

  // Throw error if the inner result is None
  unwrap(): T {
    return this.option.unwrap();
  }

  // Return default value if inner result is None
  unwrapOr(defaultValue: T): T {
    if (this.option.isSome()) {
      return this.option.unwrap();
    } else {
      return defaultValue;
    }
  }

  someThen<U>(task: (inner: T) => U): Option<Result<U | T>> {
    if (this.option.isSome()) {
      return Option.some(Result.fromExecution(() => task(this.option.getInner())));
    } else {
      return Option.some(Result.ok(this.getInner()));
    }
  }

  noneThen<U>(task: () => U): Option<Result<U | T>> {
    if (this.option.isNone()) {
      return Option.some(Result.fromExecution(() => task()));
    } else {
      return Option.some(Result.ok(this.getInner()));
    }
  }

  async someThenAsync<U>(task: (inner: T) => Promise<U>): Promise<Option<Result<U | T>>> {
    if (this.option.isSome()) {
      const result = await Result.fromExecutionAsync(() => task(this.option.getInner()));
      return Option.some(result);
    } else {
      return Option.some(Result.ok(this.getInner()));
    }
  }

  async noneThenAsync<U>(task: () => Promise<U>): Promise<Option<Result<U | T>>> {
    if (this.option.isNone()) {
      const result = await Result.fromExecutionAsync(() => task());
      return Option.some(result);
    } else {
      return Option.some(Result.ok(this.getInner()));
    }
  }

  flatten<LeafT>(): Option<LeafT> {
    return Result.fromExecution(() => {
      let option: any = this.option;
      while (option instanceof Option || option instanceof Some || option instanceof None) {
        option = option.unwrap();
      }
      return option as LeafT;
    }).intoOption();
  }
}
