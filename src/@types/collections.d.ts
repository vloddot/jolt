type CollectionItem<T> = [
	import('solid-js/store').Store<T>,
	import('solid-js/store').SetStoreFunction<T>
];
