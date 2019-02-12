export function isSupportedBrowser(global) {
  // Chrome M73, 74, 75 only
  const isChromeInOriginTrial =
    /Chrome\/(?<ver>7([345]))\./.test(global.navigator.userAgent);
  const hasAPIs = [
    'RTCQuicTransport',
    'RTCIceTransport',
    'RTCQuicStream',
  ].every(key => key in global);

  return hasAPIs && isChromeInOriginTrial;
}

// from https://developers.google.com/web/updates/2012/06/How-to-convert-ArrayBuffer-to-and-from-String
export function ab2str(buf) {
  return String.fromCharCode.apply(null, new Uint16Array(buf));
}

export function str2ab(str) {
  const buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
  const bufView = new Uint16Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}
