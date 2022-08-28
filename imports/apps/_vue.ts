import { stripIndent } from "common-tags";

export const useVueState = stripIndent`
  async function getState(key) {
    const resp = await distApp.fetch('/task/state/'+encodeURIComponent(key), {
      method: 'GET',
      headers: {
        'accept': 'application/json',
      },
    });
    if (resp.status == 404) return null;
    if (!resp.ok) throw new Error("HTTP gateway gave its own "+resp.status+" response");
    return await resp.json();
  }
  async function setState(key, data) {
    const resp = await distApp.fetch('/task/state/'+encodeURIComponent(key), {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: {
        'content-type': 'application/json',
      },
    });
    if (!resp.ok) throw new Error("HTTP gateway gave its own "+resp.status+" response");
    // return await resp.json();
  }

  async function useVueState(key, initialData) {
    const restoredData = await getState(key);
    // console.log('prev state:', restoredData);
    const reactiveData = reactive(restoredData ?? initialData);
    watchEffect(() => {
      // console.log('new state:', JSON.stringify(reactiveData));
      setState(key, reactiveData);
    });
    return () => reactiveData;
  }
`;
