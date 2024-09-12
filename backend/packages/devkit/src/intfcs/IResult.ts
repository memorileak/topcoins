export interface IResult<T> {
  isOk(): boolean;
  isErr(): boolean;
  getInner(): T;
  unwrap(): T;
}
