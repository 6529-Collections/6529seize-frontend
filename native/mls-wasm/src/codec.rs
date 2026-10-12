//! Encodings shared by the device and the JS helpers (contract sections 1, 2.4,
//! 3.1 to 3.4): the `H()`/`TAG()` hash helper, the record digests, hex/base64
//! helpers and the padded AES-256-GCM wrap. Every primitive comes from a
//! library (sha3, aes-gcm, ed25519-dalek); this module only arranges bytes.

use aes_gcm::aead::{Aead, KeyInit, Payload};
use aes_gcm::{Aes256Gcm, Nonce};
use base64::engine::general_purpose::STANDARD as B64;
use base64::Engine as _;
use ed25519_dalek::{Signature, Signer as _, SigningKey, VerifyingKey};
use sha3::{Digest, Keccak256};

use crate::error::{Code, MlsError, Result};

/// Entry buckets (contract 3.3).
pub const ENTRY_BUCKETS: [usize; 8] = [2048, 8192, 32768, 131072, 262144, 524288, 1048576, 2097152];
/// Application message buckets (contract 3.3).
pub const MESSAGE_BUCKETS: [usize; 5] = [512, 1024, 4096, 16384, 65536];

/// AES-GCM nonce length.
const NONCE_LEN: usize = 12;
/// AES-GCM tag length.
const TAG_LEN: usize = 16;
/// Nonce plus tag: what `wrap` adds on top of the padded plaintext.
const WRAP_OVERHEAD: usize = NONCE_LEN + TAG_LEN;
/// Length prefix inside the padded plaintext.
const LEN_PREFIX: usize = 4;

pub const TAG_EPOCH: &str = "6529.MlsEpoch.v1";
pub const TAG_ENTRY: &str = "6529.MlsEntry.v1";
pub const TAG_WRAP_E: &str = "6529.MlsWrapE.v1";
pub const TAG_WRAP_M: &str = "6529.MlsWrapM.v1";
pub const TAG_MESSAGE_SIG: &str = "6529.MlsMessageSig.v1";
pub const TAG_REVOKE: &str = "6529.MlsDeviceRevoke.v1";
pub const TAG_ROSTER: &str = "6529.MlsRoster.v1";

/// Entry kinds (contract 3.2).
pub const KIND_COMMIT: u8 = 1;
pub const KIND_PROPOSAL: u8 = 2;

/// keccak256 of arbitrary bytes.
pub fn keccak256(data: &[u8]) -> [u8; 32] {
    let mut hasher = Keccak256::new();
    hasher.update(data);
    let out = hasher.finalize();
    let mut buf = [0u8; 32];
    buf.copy_from_slice(out.as_slice());
    buf
}

/// `TAG(name) = keccak256(ASCII name)`.
pub fn tag(name: &str) -> [u8; 32] {
    keccak256(name.as_bytes())
}

/// One static ABI word.
#[derive(Clone, Copy)]
pub enum Word<'a> {
    /// `bytes32`, used as is.
    B32(&'a [u8; 32]),
    /// Any `uintN` up to 64 bits, left-padded big-endian.
    Uint(u64),
}

/// `H(name, f1..fk) = keccak256(abi.encode(bytes32 TAG(name), f1..fk))`.
pub fn h(name: &str, words: &[Word<'_>]) -> [u8; 32] {
    let mut buf = Vec::with_capacity(32 * (words.len() + 1));
    buf.extend_from_slice(&tag(name));
    for word in words {
        match word {
            Word::B32(b) => buf.extend_from_slice(&b[..]),
            Word::Uint(v) => {
                buf.extend_from_slice(&[0u8; 24]);
                buf.extend_from_slice(&v.to_be_bytes());
            }
        }
    }
    keccak256(&buf)
}

/// `fp(x)`: first 8 bytes of keccak256(x), 16 lowercase hex chars, no `0x`.
pub fn fp(data: &[u8]) -> String {
    hex::encode(&keccak256(data)[..8])
}

/// `0x` + lowercase hex.
pub fn hex0x(data: &[u8]) -> String {
    format!("0x{}", hex::encode(data))
}

/// Parse `0x`-prefixed (or bare) hex of an exact length.
pub fn parse_hex_n<const N: usize>(value: &str, what: &str) -> Result<[u8; N]> {
    let raw = value.strip_prefix("0x").unwrap_or(value);
    if raw.len() != N * 2 {
        return Err(MlsError::new(
            Code::BadInput,
            format!("{what}: expected {N} bytes of hex"),
        ));
    }
    let mut out = [0u8; N];
    hex::decode_to_slice(raw, &mut out)
        .map_err(|_| MlsError::new(Code::BadInput, format!("{what}: invalid hex")))?;
    Ok(out)
}

/// Parse a group handle `g` (`0x` + 64 hex).
pub fn parse_g(g: &str) -> Result<[u8; 32]> {
    let raw = g
        .strip_prefix("0x")
        .ok_or_else(|| MlsError::new(Code::BadInput, "g must be 0x-prefixed"))?;
    if raw.len() != 64 || raw.bytes().any(|c| c.is_ascii_uppercase()) {
        return Err(MlsError::new(
            Code::BadInput,
            "g must be 0x + 64 lowercase hex",
        ));
    }
    parse_hex_n::<32>(g, "g")
}

pub fn b64(data: &[u8]) -> String {
    B64.encode(data)
}

pub fn unb64(value: &str, what: &str) -> Result<Vec<u8>> {
    B64.decode(value.as_bytes())
        .map_err(|_| MlsError::new(Code::BadInput, format!("{what}: invalid base64")))
}

/// Epoch values are encoded as `uint32` in the digests.
pub fn epoch_u32(epoch: u64) -> Result<u64> {
    if epoch > u64::from(u32::MAX) {
        return Err(MlsError::new(Code::BadInput, "epoch exceeds uint32"));
    }
    Ok(epoch)
}

/// `epochCommitment_n = H("6529.MlsEpoch.v1", bytes32 g, uint32 n,
/// bytes32 keccak256(TLS-serialized GroupContext_n))`.
pub fn epoch_commitment(g: &[u8; 32], epoch: u64, group_context_hash: &[u8; 32]) -> [u8; 32] {
    h(
        TAG_EPOCH,
        &[
            Word::B32(g),
            Word::Uint(epoch),
            Word::B32(group_context_hash),
        ],
    )
}

/// `entry_digest` (contract 3.2).
#[allow(clippy::too_many_arguments)]
pub fn entry_digest(
    g: &[u8; 32],
    epoch: u64,
    kind: u8,
    entry_hash: &[u8; 32],
    epoch_commitment: &[u8; 32],
    next_commit_key: &[u8; 32],
    padded_len: u64,
) -> [u8; 32] {
    h(
        TAG_ENTRY,
        &[
            Word::B32(g),
            Word::Uint(epoch),
            Word::Uint(u64::from(kind)),
            Word::B32(entry_hash),
            Word::B32(epoch_commitment),
            Word::B32(next_commit_key),
            Word::Uint(padded_len),
        ],
    )
}

/// `aad_entry = H("6529.MlsWrapE.v1", bytes32 g, uint32 n, uint8 kind)`.
pub fn aad_entry(g: &[u8; 32], epoch: u64, kind: u8) -> [u8; 32] {
    h(
        TAG_WRAP_E,
        &[Word::B32(g), Word::Uint(epoch), Word::Uint(u64::from(kind))],
    )
}

/// `aad_message = H("6529.MlsWrapM.v1", bytes32 g, uint32 n)`.
pub fn aad_message(g: &[u8; 32], epoch: u64) -> [u8; 32] {
    h(TAG_WRAP_M, &[Word::B32(g), Word::Uint(epoch)])
}

/// `H("6529.MlsMessageSig.v1", bytes32 g, uint32 n, bytes32 keccak256(body))`.
pub fn message_digest(g: &[u8; 32], epoch: u64, body: &[u8]) -> [u8; 32] {
    h(
        TAG_MESSAGE_SIG,
        &[Word::B32(g), Word::Uint(epoch), Word::B32(&keccak256(body))],
    )
}

/// `revoke_digest` (contract 2.4).
pub fn revoke_digest(target: &[u8; 32], revoker: &[u8; 32], revoked_at: u64) -> [u8; 32] {
    h(
        TAG_REVOKE,
        &[
            Word::B32(target),
            Word::B32(revoker),
            Word::Uint(revoked_at),
        ],
    )
}

/// Roster digest (ApiE2eeRosterRepairRequest): keys sorted as 32-byte values,
/// concatenated and hashed. Callers reject duplicate keys before hashing.
pub fn roster_digest(g: &[u8; 32], epoch: u64, device_keys: &[[u8; 32]]) -> [u8; 32] {
    let mut keys = device_keys.to_vec();
    keys.sort_unstable();
    let mut concat = Vec::with_capacity(keys.len() * 32);
    for key in &keys {
        concat.extend_from_slice(key);
    }
    h(
        TAG_ROSTER,
        &[
            Word::B32(g),
            Word::Uint(epoch),
            Word::B32(&keccak256(&concat)),
        ],
    )
}

/// Ed25519 key pair from a 32-byte secret seed (RFC 8032).
pub fn ed25519_from_seed(seed: &[u8; 32]) -> SigningKey {
    SigningKey::from_bytes(seed)
}

/// Ed25519 signature over the 32 raw digest bytes.
pub fn sign32(key: &SigningKey, digest: &[u8; 32]) -> [u8; 64] {
    key.sign(digest).to_bytes()
}

/// Strict Ed25519 verification (rejects non-canonical and small-order inputs).
pub fn verify32(public: &[u8; 32], digest: &[u8], sig: &[u8; 64]) -> bool {
    let Ok(key) = VerifyingKey::from_bytes(public) else {
        return false;
    };
    let sig = Signature::from_bytes(sig);
    key.verify_strict(digest, &sig).is_ok()
}

/// Smallest bucket that fits `msg_len` once wrapped, if any.
pub fn bucket_for(msg_len: usize, buckets: &[usize]) -> Option<usize> {
    let needed = msg_len.checked_add(LEN_PREFIX + WRAP_OVERHEAD)?;
    buckets.iter().copied().find(|b| *b >= needed)
}

/// Largest message that fits the biggest bucket.
pub fn max_payload(buckets: &[usize]) -> usize {
    buckets.last().copied().unwrap_or(0) - LEN_PREFIX - WRAP_OVERHEAD
}

/// `wrap(key, aad, msg, buckets)` (contract 3.3). `nonce` must be 12 fresh
/// random bytes.
pub fn wrap(
    key: &[u8; 32],
    aad: &[u8; 32],
    msg: &[u8],
    buckets: &[usize],
    nonce: [u8; 12],
) -> Result<Vec<u8>> {
    let padded = bucket_for(msg.len(), buckets).ok_or_else(|| {
        MlsError::new(
            Code::TooLarge,
            format!("{} bytes do not fit the largest bucket", msg.len()),
        )
    })?;
    let len = u32::try_from(msg.len())
        .map_err(|_| MlsError::new(Code::TooLarge, "message length exceeds u32"))?;
    let mut pt = Vec::with_capacity(padded - WRAP_OVERHEAD);
    pt.extend_from_slice(&len.to_be_bytes());
    pt.extend_from_slice(msg);
    pt.resize(padded - WRAP_OVERHEAD, 0);
    let cipher = Aes256Gcm::new_from_slice(key)
        .map_err(|_| MlsError::new(Code::Internal, "aes key length"))?;
    let ct = cipher
        .encrypt(&Nonce::from(nonce), Payload { msg: &pt, aad })
        .map_err(|_| MlsError::new(Code::Internal, "aes-gcm encrypt failed"))?;
    let mut data = Vec::with_capacity(padded);
    data.extend_from_slice(&nonce);
    data.extend_from_slice(&ct);
    debug_assert_eq!(data.len(), padded);
    Ok(data)
}

/// Inverse of [`wrap`]. Rejects lengths that are not a bucket, wrong keys,
/// tampered bytes, bad length prefixes and non-zero padding.
pub fn unwrap(key: &[u8; 32], aad: &[u8; 32], data: &[u8], buckets: &[usize]) -> Result<Vec<u8>> {
    if !buckets.contains(&data.len()) {
        return Err(MlsError::new(
            Code::BadEntry,
            format!("wrapped length {} is not a bucket", data.len()),
        ));
    }
    let cipher = Aes256Gcm::new_from_slice(key)
        .map_err(|_| MlsError::new(Code::Internal, "aes key length"))?;
    let (nonce, ct) = data.split_at(NONCE_LEN);
    let mut nonce_arr = [0u8; NONCE_LEN];
    nonce_arr.copy_from_slice(nonce);
    let pt = cipher
        .decrypt(&Nonce::from(nonce_arr), Payload { msg: ct, aad })
        .map_err(|_| MlsError::new(Code::DecryptFailed, "unwrap failed (key, aad or bytes)"))?;
    if pt.len() < LEN_PREFIX {
        return Err(MlsError::new(Code::BadEntry, "wrapped plaintext too short"));
    }
    let mut len_bytes = [0u8; LEN_PREFIX];
    len_bytes.copy_from_slice(&pt[..LEN_PREFIX]);
    let len = u32::from_be_bytes(len_bytes) as usize;
    if len > pt.len() - LEN_PREFIX {
        return Err(MlsError::new(
            Code::BadEntry,
            "wrapped length prefix too large",
        ));
    }
    let (msg, padding) = pt[LEN_PREFIX..].split_at(len);
    if padding.iter().any(|b| *b != 0) {
        return Err(MlsError::new(Code::BadEntry, "non-zero padding"));
    }
    Ok(msg.to_vec())
}

/// Inner application envelope `0x01 || u32be(len(body)) || body || sig64`.
pub fn encode_inner(body: &[u8], sig: &[u8; 64]) -> Result<Vec<u8>> {
    let len = u32::try_from(body.len())
        .map_err(|_| MlsError::new(Code::TooLarge, "body length exceeds u32"))?;
    let mut out = Vec::with_capacity(1 + 4 + body.len() + 64);
    out.push(0x01);
    out.extend_from_slice(&len.to_be_bytes());
    out.extend_from_slice(body);
    out.extend_from_slice(sig);
    Ok(out)
}

/// Parse the inner application envelope into `(body, sig64)`.
pub fn decode_inner(inner: &[u8]) -> Result<(Vec<u8>, [u8; 64])> {
    let bad = || MlsError::new(Code::BadMessage, "bad inner envelope");
    if inner.len() < 1 + 4 + 64 || inner[0] != 0x01 {
        return Err(bad());
    }
    let mut len_bytes = [0u8; 4];
    len_bytes.copy_from_slice(&inner[1..5]);
    let len = usize::try_from(u32::from_be_bytes(len_bytes)).map_err(|_| bad())?;
    let body_end = len.checked_add(5).ok_or_else(bad)?;
    if body_end.checked_add(64) != Some(inner.len()) {
        return Err(MlsError::new(
            Code::BadMessage,
            "inner envelope length mismatch",
        ));
    }
    let body = inner[5..body_end].to_vec();
    let mut sig = [0u8; 64];
    sig.copy_from_slice(&inner[body_end..]);
    Ok((body, sig))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn tag_known_answer() {
        // keccak256("") is the well-known empty hash.
        assert_eq!(
            hex::encode(keccak256(b"")),
            "c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470"
        );
        // E2EE_SALT from contract 2.1.
        assert_eq!(
            hex::encode(keccak256(b"6529 Network pre-genesis interim 1")),
            "4887f15a22b96f574a9f835b87e01e293dc7587acbfc13b5f224b89cd2d8c8aa"
        );
    }

    /// Values cross-checked with viem (`keccak256(encodeAbiParameters(...))`)
    /// from the frontend's node_modules.
    #[test]
    fn h_matches_viem_abi_encoding() {
        assert_eq!(
            hex0x(&tag(TAG_EPOCH)),
            "0xdd916fd9f3726971e02f1a6a4dd95da100d23de4aa440faf62160e847b745244"
        );
        let g = [0x11u8; 32];
        assert_eq!(
            hex0x(&epoch_commitment(&g, 7, &[0x22u8; 32])),
            "0x197bdcc693754d29e17976b88dbc6fa963e4703cc97bdf787d56eb1b9e976ba6"
        );
        assert_eq!(
            hex0x(&entry_digest(
                &g,
                3,
                KIND_COMMIT,
                &[0x33; 32],
                &[0x44; 32],
                &[0x55; 32],
                2048
            )),
            "0xbd794bbcb933efd019690830c4fb14a496d8ace4a7a1a54fe35e156db8140dc0"
        );
        assert_eq!(
            hex0x(&revoke_digest(&[0x66; 32], &[0x77; 32], 1_760_000_000)),
            "0x1283d152a74d5985c69a5a38a5b0a80f1dc8110e665f28ef422904603528307e"
        );
        assert_eq!(
            hex0x(&message_digest(&g, 5, br#"{"v":1}"#)),
            "0x848c3e0afacec639966233a19e3a5c7d4102b664e2ebb166ce06d71a45996e48"
        );
    }

    #[test]
    fn h_left_pads_uints() {
        let g = [0x11u8; 32];
        let manual = {
            let mut buf = Vec::new();
            buf.extend_from_slice(&tag(TAG_WRAP_M));
            buf.extend_from_slice(&g);
            let mut word = [0u8; 32];
            word[28..].copy_from_slice(&7u32.to_be_bytes());
            buf.extend_from_slice(&word);
            keccak256(&buf)
        };
        assert_eq!(aad_message(&g, 7), manual);
    }

    #[test]
    fn wrap_round_trip_and_buckets() {
        let key = [7u8; 32];
        let aad = [9u8; 32];
        for (len, expected) in [(0usize, 2048usize), (2016, 2048), (2017, 8192)] {
            let msg = vec![0xabu8; len];
            let data = wrap(&key, &aad, &msg, &ENTRY_BUCKETS, [1u8; 12]).unwrap();
            assert_eq!(data.len(), expected, "len {len}");
            assert_eq!(unwrap(&key, &aad, &data, &ENTRY_BUCKETS).unwrap(), msg);
        }
        for (len, expected) in [(0usize, 512usize), (480, 512), (481, 1024), (65504, 65536)] {
            let msg = vec![1u8; len];
            let data = wrap(&key, &aad, &msg, &MESSAGE_BUCKETS, [2u8; 12]).unwrap();
            assert_eq!(data.len(), expected, "len {len}");
        }
        let too_big = vec![0u8; 65505];
        let err = wrap(&key, &aad, &too_big, &MESSAGE_BUCKETS, [3u8; 12]).unwrap_err();
        assert_eq!(err.code, Code::TooLarge);
        assert_eq!(max_payload(&MESSAGE_BUCKETS), 65504);
        assert_eq!(max_payload(&ENTRY_BUCKETS), 2097152 - 32);
    }

    #[test]
    fn unwrap_rejects_tampering() {
        let key = [7u8; 32];
        let aad = [9u8; 32];
        let mut data = wrap(&key, &aad, b"hello", &MESSAGE_BUCKETS, [1u8; 12]).unwrap();
        assert!(unwrap(&[8u8; 32], &aad, &data, &MESSAGE_BUCKETS).is_err());
        assert!(unwrap(&key, &[8u8; 32], &data, &MESSAGE_BUCKETS).is_err());
        data[100] ^= 1;
        assert_eq!(
            unwrap(&key, &aad, &data, &MESSAGE_BUCKETS)
                .unwrap_err()
                .code,
            Code::DecryptFailed
        );
        assert!(unwrap(&key, &aad, &data[..511], &MESSAGE_BUCKETS).is_err());
    }

    #[test]
    fn inner_envelope_round_trip() {
        let sig = [5u8; 64];
        let inner = encode_inner(b"{}", &sig).unwrap();
        assert_eq!(inner[0], 1);
        assert_eq!(decode_inner(&inner).unwrap(), (b"{}".to_vec(), sig));
        assert!(decode_inner(&inner[..inner.len() - 1]).is_err());
    }

    #[test]
    fn roster_digest_is_order_independent() {
        let g = [1u8; 32];
        let a = [2u8; 32];
        let b = [3u8; 32];
        assert_eq!(roster_digest(&g, 4, &[a, b]), roster_digest(&g, 4, &[b, a]));
    }
}
