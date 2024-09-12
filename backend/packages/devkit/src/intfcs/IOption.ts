export interface IOption<T> {
  isSome(): boolean;
  isNone(): boolean;
  getInner(): T;
  unwrap(): T;
}
