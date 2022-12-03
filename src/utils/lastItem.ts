export default function lastItem<T = any>(items?: Array<T>) {
  return items?.slice(-1)?.[0];
}
