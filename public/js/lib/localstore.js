var localstore = {
	storageName: '',
	storageData: [],
	load: () => {
		let storage = JSON.parse(localStorage.getItem(localstore.storageName));
		if (storage) {
			for (let i = 0; i < localstore.storageData.length; i++) {
				localstore[localstore.storageData[i]] =
					storage[localstore.storageData[i]];
			}
		}
	},
	save: () => {
		let storage = {};
		for (let i = 0; i < localstore.storageData.length; i++) {
			storage[localstore.storageData[i]] =
				localstore[localstore.storageData[i]];
		}
		localStorage.setItem(localstore.storageName, JSON.stringify(storage));
	},
	addValue: (name, value) => {
		localstore[name] = value;
		localstore.storageData.push(name);
		localstore.save();
	},
	removeValue: (name) => {
		localstore[name] = null;
		let index = localstore.storageData.indexOf(name);
		localstore.storageData.splice(index, 1);
		localstore.save();
	},
	resetStorage: () => {
		localStorage.removeItem(localstore.storageName);
		location.href = location.href;
	},
	init: (params) => {
		localstore.storageName = params.storageName;
		let extraStorage = [];
		Object.keys(params.extraStorage).forEach((storageItem) => {
			extraStorage.push(storageItem);
		});
		if (extraStorage.length > 0) {
			localstore.storageData = localstore.storageData.concat(extraStorage);
		}
		if (localStorage.getItem(localstore.storageName)) {
			localstore.storageData = Object.keys(
				JSON.parse(localStorage.getItem(localstore.storageName))
			);
			localstore.load();
			return;
		} else {
			for (let i = 0; i < localstore.storageData.length; i++) {
				localstore[localstore.storageData[i]] =
					params.extraStorage[localstore.storageData[i]];
			}
		}
	}
};
