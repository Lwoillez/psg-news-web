/** Applique `fn` à chaque élément de `items`, au plus `concurrency` en parallèle. */
export async function mapWithConcurrency<T>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<unknown>,
) {
  const queue = [...items];
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      let item: T | undefined;
      while ((item = queue.shift()) !== undefined) {
        await fn(item);
      }
    }),
  );
}
