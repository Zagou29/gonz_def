/* OS? */

/* Win Mac Linux Android like Mac */
const ua = navigator.userAgent;
const uaLow = ua.toLowerCase();

// iPad : "iPad" dans le UA (iPadOS <= 12) OU Mac + touchpoints > 1 (iPadOS 13+, M1/M2/M4...)
const isIpad =
  /iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);

const ordiOS = {
  win: ua.includes("Win"),
  mac: ua.includes("Mac"),
  linux: ua.includes("Linux"),
  android: ua.includes("Android"),
  ios: ua.includes("like Mac"),
  ipad: isIpad,
};
const mobile = {
  mob: uaLow.includes("mobi"),
};
const navigateur = {
  edge: uaLow.includes("edg"),
  opera: uaLow.includes("opr"),
  chrome: uaLow.includes("chrome"),
  chromeIos: uaLow.includes("crios"),
  firefox: uaLow.includes("firefox"),
  safari: uaLow.includes("safari") && !uaLow.includes("chrome"),
};
const ordi_OS = () => ordiOS;
const navig = () => navigateur;
const mob = () => mobile;
export { ordi_OS, navig, mob };
