
import { createApp, reactive, watchEffect } from "https://unpkg.com/vue@3.2.37/dist/vue.esm-browser.js";
const distApp = await DistApp.connect();
"useVueState";

const state = await useVueState('state', {
  selectedApp: null,
});

const app = createApp({
  data: () => ({
    listings: [{
      id: 'bundled:scaleway',
      url: 'bundled:'+encodeURIComponent('app:scaleway'),
      // url: 'https://dist.app/bin/scaleway@v1alpha1.yaml',
      // url: 'https://gist.githubusercontent.com/danopia/cd69add8cbbd7e5ff7603b8f3d372f26/raw/a8091b594fe961d9e637d2a6037e276b01c1d15f/scaleway.yaml',
      title: 'Scaleway Instances Remote',
      description: 'Toggle Scaleway servers on/off',
      iconUrl: 'https://cdn.european-alternatives.eu/productLogo/342ca056-82e4-45b7-9710-9dc5b72dfaa9/Scaleway-Logo-Purple-RGB.svg',
    }, {
      id: 'bundled:kubernetes',
      url: 'bundled:'+encodeURIComponent('app:kubernetes'),
      title: 'Kubernetes Client',
      description: 'Provides access to Kubernetes cluster resources',
      iconUrl: 'https://i.imgur.com/w02gE4N.png',
    }, {
      id: 'bundled:notion',
      url: 'bundled:'+encodeURIComponent('app:notion'),
      title: 'Notion Developer API',
      description: 'Provides access to Kubernetes cluster resources',
      iconUrl: 'data:image/svg+xml,%3Csvg width="800" height="600" fill="none" version="1.1" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg"%3E%3Cg transform="translate(0,28)"%3E%3Cpath d="m253.56 15.092 193.67-14.294c23.783-2.0444 29.902-.675 44.85 10.208l61.821 43.548c10.201 7.4886 13.601 9.5274 13.601 17.691v238.85c0 14.969-5.441 23.822-24.463 25.176l-224.91 13.612c-14.279.682-21.075-1.357-28.553-10.89l-45.526-59.2c-8.1578-10.897-11.55-19.049-11.55-28.588v-212.3c0-12.241 5.4422-22.452 21.059-23.807z" fill="%23fff"/%3E%3Cpath d="m447.23.7982-193.67 14.294c-15.616 1.3555-21.059 11.566-21.059 23.807v212.3c0 9.539 3.3923 17.691 11.55 28.588l45.526 59.2c7.478 9.533 14.274 11.572 28.553 10.89l224.91-13.612c19.022-1.354 24.463-10.207 24.463-25.176v-238.85c0-7.7378-3.055-9.973-12.06-16.562-.49598-.3625-1.009-.7382-1.541-1.1287l-61.821-43.548c-14.948-10.883-21.067-12.252-44.85-10.208zm-124 67.53c-18.361 1.2427-22.533 1.525-32.96-6.9652l-26.516-21.094c-2.7044-2.7277-1.348-6.1302 5.4417-6.8051l186.18-13.611c15.624-1.3639 23.776 4.0887 29.895 8.8497l31.932 23.138c1.36.6776 4.751 4.7553.673 4.7553l-192.27 11.572c-.802.0536-1.578.1061-2.331.1571l-.026.002zm-21.416 240.72v-202.77c0-8.844 2.718-12.93 10.867-13.617l220.82-12.924c7.49-.68 10.882 4.086 10.882 12.924v201.41c0 8.852-1.363 16.348-13.598 17.022l-211.31 12.255c-12.229.674-17.662-3.402-17.662-14.3zm208.6-191.9c1.355 6.13 0 12.255-6.127 12.944l-10.182 2.033v149.7c-8.839 4.762-16.991 7.485-23.784 7.485-10.875 0-13.599-3.405-21.745-13.606l-66.597-104.79v101.39l21.074 4.767s0 12.242-17.002 12.242l-46.872 2.725c-1.362-2.725 0-9.524 4.754-10.887l12.232-3.397v-134.05l-16.983-1.364c-1.362-6.13 2.03-14.969 11.549-15.655l50.283-3.397 69.307 106.15v-93.908l-17.67-2.033c-1.357-7.494 4.071-12.935 10.867-13.61z" clip-rule="evenodd" fill="%23000" fill-rule="evenodd"/%3E%3C/g%3E%3Cpath d="m584.21 564.09h23.308v-59.868c0-15.132 8.741-24.718 22.65-24.718 14.193 0 20.773 7.895 20.773 23.59v60.996h23.31v-66.541c0-24.53-12.5-38.346-35.436-38.346-15.32 0-25.658 7.049-30.545 18.515h-1.598v-16.447h-22.462zm-63.309 2.068c30.733 0 49.436-20.113 49.436-53.477 0-33.271-18.797-53.478-49.436-53.478-30.545 0-49.436 20.301-49.436 53.478 0 33.364 18.609 53.477 49.436 53.477zm0-19.549c-16.259 0-25.564-12.406-25.564-33.928 0-21.429 9.305-33.929 25.564-33.929 16.166 0 25.47 12.5 25.47 33.929 0 21.522-9.21 33.928-25.47 33.928zm-86.898 17.481h23.214v-102.82h-23.214zm11.56-119.83c7.707 0 13.91-6.203 13.91-14.004s-6.203-14.098-13.91-14.098c-7.613 0-13.91 6.297-13.91 14.098s6.297 14.004 13.91 14.004zm-70.733-8.177v25.846h-16.259v18.609h16.259v56.109c0 19.925 9.398 27.913 32.989 27.913 4.511 0 8.834-.47 12.218-1.128v-18.233c-2.82.282-4.606.47-7.895.47-9.774 0-14.098-4.511-14.098-14.661v-50.47h21.993v-18.609h-21.993v-25.846zm-70.733 130.08c30.733 0 49.436-20.113 49.436-53.477 0-33.271-18.797-53.478-49.436-53.478-30.545 0-49.436 20.301-49.436 53.478 0 33.364 18.609 53.477 49.436 53.477zm0-19.549c-16.26 0-25.564-12.406-25.564-33.928 0-21.429 9.304-33.929 25.564-33.929 16.165 0 25.47 12.5 25.47 33.929 0 21.522-9.211 33.928-25.47 33.928zm-154.94 17.481v-92.293h1.598l66.541 92.293h20.959v-135.62h-23.308v92.199h-1.598l-66.541-92.199h-21.053v135.62z" fill="%23000"/%3E%3C/svg%3E',
    }],
    state: state(),
  }),
  methods: {
    setAppId(id) {
      this.state.selectedApp = id;
    },
    // sendRequest: async function () {
    //   const historyEntry = reactive({
    //     request: JSON.parse(JSON.stringify(this.request)),
    //     response: null,
    //     error: null,
    //     pending: true,
    //     started: new Date(),
    //   });
    //   if (['GET', 'HEAD', 'DELETE'].includes(historyEntry.request.method)) {
    //     historyEntry.request.body = null;
    //   }
    //   this.history.unshift(historyEntry);

    //   try {
    //     if (historyEntry.request.url.startsWith('internal:')) {
    //       historyEntry.response = await sendInternalRequest(historyEntry.request);
    //     } else {
    //       historyEntry.response = await sendInternetRequest(historyEntry.request);
    //     }
    //     historyEntry.pending = false;
    //   } catch (err) {
    //     console.error(err.stack);
    //     historyEntry.pending = false;
    //     historyEntry.error = {
    //       stack: err.message,
    //     };
    //   }

    //   // setTimeout(() => {
    //   //   output.style.height = output.scrollHeight+'px';
    //   // }, 0);
    // },
  },
});

app.mount('body');
await distApp.reportReady();
