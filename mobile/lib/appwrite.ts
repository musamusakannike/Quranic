import { Client, Account, TablesDB, Functions, ID } from 'react-native-appwrite';
import 'react-native-url-polyfill/auto';

const APPWRITE_ENDPOINT = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT ?? '';
const APPWRITE_PROJECT_ID = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID ?? '';

export const appwriteClient = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);

export const appwriteAccount = new Account(appwriteClient);
export const appwriteTablesDB = new TablesDB(appwriteClient);
export const appwriteFunctions = new Functions(appwriteClient);

export { ID };
