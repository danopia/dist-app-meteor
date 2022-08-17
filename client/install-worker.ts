import { Meteor } from 'meteor/meteor'

Meteor.startup(async () => {
  try {
    await navigator.serviceWorker.register('/serviceworker.js');
    console.info('service worker registered');
  } catch (error) {
    console.log('ServiceWorker registration failed: ', error);
  }
});
