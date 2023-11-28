const fieldBits = 8;
const maxShares = 255;
const calculatedLogarithms = [];
const calculatedExponents = [];

let x = 1;
for (let i = 0; i < 256; i++) {
  calculatedExponents[i] = x;
  calculatedLogarithms[x] = i;
  x = x << 1;
  if (x & 256) {
    x ^= Number('0x11d');
  }
}

let zeroPadding = new Array(1024).join('0');

const helpers = {
  strings: {
    hexadecimalToBinary: function(hexString) {
      let binaryString = '';

      for (let i = hexString.length - 1; i >= 0; i--) {
        let num = parseInt(hexString[i], 16);
        binaryString = helpers.strings.padLeft(num.toString(2), 4) + binaryString;
      }
      return binaryString;
    },

    binaryToHexadecimal: function(binaryString) {
      let hexadecimalString = '';
      binaryString = helpers.strings.padLeft(binaryString, 4);
      for (let i = binaryString.length; i >= 4; i -= 4) {
        let num = parseInt(binaryString.slice(i - 4, i), 2);
        hexadecimalString = num.toString(16) + hexadecimalString;
      }
      return hexadecimalString;
    },

    padLeft: function(stringToPad, multipleOfBits = fieldBits) {
      let bitsToPad;
      if (multipleOfBits === 0 || multipleOfBits === 1)
        return stringToPad;
      if (stringToPad)
        bitsToPad = stringToPad.length % multipleOfBits;
      if (bitsToPad)
        return (zeroPadding + stringToPad).slice(-(multipleOfBits - bitsToPad + stringToPad.length));
      return stringToPad;
    },

    splitNumStringToIntArray: function(stringToSplit, padLength) {
      let parts = [];
      let i;
      if (padLength)
        stringToSplit = helpers.strings.padLeft(stringToSplit, padLength);
      for (i = stringToSplit.length; i > fieldBits; i -= fieldBits)
        parts.push(parseInt(stringToSplit.slice(i - fieldBits, i), 2));
      parts.push(parseInt(stringToSplit.slice(0, i), 2));
      return parts;
    }
  },
  shareOperations: {
    extractShareComponents: function(share) {
      let id;

      // Extract each part of the share
      let shareComponents = /^([a-fA-F\d]{2})([a-fA-F\d]+)$/.exec(share);

      // The ID is a Hex number and needs to be converted to an Integer
      if (shareComponents) {
        id = parseInt(shareComponents[1], 16);
      }

      if (typeof id !== 'number' || id % 1 !== 0 || id < 1 || id > maxShares) {
        throw new Error(`Invalid share : Share id must be an integer between 1 and ${maxShares}, inclusive.`);
      }

      if (shareComponents && shareComponents[2]) {
        return {
          id: id,
          data: shareComponents[2]
        };
      }

      throw new Error(`The share data provided is invalid : ${share}`);
    },

    calculateRandomizedShares: function (secret, totalShares, requiredShares) {
      let shares = [];
      let coefficients = [secret];

      // Pick random coefficients for our polynomial function
      for (let i = 1; i < requiredShares; i++) {
        coefficients[i] = parseInt(helpers.crypto.getRandomBinaryString(fieldBits), 2);
      }

      // Calculate the y value of each share based on f(x) when using our new random polynomial function
      for (let i = 1, len = totalShares + 1; i < len; i++) {
        shares[i - 1] = {
          x: i,
          y: helpers.crypto.calculateFofX(i, coefficients)
        };
      }

      return shares;
    }
  },
  crypto: {
    /**
     * Given some coefficients representing a polynomial function, this calculates the value f(x)
     * @param x {Number} Integer position
     * @param coefficients
     * @returns {number}
     */
    calculateFofX: function(x, coefficients) {
      const logX = calculatedLogarithms[x];
      let fx = 0;

      for (let i = coefficients.length - 1; i >= 0; i--) {
        if (fx !== 0) {
          fx = calculatedExponents[(logX + calculatedLogarithms[fx]) % maxShares] ^ coefficients[i];
        } else {
          // if f(0) then we just return the coefficient as it's just equivalent to the Y offset. Using the exponent table would result
          // in an incorrect answer
          fx = coefficients[i];
        }
      }

      return fx;
    },

    /**
     * Lagrange interpolation, evaluate at 0
     */
    lagrange: function (x, y) {
      let sum = 0;

      for (let i = 0; i < x.length; i++) {
        if (y[i]) {

          let product = calculatedLogarithms[y[i]];

          for (let j = 0; j < x.length; j++) {
            if (i !== j) {
              product = (product + calculatedLogarithms[0 ^ x[j]] - calculatedLogarithms[x[i] ^ x[j]] + maxShares) % maxShares;
            }
          }

          // undefined ^ anything = anything in Node.js
          sum = sum ^ calculatedExponents[product];
        }
      }

      return sum;
    },

    getRandomBinaryString: function (bits) {
      let string = '';

      while (string === '') {
        for (let i = 0; i < bits; ++i) {
            string += Math.floor(Math.random() * Math.floor(2));
        }
    
        if ((string.match(/0/g) || []).length === string.length) {
          string = '';
        }
      }

      return string;
    }
  }
};

let Shamir = {
  generateShares: function(secret, totalShares, requiredShares, padLength) {
    let neededBits;
    let subShares;
    let x = new Array(totalShares);
    let y = new Array(totalShares);

    padLength = padLength || 128;

    if (typeof secret !== 'string') {
      throw new Error('Secret must be a string.');
    }

    if (typeof totalShares !== 'number' || totalShares % 1 !== 0 || totalShares < 2) {
      throw new Error(`Number of shares must be an integer between 2 and 2^bits-1 (${maxShares}), inclusive.`);
    }

    if (totalShares > maxShares) {
      neededBits = Math.ceil(Math.log(totalShares + 1) / Math.LN2);
      throw new Error(`Number of shares must be an integer between 2 and 2^bits-1 (${maxShares}), inclusive. To create ${totalShares} shares, use at least ${neededBits} bits.`);
    }

    if (typeof requiredShares !== 'number' || requiredShares % 1 !== 0 || requiredShares < 2) {
      throw new Error(`Threshold number of shares must be an integer between 2 and 2^bits-1 (${maxShares}), inclusive.`);
    }

    if (requiredShares > maxShares) {
      neededBits = Math.ceil(Math.log(requiredShares + 1) / Math.LN2);
      throw new Error(`Threshold number of shares must be an integer between 2 and 2^bits-1 (${maxShares}), inclusive.  To use a threshold of ${requiredShares}, use at least ${neededBits} bits.`);
    }

    if (requiredShares > totalShares) {
      throw new Error(`Threshold number of shares was ${requiredShares} but must be less than or equal to the ${totalShares} shares specified as the total to generate.`);
    }

    if (typeof padLength !== 'number' || padLength % 1 !== 0 || padLength < 0 || padLength > 1024) {
      throw new Error('Zero-pad length must be an integer between 0 and 1024 inclusive.');
    }

    secret = '1' + helpers.strings.hexadecimalToBinary(secret);
    secret = helpers.strings.splitNumStringToIntArray(secret, padLength);

    for (let i = 0; i < secret.length; i++) {
      subShares = helpers.shareOperations.calculateRandomizedShares(secret[i], totalShares, requiredShares);
      for (let j = 0; j < totalShares; j++) {
        x[j] = x[j] || subShares[j].x.toString(16);
        y[j] = helpers.strings.padLeft(subShares[j].y.toString(2)) + (y[j] || '');
      }
    }

    for (let i = 0; i < totalShares; i++) {
      let shareId = x[i];
      let integerShareId = parseInt(shareId, 16);

      if (typeof integerShareId !== 'number' || integerShareId % 1 !== 0 || integerShareId < 1 || integerShareId > maxShares) {
        throw new Error(`Share id must be an integer between 1 and ${maxShares}, inclusive.`);
      }

      shareId = helpers.strings.padLeft(shareId, 2);
      x[i] = shareId + helpers.strings.binaryToHexadecimal(y[i]);
    }

    return x;
  },


  /**
   * Combine a given array of shares to derive the original secret
   */
  deriveSecret: function(shares) {
    let result = '';
    let x = [];
    let y = [];

    for (let i = 0; i < shares.length; i++) {
      let share = helpers.shareOperations.extractShareComponents(shares[i]);

      // Only process this if we don't already have this share
      if (x.indexOf(share.id) === -1) {
        x.push(share.id);
        let splitShare = helpers.strings.splitNumStringToIntArray(helpers.strings.hexadecimalToBinary(share.data));
        for (let j = 0; j < splitShare.length; j++) {
          y[j] = y[j] || [];
          y[j][x.length - 1] = splitShare[j];
        }
      }
    }

    for (let i = 0; i < y.length; i++) {
      result = helpers.strings.padLeft(helpers.crypto.lagrange(x, y[i]).toString(2)) + result;
    }

    return helpers.strings.binaryToHexadecimal(result.slice(result.indexOf('1') + 1));
  }
};


// RETURNS HEX ENCODED SECRET using given shares
export const encodeSecret = (secret, totalShares, requiredShares) => {
    let hexSecret = Buffer.from(secret).toString('hex');
    return Shamir.generateShares(hexSecret, totalShares, requiredShares);
}

// RETURNS HEX DECODED SECRET using given shares
export const decodeSecret = (shares) => {
    return Shamir.deriveSecret(shares);
}
