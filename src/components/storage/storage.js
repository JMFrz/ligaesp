// src/utils/storage.js
import localforage from "localforage";

export const getItem = async (key) => {
    return await localforage.getItem(key);
};

export const setItem = async (key, value) => {
    return await localforage.setItem(key, value);
};