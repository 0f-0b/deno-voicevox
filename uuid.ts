const hexEncode: string[] = [];
{
  const alphabet = "0123456789abcdef";
  for (let i = 0; i < 256; i++) {
    hexEncode.push(alphabet[i >> 4] + alphabet[i & 0xf]);
  }
}

export function uuidFromBytes(bytes: Uint8Array): string {
  if (bytes.length !== 16) {
    throw new TypeError("Length of UUID must be 16 bytes");
  }
  return hexEncode[bytes[0]] + hexEncode[bytes[1]] +
    hexEncode[bytes[2]] + hexEncode[bytes[3]] + "-" +
    hexEncode[bytes[4]] + hexEncode[bytes[5]] + "-" +
    hexEncode[bytes[6]] + hexEncode[bytes[7]] + "-" +
    hexEncode[bytes[8]] + hexEncode[bytes[9]] + "-" +
    hexEncode[bytes[10]] + hexEncode[bytes[11]] +
    hexEncode[bytes[12]] + hexEncode[bytes[13]] +
    hexEncode[bytes[14]] + hexEncode[bytes[15]];
}

const uuidRE =
  /^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}$/;

export function uuidToBytes(uuid: string): Uint8Array {
  if (!uuidRE.test(uuid)) {
    throw new TypeError(`Invalid UUID: ${uuid}`);
  }
  const bytes = new Uint8Array(16);
  bytes[0] = parseInt(uuid.substring(0, 2), 16);
  bytes[1] = parseInt(uuid.substring(2, 4), 16);
  bytes[2] = parseInt(uuid.substring(4, 6), 16);
  bytes[3] = parseInt(uuid.substring(6, 8), 16);
  bytes[4] = parseInt(uuid.substring(9, 11), 16);
  bytes[5] = parseInt(uuid.substring(11, 13), 16);
  bytes[6] = parseInt(uuid.substring(14, 16), 16);
  bytes[7] = parseInt(uuid.substring(16, 18), 16);
  bytes[8] = parseInt(uuid.substring(19, 21), 16);
  bytes[9] = parseInt(uuid.substring(21, 23), 16);
  bytes[10] = parseInt(uuid.substring(24, 26), 16);
  bytes[11] = parseInt(uuid.substring(26, 28), 16);
  bytes[12] = parseInt(uuid.substring(28, 30), 16);
  bytes[13] = parseInt(uuid.substring(30, 32), 16);
  bytes[14] = parseInt(uuid.substring(32, 34), 16);
  bytes[15] = parseInt(uuid.substring(34), 16);
  return bytes;
}
