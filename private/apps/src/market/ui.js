
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
  },
});

app.mount('body');
