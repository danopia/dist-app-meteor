import { Meteor } from "meteor/meteor";

export function meteorCallAsync<T=unknown>(name: string, ...args: any[]) {
  return new Promise<T>((resolve, reject) =>
    Meteor.call(name, ...args, (error: unknown, result: T) => {
      if (error) return reject(error);
      resolve(result);
    })
  );
}
