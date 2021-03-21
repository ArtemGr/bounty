/**
 * binprint function converts binary data to a string
 * replacing non-readable characters by the given
 * "blank" character
 *
 * @param {string, Array, UInt8Array or ArrayBuffer} bin - binary data
 * @param {string} [blank='.'] - the blank character
 */
let binprint = (bin, blank = '.') => {
  let binArray;
  if (typeof bin === 'string' || bin instanceof String ) {
    binArray = bin.split('').map((c) => c.charCodeAt(0));
  } else if (bin instanceof Array || bin instanceof Uint8Array) {
    binArray = bin;
  } else if (bin instanceof ArrayBuffer) {
    binArray = new Uint8Array(bin);
  } else {
    throw new TypeError(
      '"bin" parameter of the "binprint" function must be string, Array, UInt8Array or ArrayBuffer'
      );
  }
  let blankCode = blank.charCodeAt(0);
  let printableArray = binArray.map((code) => code < 0x20 || code > 0x7F ? blankCode : code);
  return String.fromCharCode(... printableArray);
};
