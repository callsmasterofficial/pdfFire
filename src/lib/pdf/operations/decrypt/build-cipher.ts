/**
 * Chooses the decryption method for a document and validates the password.
 *
 * Each supported revision gets its own cipher; anything else is declined by
 * name rather than attempted, so an unfamiliar handler can never produce a
 * plausible-looking but wrong document.
 */
import {
  aesV2Cipher,
  aesV3Cipher,
  rc4Cipher,
  type DocumentCipher,
} from "../../crypto/document-cipher";
import { recoverLegacyFileKey } from "../../crypto/legacy-security";
import {
  recoverFileKey,
  UnsupportedEncryptionError,
  WrongPasswordError,
  type EncryptionDictionary,
} from "../../crypto/standard-security";

function legacyCipher(dict: EncryptionDictionary, fileKey: Uint8Array): DocumentCipher {
  if (dict.v === 1 || dict.v === 2) return rc4Cipher(fileKey);

  // V4 names its crypt filter; only AESV2 and V2 (RC4) are defined for it.
  if (dict.streamFilterMethod === "AESV2") return aesV2Cipher(fileKey);
  if (dict.streamFilterMethod === "V2") return rc4Cipher(fileKey);

  throw new UnsupportedEncryptionError(
    `This document uses the ${dict.streamFilterMethod} crypt filter, which cannot be decrypted in place.`
  );
}

export async function buildCipher(
  dict: EncryptionDictionary,
  password: string
): Promise<DocumentCipher> {
  if (dict.v === 5 && dict.r === 6) {
    return aesV3Cipher(await recoverFileKey(dict, password));
  }

  if (dict.v >= 1 && dict.v <= 4 && dict.r >= 2 && dict.r <= 4) {
    if (dict.streamFilterMethod !== dict.stringFilterMethod) {
      throw new UnsupportedEncryptionError(
        "This document encrypts its streams and strings differently, which is not supported."
      );
    }
    const fileKey = recoverLegacyFileKey(
      {
        r: dict.r,
        keyLength: dict.keyLength,
        o: dict.o,
        u: dict.u,
        p: dict.p,
        idFirst: dict.idFirst,
        encryptMetadata: dict.encryptMetadata,
      },
      password
    );
    if (!fileKey) throw new WrongPasswordError();
    return legacyCipher(dict, fileKey);
  }

  throw new UnsupportedEncryptionError(
    `This document uses encryption revision ${dict.r} (V${dict.v}), which cannot be decrypted in place.`
  );
}
