/* OS? */

/* Win Mac Linux Android like Mac */
const ua = navigator.userAgent;
const uaLow = ua.toLowerCase();

// iPad : "iPad" dans le UA (iPadOS <= 12) OU Mac + touchpoints > 1 (iPadOS 13+, M1/M2/M4...)
const isIpad =
  /iPad/.test(ua) ||
  (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);

const ordiOS = {
  win: ua.indexOf("Win") > 0,
  mac: ua.indexOf("Mac") > 0,
  linux: ua.indexOf("Linux") > 0,
  android: ua.indexOf("Android") > 0,
  ios: ua.indexOf("like Mac") > 0,
  ipad: isIpad,
};
const mobile = {
  mob: uaLow.indexOf("mobi") > 0,
};
const navigateur = {
  edge: uaLow.indexOf("edg") > 0,
  opera: uaLow.indexOf("opr") > 0,
  chrome: uaLow.indexOf("chrome") > 0,
  chromeIos: uaLow.indexOf("crios") > 0,
  firefox: uaLow.indexOf("firefox") > 0,
  safari: uaLow.indexOf("safari") > 0 && uaLow.indexOf("chrome") < 0,
};
const ordi_OS = () => ordiOS;
const navig = () => navigateur;
const mob = () => mobile;
export { ordi_OS, navig, mob };
