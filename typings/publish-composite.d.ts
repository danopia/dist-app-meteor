declare module 'meteor/reywood:publish-composite' {
	import type { Mongo } from 'meteor/mongo';

	interface IOptions<T> {
		find(): Mongo.Cursor<T>;
		children?: INestedOptions<T,{}>[];
		collectionName?: string;
	}
	interface INestedOptions<T,U> {
		find(context: T): Mongo.Cursor<U>;
		children?: INestedOptions<U, {}>[];
		collectionName?: string;
	}

	// type NestType<T,U e NestType> = {
	// 	self: T;
	// 	children: NestType<U>
	// }

	interface IOptions<T> {
		find(): Mongo.Cursor<T>;
		children?: INestedOptions<T>[];
		collectionName?: string;
	}
	interface INestedOptions<T,U=unknown> {
		find(context: T): Mongo.Cursor<U>;
		children?: INestedOptions<U, {}>[];
		collectionName?: string;
	}

	function publishComposite<T>(name: string, options: IOptions<T>): void;
	function publishComposite<T>(name: string, options: (...args: unknown[]) => IOptions<T>): void;
}
