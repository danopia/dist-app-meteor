
import { createApp, reactive, watchEffect } from "https://unpkg.com/vue@3.2.37/dist/vue.esm-browser.js";
const distApp = await DistApp.connect();
"useVueState";

const state = await useVueState('state', {
  selectedApp: null,
});

const app = createApp({
  data: () => ({
    loading: false,
    listings: [],
    profiles: [],
    state: state(),
  }),
  created() {
    this.loadListings().then(() => distApp.reportReady());
  },
  methods: {
    async loadListings() {
      this.loading = true;
      const {listings, profiles} = await distApp.fetch('/ApiBinding/host/list-available-apps').then(x => x.json());
      this.listings = listings;
      this.profiles = profiles;
      this.loading = false;
    },
    selectedAppHasInstallations(profileNamespace) {
      // console.log({currentInstallations: this.state.selectedApp?.currentInstallations})
      return this.state.selectedApp?.currentInstallations.some(x => x.profileNamespace == profileNamespace);
      // currentInstallations: [{
      //   profileNamespace: 'profile:guest',
      //   appInstallName: `bundledguestapp-${id}`,
      // }],
    },
    async openApp(profileNamespace) {
      const firstInstall = this.state.selectedApp?.currentInstallations.find(x => x.profileNamespace == profileNamespace);
      if (!firstInstall) throw new Error(`BUG: no firstInstall found`);
      distApp.launchIntent({
        receiverRef: `entity://${firstInstall.profileNamespace}/profile.dist.app@v1alpha1/AppInstallation/${firstInstall.appInstallName}`,
        action: 'app.dist.Main',
        category: 'app.dist.Launcher',
        // data: '/profile@v1alpha1/AppInstallation/bundledguestapp-app:welcome',
      });
    },
    async installApp(profileNamespace) {
      distApp.launchIntent({
        dataRef: this.state.selectedApp.url,
        action: 'app.dist.InstallApp',
        category: 'app.dist.Default',
        extras: {
          'target-profile': profileNamespace,
        },
        // data: '/profile@v1alpha1/AppInstallation/bundledguestapp-app:welcome',
      });
    },
  },
});

app.mount('body');
