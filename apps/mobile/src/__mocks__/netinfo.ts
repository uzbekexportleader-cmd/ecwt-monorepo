/** Testlarda tarmoq doim ulangan deb hisoblanadi. */
const NetInfo = {
  addEventListener(): () => void {
    return () => {};
  },
  async fetch() {
    return { isConnected: true, isInternetReachable: true };
  },
};
export default NetInfo;
