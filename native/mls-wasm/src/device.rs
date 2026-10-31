//! The MLS device: one Ed25519 signature key, one BasicCredential and every
//! group this device is a member of (contract sections 3 and 10).
//!
//! Pure Rust and target-independent. `wasm.rs` exposes it to JS; native tests
//! and the native benchmark call it directly.

use std::collections::{BTreeMap, BTreeSet, HashMap};

use openmls::ciphersuite::hash_ref::ProposalRef;
use openmls::prelude::*;
use openmls_basic_credential::SignatureKeyPair;
use openmls_memory_storage::MemoryStorage;
use openmls_rust_crypto::RustCrypto;
use openmls_traits::storage::StorageProvider as _;
use serde_json::{json, Map, Value};
use tls_codec::{Deserialize as _, Serialize as _};
use zeroize::Zeroizing;

use crate::codec::{self, Word, ENTRY_BUCKETS, KIND_COMMIT, KIND_PROPOSAL, MESSAGE_BUCKETS};
use crate::error::{Code, MlsError, Result};

/// The single MLS ciphersuite in use (contract 3.6): 0x004F, X-Wing hybrid
/// post-quantum key exchange (ML-KEM-768 + X25519), AES-128-GCM, SHA-256 and
/// Ed25519 signatures. No other suite is offered or accepted. 0x004F is a
/// draft code point (draft-ietf-mls-pq-ciphersuites): if it changes, every
/// device re-enrolls and every group is re-created.
pub const CIPHERSUITE: Ciphersuite = Ciphersuite::MLS_128_MLKEM768X25519_AES128GCM_SHA256_Ed25519;
/// Private-use GroupContext extension carrying the 3.5 metadata JSON.
pub const METADATA_EXTENSION: u16 = 0xF529;
/// Exporter labels (contract 3.1).
pub const LABEL_COMMIT_KEY: &str = "6529 commit key";
pub const LABEL_ENTRY_WRAP: &str = "6529 entry wrap";
pub const LABEL_MESSAGE_WRAP: &str = "6529 message wrap";
/// Past epochs whose message keys stay available (contract 3.6).
pub const MAX_PAST_EPOCHS: usize = 2;
const OUT_OF_ORDER_TOLERANCE: u32 = 10;
const MAX_FORWARD_DISTANCE: u32 = 2000;
const MAX_METADATA_BYTES: usize = 16 * 1024;
const MAX_NAME_CHARS: usize = 100;
const STATE_MAGIC: &[u8; 8] = b"6529MLS1";
const STATE_VERSION: u64 = 1;
/// Room left for MLS framing when checking a message before encrypting it.
const MESSAGE_FRAMING_RESERVE: usize = 512;

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

/// OpenMLS provider: RustCrypto for crypto and randomness, MemoryStorage for
/// state. Unlike `OpenMlsRustCrypto`, the storage is reachable so the whole
/// map can be exported and restored.
#[derive(Default, Debug)]
pub struct Provider {
    crypto: RustCrypto,
    storage: MemoryStorage,
}

impl openmls_traits::OpenMlsProvider for Provider {
    type CryptoProvider = RustCrypto;
    type RandProvider = RustCrypto;
    type StorageProvider = MemoryStorage;

    fn storage(&self) -> &Self::StorageProvider {
        &self.storage
    }

    fn crypto(&self) -> &Self::CryptoProvider {
        &self.crypto
    }

    fn rand(&self) -> &Self::RandProvider {
        &self.crypto
    }
}

impl Provider {
    fn with_storage(storage: MemoryStorage) -> Self {
        Self {
            crypto: RustCrypto::default(),
            storage,
        }
    }

    fn random32(&self) -> Result<[u8; 32]> {
        self.crypto
            .random_array::<32>()
            .map_err(|e| MlsError::internal("random", e))
    }

    fn random12(&self) -> Result<[u8; 12]> {
        self.crypto
            .random_array::<12>()
            .map_err(|e| MlsError::internal("random", e))
    }

    fn snapshot(&self) -> Result<Vec<(Vec<u8>, Vec<u8>)>> {
        let map = self
            .storage
            .values
            .read()
            .map_err(|_| MlsError::new(Code::Internal, "storage lock"))?;
        let mut entries: Vec<(Vec<u8>, Vec<u8>)> =
            map.iter().map(|(k, v)| (k.clone(), v.clone())).collect();
        entries.sort_unstable_by(|a, b| a.0.cmp(&b.0));
        Ok(entries)
    }

    fn merge_from(&self, other: &MemoryStorage) -> Result<()> {
        let src = other
            .values
            .read()
            .map_err(|_| MlsError::new(Code::Internal, "storage lock"))?;
        let mut dst = self
            .storage
            .values
            .write()
            .map_err(|_| MlsError::new(Code::Internal, "storage lock"))?;
        for (k, v) in src.iter() {
            dst.insert(k.clone(), v.clone());
        }
        Ok(())
    }
}

// ---------------------------------------------------------------------------
// Persisted per-group bookkeeping (outside OpenMLS)
// ---------------------------------------------------------------------------

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
struct PendingOwn {
    entry_hash: String,
    epoch: u64,
}

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
struct OwnMerged {
    entry_hash: String,
    epoch: u64,
}

#[derive(serde::Serialize, serde::Deserialize, Debug)]
struct StagedIncoming {
    entry_hash: String,
    epoch: u64,
    sender: u32,
    commit: StagedCommit,
}

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
struct OwnProposal {
    entry_hash: String,
    epoch: u64,
    proposal: QueuedProposal,
}

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
struct PastEpoch {
    epoch: u64,
    wrap_m: String,
    epoch_fp: String,
}

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
struct PastLeaf {
    /// Last epoch in which this leaf content was valid.
    until_epoch: u64,
    leaf: u32,
    device_key: String,
    identity: String,
}

#[derive(serde::Serialize, serde::Deserialize, Debug, Default)]
struct GroupAux {
    group_id: String,
    #[serde(default)]
    pending: Option<PendingOwn>,
    #[serde(default)]
    last_own_commit: Option<OwnMerged>,
    #[serde(default)]
    staged: Option<StagedIncoming>,
    #[serde(default)]
    own_proposals: Vec<OwnProposal>,
    #[serde(default)]
    past_epochs: Vec<PastEpoch>,
    #[serde(default)]
    past_leaves: Vec<PastLeaf>,
}

struct GroupState {
    mls: MlsGroup,
    aux: GroupAux,
}

/// A Welcome processed into scratch storage, waiting for accept/reject.
/// In-memory only: after a reload the engine calls `join_welcome` again (the
/// KeyPackage is not consumed in real storage until `accept_welcome`).
struct StagedJoin {
    scratch: MemoryStorage,
    group_id: GroupId,
    kp_ref: KeyPackageRef,
    last_resort: bool,
    summary: Value,
}

#[derive(serde::Serialize, serde::Deserialize)]
struct StateHeader {
    v: u64,
    seed: String,
    public: String,
    identity: Option<String>,
    groups: BTreeMap<String, GroupAux>,
}

/// Ops for `create_commit` (contract 10 CommitOps).
#[derive(serde::Deserialize, Default, Debug)]
#[serde(deny_unknown_fields)]
struct CommitOps {
    #[serde(default)]
    add_key_packages: Vec<String>,
    #[serde(default)]
    remove_device_keys: Vec<String>,
    #[serde(default)]
    include_pending_proposals: bool,
    #[serde(default)]
    metadata: Option<Value>,
    #[serde(default)]
    self_update: bool,
}

/// Fields read from an `ApiE2eeLogItem`.
struct LogEntry {
    epoch: u64,
    kind: u8,
    data: Vec<u8>,
    entry_hash: [u8; 32],
    epoch_commitment: [u8; 32],
    next_commit_key: [u8; 32],
    signature: [u8; 64],
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

fn identity_of(credential: &Credential) -> String {
    match BasicCredential::try_from(credential.clone()) {
        Ok(basic) => String::from_utf8_lossy(basic.identity()).into_owned(),
        Err(_) => String::new(),
    }
}

fn leaf_json(index: u32, signature_key: &[u8], credential: &Credential) -> Value {
    json!({
        "leaf": index,
        "device_key": codec::hex0x(signature_key),
        "identity": identity_of(credential),
    })
}

fn member_json(member: &Member) -> Value {
    leaf_json(
        member.index.u32(),
        &member.signature_key,
        &member.credential,
    )
}

fn leaf_node_json(index: u32, leaf: &LeafNode) -> Value {
    leaf_json(index, leaf.signature_key().as_slice(), leaf.credential())
}

fn leaf_capabilities() -> Capabilities {
    Capabilities::builder()
        .ciphersuites(vec![CIPHERSUITE])
        .extensions(vec![
            ExtensionType::Unknown(METADATA_EXTENSION),
            ExtensionType::LastResort,
        ])
        .credentials(vec![CredentialType::Basic])
        .build()
}

fn group_context_extensions(metadata: &[u8]) -> Result<Extensions<GroupContext>> {
    let required = RequiredCapabilitiesExtension::new(
        &[ExtensionType::Unknown(METADATA_EXTENSION)],
        &[],
        &[CredentialType::Basic],
    );
    Extensions::from_vec(vec![
        Extension::RequiredCapabilities(required),
        Extension::Unknown(METADATA_EXTENSION, UnknownExtension(metadata.to_vec())),
    ])
    .map_err(|e| MlsError::mls("group context extensions", e))
}

fn metadata_of(extensions: &Extensions<GroupContext>) -> Value {
    extensions
        .unknown(METADATA_EXTENSION)
        .and_then(|ext| serde_json::from_slice::<Value>(&ext.0).ok())
        .unwrap_or(Value::Null)
}

/// Validate the 3.5 metadata object and return its canonical bytes.
fn validate_metadata(meta: &Value, g: &str) -> Result<Vec<u8>> {
    let bad = |msg: &str| MlsError::new(Code::BadMetadata, msg.to_string());
    let obj = meta
        .as_object()
        .ok_or_else(|| bad("metadata must be an object"))?;
    if obj.get("v").and_then(Value::as_u64) != Some(1) {
        return Err(bad("metadata.v must be 1"));
    }
    if obj.get("g").and_then(Value::as_str) != Some(g) {
        return Err(bad("metadata.g must equal the group handle"));
    }
    match obj.get("kind").and_then(Value::as_str) {
        Some("dm") | Some("group") => {}
        _ => return Err(bad("metadata.kind must be dm or group")),
    }
    match obj.get("name") {
        None | Some(Value::Null) => {}
        Some(Value::String(name)) if name.chars().count() <= MAX_NAME_CHARS => {}
        _ => {
            return Err(bad(
                "metadata.name must be null or a string of at most 100 chars",
            ))
        }
    }
    let admins = obj
        .get("admins")
        .and_then(Value::as_array)
        .ok_or_else(|| bad("metadata.admins must be an array"))?;
    if admins.iter().any(|a| !a.is_string()) {
        return Err(bad("metadata.admins must contain profile id strings"));
    }
    if !obj.get("created_by").is_some_and(Value::is_string) {
        return Err(bad("metadata.created_by must be a string"));
    }
    if !obj.get("history").is_some_and(Value::is_string) {
        return Err(bad("metadata.history must be a string"));
    }
    let bytes = serde_json::to_vec(meta).map_err(|e| MlsError::internal("metadata", e))?;
    if bytes.len() > MAX_METADATA_BYTES {
        return Err(bad("metadata too large"));
    }
    Ok(bytes)
}

fn parse_device_key(value: &str) -> Result<[u8; 32]> {
    let raw = value
        .strip_prefix("0x")
        .ok_or_else(|| MlsError::new(Code::BadInput, "device key must be 0x-prefixed"))?;
    if raw.bytes().any(|c| c.is_ascii_uppercase()) {
        return Err(MlsError::new(
            Code::BadInput,
            "device key must be lowercase hex",
        ));
    }
    codec::parse_hex_n::<32>(value, "device key")
}

fn parse_device_keys(json_list: &str) -> Result<Vec<[u8; 32]>> {
    let list: Vec<String> = serde_json::from_str(json_list)
        .map_err(|_| MlsError::new(Code::BadInput, "expected a JSON array of device keys"))?;
    let mut seen = BTreeSet::new();
    let mut out = Vec::with_capacity(list.len());
    for item in &list {
        let key = parse_device_key(item)?;
        if !seen.insert(key) {
            return Err(MlsError::new(Code::BadInput, "duplicate device key"));
        }
        out.push(key);
    }
    Ok(out)
}

fn kind_name(kind: u8) -> &'static str {
    if kind == KIND_COMMIT {
        "commit"
    } else {
        "proposal"
    }
}

fn parse_kind(value: &Value) -> Result<u8> {
    match value {
        Value::String(s) if s == "commit" => Ok(KIND_COMMIT),
        Value::String(s) if s == "proposal" => Ok(KIND_PROPOSAL),
        Value::Number(n) if n.as_u64() == Some(1) => Ok(KIND_COMMIT),
        Value::Number(n) if n.as_u64() == Some(2) => Ok(KIND_PROPOSAL),
        _ => Err(MlsError::new(
            Code::BadEntry,
            "kind must be commit or proposal",
        )),
    }
}

fn str_field<'a>(obj: &'a Map<String, Value>, key: &str, code: Code) -> Result<&'a str> {
    obj.get(key)
        .and_then(Value::as_str)
        .ok_or_else(|| MlsError::new(code, format!("missing field {key}")))
}

fn parse_log_entry(item_json: &str) -> Result<LogEntry> {
    let item: Value = serde_json::from_str(item_json)
        .map_err(|_| MlsError::new(Code::BadEntry, "item is not JSON"))?;
    let obj = item
        .as_object()
        .ok_or_else(|| MlsError::new(Code::BadEntry, "item must be an object"))?;
    if let Some(t) = obj.get("type").and_then(Value::as_str) {
        if t != "entry" {
            return Err(MlsError::new(Code::BadEntry, "item type is not entry"));
        }
    }
    let epoch = obj
        .get("epoch")
        .and_then(Value::as_u64)
        .ok_or_else(|| MlsError::new(Code::BadEntry, "missing field epoch"))?;
    let kind = parse_kind(obj.get("kind").unwrap_or(&Value::Null))?;
    let data = codec::unb64(str_field(obj, "data", Code::BadEntry)?, "data")
        .map_err(|e| MlsError::new(Code::BadEntry, e.message))?;
    let h32 = |key: &str| -> Result<[u8; 32]> {
        codec::parse_hex_n::<32>(str_field(obj, key, Code::BadEntry)?, key)
            .map_err(|e| MlsError::new(Code::BadEntry, e.message))
    };
    let entry_hash = h32("entry_hash")?;
    let epoch_commitment = h32("epoch_commitment")?;
    let next_commit_key = h32("next_commit_key")?;
    let signature =
        codec::parse_hex_n::<64>(str_field(obj, "signature", Code::BadEntry)?, "signature")
            .map_err(|e| MlsError::new(Code::BadEntry, e.message))?;
    Ok(LogEntry {
        epoch,
        kind,
        data,
        entry_hash,
        epoch_commitment,
        next_commit_key,
        signature,
    })
}

/// Leaf indices that `n_adds` Add proposals take after `removed` leaves are
/// blanked: RFC 9420 12.1.1 places each new member in the leftmost blank leaf
/// (or appends), with Removes applied before Adds.
fn predict_add_indices(mls: &MlsGroup, removed: &[u32], n_adds: usize) -> Vec<u32> {
    let mut occupied: BTreeSet<u32> = mls.members().map(|m| m.index.u32()).collect();
    for r in removed {
        occupied.remove(r);
    }
    let mut out = Vec::with_capacity(n_adds);
    let mut candidate = 0u32;
    for _ in 0..n_adds {
        while occupied.contains(&candidate) {
            candidate += 1;
        }
        out.push(candidate);
        occupied.insert(candidate);
    }
    out
}

fn export32(
    provider: &Provider,
    mls: &MlsGroup,
    label: &str,
    g: &[u8; 32],
) -> Result<Zeroizing<[u8; 32]>> {
    let secret = mls
        .export_secret(provider.crypto(), label, g, 32)
        .map_err(|e| MlsError::mls("export secret", e))?;
    let mut out = Zeroizing::new([0u8; 32]);
    out.copy_from_slice(&secret);
    Ok(out)
}

fn staged_export32(
    provider: &Provider,
    staged: &StagedCommit,
    label: &str,
    g: &[u8; 32],
) -> Result<Zeroizing<[u8; 32]>> {
    let secret = staged
        .export_secret(provider.crypto(), label, g, 32)
        .map_err(|e| MlsError::mls("export staged secret", e))?;
    let mut out = Zeroizing::new([0u8; 32]);
    out.copy_from_slice(&secret);
    Ok(out)
}

fn commit_signing_key(
    provider: &Provider,
    mls: &MlsGroup,
    g: &[u8; 32],
) -> Result<ed25519_dalek::SigningKey> {
    let seed = export32(provider, mls, LABEL_COMMIT_KEY, g)?;
    Ok(codec::ed25519_from_seed(&seed))
}

fn context_commitment(g: &[u8; 32], context: &GroupContext) -> Result<[u8; 32]> {
    let bytes = context
        .tls_serialize_detached()
        .map_err(|e| MlsError::internal("serialize group context", e))?;
    Ok(codec::epoch_commitment(
        g,
        context.epoch().as_u64(),
        &codec::keccak256(&bytes),
    ))
}

/// Declared values for the epoch a staged commit moves to:
/// `(pub(K_{n+1}), epochCommitment_{n+1}, epochFp_{n+1})`.
fn staged_declared(
    provider: &Provider,
    staged: &StagedCommit,
    g: &[u8; 32],
) -> Result<([u8; 32], [u8; 32], String)> {
    let seed = staged_export32(provider, staged, LABEL_COMMIT_KEY, g)?;
    let next_key = codec::ed25519_from_seed(&seed).verifying_key().to_bytes();
    let commitment = context_commitment(g, staged.group_context())?;
    let fp = staged
        .epoch_authenticator()
        .map(|a| codec::fp(a.as_slice()))
        .ok_or_else(|| MlsError::new(Code::Internal, "staged commit has no epoch authenticator"))?;
    Ok((next_key, commitment, fp))
}

fn parse_mls_message(bytes: &[u8], code: Code) -> Result<MlsMessageIn> {
    MlsMessageIn::tls_deserialize_exact(bytes)
        .map_err(|_| MlsError::new(code, "not an MLS message"))
}

// ---------------------------------------------------------------------------
// Device
// ---------------------------------------------------------------------------

pub struct Device {
    provider: Provider,
    signer: SignatureKeyPair,
    sign_key: ed25519_dalek::SigningKey,
    identity: Option<String>,
    groups: BTreeMap<String, GroupState>,
    staged_welcomes: HashMap<String, StagedJoin>,
}

impl Device {
    /// Fresh device with a new Ed25519 signature key.
    pub fn create() -> Result<Self> {
        let provider = Provider::default();
        let seed = Zeroizing::new(provider.random32()?);
        Ok(Self::from_parts(provider, &seed, None, BTreeMap::new()))
    }

    fn from_parts(
        provider: Provider,
        seed: &[u8; 32],
        identity: Option<String>,
        groups: BTreeMap<String, GroupState>,
    ) -> Self {
        let sign_key = codec::ed25519_from_seed(seed);
        let public = sign_key.verifying_key().to_bytes();
        let signer = SignatureKeyPair::from_raw(
            CIPHERSUITE.signature_algorithm(),
            seed.to_vec(),
            public.to_vec(),
        );
        Self {
            provider,
            signer,
            sign_key,
            identity,
            groups,
            staged_welcomes: HashMap::new(),
        }
    }

    // -- identity ----------------------------------------------------------

    pub fn device_key(&self) -> String {
        codec::hex0x(self.sign_key.verifying_key().as_bytes())
    }

    pub fn device_key_bytes(&self) -> [u8; 32] {
        self.sign_key.verifying_key().to_bytes()
    }

    pub fn set_credential(&mut self, identity: &str) -> Result<()> {
        if identity.is_empty() || identity.len() > 512 {
            return Err(MlsError::new(
                Code::BadInput,
                "identity must be 1..512 bytes",
            ));
        }
        self.identity = Some(identity.to_string());
        Ok(())
    }

    pub fn credential_identity(&self) -> Option<String> {
        self.identity.clone()
    }

    fn credential_with_key(&self) -> Result<CredentialWithKey> {
        let identity = self
            .identity
            .as_ref()
            .ok_or_else(|| MlsError::new(Code::NoCredential, "call setCredential first"))?;
        Ok(CredentialWithKey {
            credential: BasicCredential::new(identity.as_bytes().to_vec()).into(),
            signature_key: self.signer.public().into(),
        })
    }

    pub fn sign_digest(&self, digest: &[u8]) -> Result<String> {
        let digest: [u8; 32] = digest
            .try_into()
            .map_err(|_| MlsError::new(Code::BadInput, "digest must be 32 bytes"))?;
        Ok(codec::hex0x(&codec::sign32(&self.sign_key, &digest)))
    }

    // -- state -------------------------------------------------------------

    pub fn export_state(&self) -> Result<Vec<u8>> {
        let mut groups = BTreeMap::new();
        for (g, st) in &self.groups {
            groups.insert(g.clone(), &st.aux);
        }
        #[derive(serde::Serialize)]
        struct HeaderRef<'a> {
            v: u64,
            seed: String,
            public: String,
            identity: &'a Option<String>,
            groups: BTreeMap<String, &'a GroupAux>,
        }
        let seed = Zeroizing::new(codec::b64(self.sign_key.as_bytes()));
        let header = HeaderRef {
            v: STATE_VERSION,
            seed: seed.to_string(),
            public: self.device_key(),
            identity: &self.identity,
            groups,
        };
        let header_bytes = Zeroizing::new(
            serde_json::to_vec(&header).map_err(|e| MlsError::internal("state header", e))?,
        );
        let entries = self.provider.snapshot()?;
        let mut out = Vec::with_capacity(
            16 + header_bytes.len()
                + entries
                    .iter()
                    .map(|(k, v)| 8 + k.len() + v.len())
                    .sum::<usize>(),
        );
        out.extend_from_slice(STATE_MAGIC);
        out.extend_from_slice(&(header_bytes.len() as u32).to_be_bytes());
        out.extend_from_slice(&header_bytes);
        out.extend_from_slice(&(entries.len() as u32).to_be_bytes());
        for (k, v) in &entries {
            out.extend_from_slice(&(k.len() as u32).to_be_bytes());
            out.extend_from_slice(k);
            out.extend_from_slice(&(v.len() as u32).to_be_bytes());
            out.extend_from_slice(v);
        }
        Ok(out)
    }

    pub fn load(state: &[u8]) -> Result<Self> {
        let bad = |m: &str| MlsError::new(Code::BadState, m.to_string());
        let mut cur = state;
        let mut take = |n: usize| -> Result<&[u8]> {
            if cur.len() < n {
                return Err(bad("truncated state"));
            }
            let (head, tail) = cur.split_at(n);
            cur = tail;
            Ok(head)
        };
        if take(8)? != STATE_MAGIC {
            return Err(bad("unknown state magic"));
        }
        let read_u32 = |b: &[u8]| -> u32 {
            let mut a = [0u8; 4];
            a.copy_from_slice(b);
            u32::from_be_bytes(a)
        };
        let header_len = read_u32(take(4)?) as usize;
        let header: StateHeader = serde_json::from_slice(take(header_len)?)
            .map_err(|_| bad("state header is not valid JSON"))?;
        if header.v != STATE_VERSION {
            return Err(bad("unsupported state version"));
        }
        let count = read_u32(take(4)?) as usize;
        let mut map = HashMap::with_capacity(count);
        for _ in 0..count {
            let klen = read_u32(take(4)?) as usize;
            let k = take(klen)?.to_vec();
            let vlen = read_u32(take(4)?) as usize;
            let v = take(vlen)?.to_vec();
            map.insert(k, v);
        }
        if !cur.is_empty() {
            return Err(bad("trailing bytes in state"));
        }
        let seed_vec = Zeroizing::new(codec::unb64(&header.seed, "seed").map_err(|_| bad("seed"))?);
        let seed: Zeroizing<[u8; 32]> = Zeroizing::new(
            seed_vec
                .as_slice()
                .try_into()
                .map_err(|_| bad("seed must be 32 bytes"))?,
        );
        let storage = MemoryStorage::default();
        *storage
            .values
            .write()
            .map_err(|_| MlsError::new(Code::Internal, "storage lock"))? = map;
        let provider = Provider::with_storage(storage);
        let mut groups = BTreeMap::new();
        for (g, aux) in header.groups {
            let group_id =
                GroupId::from_slice(&hex::decode(&aux.group_id).map_err(|_| bad("group id"))?);
            let mls = MlsGroup::load(provider.storage(), &group_id)
                .map_err(|e| MlsError::internal("load group", e))?
                .ok_or_else(|| bad("group missing from storage"))?;
            groups.insert(g, GroupState { mls, aux });
        }
        let device = Self::from_parts(provider, &seed, header.identity, groups);
        if device.device_key() != header.public {
            return Err(bad("public key does not match seed"));
        }
        Ok(device)
    }

    // -- key packages ------------------------------------------------------

    pub fn create_key_packages(
        &self,
        count: u32,
        last_resort: bool,
        lifetime_secs: u64,
    ) -> Result<String> {
        if count == 0 || count > 100 {
            return Err(MlsError::new(Code::BadInput, "count must be 1..100"));
        }
        if !(3600..=400 * 24 * 3600).contains(&lifetime_secs) {
            return Err(MlsError::new(
                Code::BadInput,
                "lifetime must be 1 hour..400 days",
            ));
        }
        let cwk = self.credential_with_key()?;
        let mut out = Vec::with_capacity(count as usize);
        for _ in 0..count {
            let mut builder = KeyPackage::builder()
                .key_package_lifetime(Lifetime::new(lifetime_secs))
                .leaf_node_capabilities(leaf_capabilities());
            if last_resort {
                builder = builder.mark_as_last_resort();
            }
            let bundle = builder
                .build(CIPHERSUITE, &self.provider, &self.signer, cwk.clone())
                .map_err(|e| MlsError::mls("key package", e))?;
            let kp = bundle.key_package();
            let data = kp
                .tls_serialize_detached()
                .map_err(|e| MlsError::internal("serialize key package", e))?;
            let kp_ref = kp
                .hash_ref(self.provider.crypto())
                .map_err(|e| MlsError::internal("key package ref", e))?;
            out.push(json!({
                "data": codec::b64(&data),
                "ref": codec::hex0x(kp_ref.as_slice()),
                "expires_at": kp.life_time().not_after(),
                "last_resort": last_resort,
            }));
        }
        Ok(Value::Array(out).to_string())
    }

    // -- groups ------------------------------------------------------------

    fn join_config() -> MlsGroupJoinConfig {
        MlsGroupJoinConfig::builder()
            .wire_format_policy(PURE_CIPHERTEXT_WIRE_FORMAT_POLICY)
            .use_ratchet_tree_extension(true)
            .max_past_epochs(MAX_PAST_EPOCHS)
            .sender_ratchet_configuration(SenderRatchetConfiguration::new(
                OUT_OF_ORDER_TOLERANCE,
                MAX_FORWARD_DISTANCE,
            ))
            .build()
    }

    pub fn has_group(&self, g: &str) -> bool {
        self.groups.contains_key(g)
    }

    fn state(&self, g: &str) -> Result<&GroupState> {
        self.groups
            .get(g)
            .ok_or_else(|| MlsError::new(Code::NoGroup, "no such group on this device"))
    }

    pub fn create_group(&mut self, g: &str, metadata_json: &str) -> Result<String> {
        codec::parse_g(g)?;
        if self.groups.contains_key(g) {
            return Err(MlsError::new(Code::GroupExists, "group already exists"));
        }
        let meta: Value = serde_json::from_str(metadata_json)
            .map_err(|_| MlsError::new(Code::BadMetadata, "metadata is not JSON"))?;
        let meta_bytes = validate_metadata(&meta, g)?;
        let cwk = self.credential_with_key()?;
        let config = MlsGroupCreateConfig::builder()
            .ciphersuite(CIPHERSUITE)
            .wire_format_policy(PURE_CIPHERTEXT_WIRE_FORMAT_POLICY)
            .use_ratchet_tree_extension(true)
            .max_past_epochs(MAX_PAST_EPOCHS)
            .sender_ratchet_configuration(SenderRatchetConfiguration::new(
                OUT_OF_ORDER_TOLERANCE,
                MAX_FORWARD_DISTANCE,
            ))
            .capabilities(leaf_capabilities())
            .with_group_context_extensions(group_context_extensions(&meta_bytes)?)
            .build();
        let group_id = GroupId::from_slice(&self.provider.random32()?);
        let mls = MlsGroup::new_with_group_id(&self.provider, &self.signer, &config, group_id, cwk)
            .map_err(|e| MlsError::mls("create group", e))?;
        let aux = GroupAux {
            group_id: hex::encode(mls.group_id().as_slice()),
            ..GroupAux::default()
        };
        self.groups.insert(g.to_string(), GroupState { mls, aux });
        self.group_summary(g)
    }

    pub fn delete_group(&mut self, g: &str) -> Result<()> {
        self.staged_welcomes.remove(g);
        if let Some(mut st) = self.groups.remove(g) {
            st.mls
                .delete(self.provider.storage())
                .map_err(|e| MlsError::internal("delete group", e))?;
        }
        Ok(())
    }

    fn summary_value(&self, g: &str, st: &GroupState) -> Result<Value> {
        let gb = codec::parse_g(g)?;
        let mls = &st.mls;
        let active = mls.is_active();
        let (epoch_fp, commit_key) = if active {
            let key = commit_signing_key(&self.provider, mls, &gb)?;
            (
                Value::String(codec::fp(mls.epoch_authenticator().as_slice())),
                Value::String(codec::hex0x(key.verifying_key().as_bytes())),
            )
        } else {
            (Value::Null, Value::Null)
        };
        let members: Vec<Value> = mls.members().map(|m| member_json(&m)).collect();
        let mut pending_proposals = Vec::new();
        for qp in mls.pending_proposals() {
            if let Proposal::Remove(rp) = qp.proposal() {
                let proposer = match qp.sender() {
                    Sender::Member(idx) => mls.member_at(*idx).map(|m| member_json(&m)),
                    _ => None,
                };
                let remove = mls.member_at(rp.removed()).map(|m| member_json(&m));
                if let (Some(proposer), Some(remove)) = (proposer, remove) {
                    pending_proposals.push(json!({ "proposer": proposer, "remove": remove }));
                }
            }
        }
        Ok(json!({
            "g": g,
            "epoch": mls.epoch().as_u64(),
            "epoch_fp": epoch_fp,
            "commit_key": commit_key,
            "own_device_key": self.device_key(),
            "own_leaf": mls.own_leaf_index().u32(),
            "metadata": metadata_of(mls.extensions()),
            "members": members,
            "pending_proposals": pending_proposals,
            "active": active,
            "pending_commit": st.aux.pending.is_some(),
            "staged_commit": st.aux.staged.is_some(),
        }))
    }

    pub fn group_summary(&self, g: &str) -> Result<String> {
        let st = self.state(g)?;
        Ok(self.summary_value(g, st)?.to_string())
    }

    // -- entries -----------------------------------------------------------

    /// Wrap, hash and sign an MLS handshake message as an entry of epoch n.
    #[allow(clippy::too_many_arguments)]
    fn make_entry(
        provider: &Provider,
        mls: &MlsGroup,
        gb: &[u8; 32],
        kind: u8,
        mls_bytes: &[u8],
        epoch_commitment: &[u8; 32],
        next_commit_key: &[u8; 32],
    ) -> Result<(Value, [u8; 32])> {
        let n = codec::epoch_u32(mls.epoch().as_u64())?;
        let wrap_key = export32(provider, mls, LABEL_ENTRY_WRAP, gb)?;
        let data = codec::wrap(
            &wrap_key,
            &codec::aad_entry(gb, n, kind),
            mls_bytes,
            &ENTRY_BUCKETS,
            provider.random12()?,
        )?;
        let entry_hash = codec::keccak256(&data);
        let digest = codec::entry_digest(
            gb,
            n,
            kind,
            &entry_hash,
            epoch_commitment,
            next_commit_key,
            data.len() as u64,
        );
        let k_n = commit_signing_key(provider, mls, gb)?;
        let signature = codec::sign32(&k_n, &digest);
        Ok((
            json!({
                "kind": kind_name(kind),
                "epoch": n,
                "data": codec::b64(&data),
                "entry_hash": codec::hex0x(&entry_hash),
                "epoch_commitment": codec::hex0x(epoch_commitment),
                "next_commit_key": codec::hex0x(next_commit_key),
                "signature": codec::hex0x(&signature),
                "padded_len": data.len(),
            }),
            entry_hash,
        ))
    }

    pub fn create_commit(&mut self, g: &str, ops_json: &str) -> Result<String> {
        let gb = codec::parse_g(g)?;
        let ops: CommitOps = serde_json::from_str(ops_json)
            .map_err(|e| MlsError::new(Code::BadInput, format!("commit ops: {e}")))?;
        let cwk = self.credential_with_key().ok();
        let Device {
            provider,
            signer,
            groups,
            identity,
            ..
        } = self;
        let st = groups
            .get_mut(g)
            .ok_or_else(|| MlsError::new(Code::NoGroup, "no such group on this device"))?;
        if !st.mls.is_active() {
            return Err(MlsError::new(
                Code::NotMember,
                "this device is no longer a member",
            ));
        }
        if st.mls.pending_commit().is_some() || st.aux.pending.is_some() {
            return Err(MlsError::new(
                Code::PendingExists,
                "a pending commit exists",
            ));
        }
        if st.aux.staged.is_some() {
            return Err(MlsError::new(
                Code::StagedExists,
                "accept or reject the staged commit first",
            ));
        }
        let own_index = st.mls.own_leaf_index();

        // Adds: OpenMLS validates signatures, lifetime, version and suite.
        let mut key_packages = Vec::with_capacity(ops.add_key_packages.len());
        for b64 in &ops.add_key_packages {
            let bytes = codec::unb64(b64, "key package")?;
            let kp_in = KeyPackageIn::tls_deserialize_exact(&bytes)
                .map_err(|_| MlsError::new(Code::BadKeyPackage, "not a TLS KeyPackage"))?;
            let kp = kp_in
                .validate(provider.crypto(), ProtocolVersion::Mls10)
                .map_err(|e| MlsError::new(Code::BadKeyPackage, format!("{e:?}")))?;
            if kp.ciphersuite() != CIPHERSUITE {
                return Err(MlsError::new(Code::BadKeyPackage, "wrong ciphersuite"));
            }
            if kp.leaf_node().credential().credential_type() != CredentialType::Basic {
                return Err(MlsError::new(
                    Code::BadKeyPackage,
                    "credential must be basic",
                ));
            }
            key_packages.push(kp);
        }

        // Pending Remove proposals to include (never one that removes us).
        let mut proposal_removed: BTreeSet<u32> = BTreeSet::new();
        if ops.include_pending_proposals {
            for qp in st.mls.pending_proposals() {
                if let Proposal::Remove(rp) = qp.proposal() {
                    if rp.removed() != own_index {
                        proposal_removed.insert(rp.removed().u32());
                    }
                }
            }
        }

        // Removes by device key.
        let mut removed_idx: Vec<LeafNodeIndex> = Vec::new();
        for dk in &ops.remove_device_keys {
            let key = parse_device_key(dk)?;
            let member = st
                .mls
                .members()
                .find(|m| m.signature_key.as_slice() == key)
                .ok_or_else(|| MlsError::new(Code::NotMember, format!("{dk} is not a member")))?;
            if member.index == own_index {
                return Err(MlsError::new(
                    Code::BadInput,
                    "a commit cannot remove its committer",
                ));
            }
            if !proposal_removed.contains(&member.index.u32())
                && !removed_idx.contains(&member.index)
            {
                removed_idx.push(member.index);
            }
        }

        // Metadata change: full GroupContext extension list in a GCE proposal.
        let gce = match &ops.metadata {
            Some(meta) => {
                let before = metadata_of(st.mls.extensions());
                if before.get("kind") != meta.get("kind") {
                    return Err(MlsError::new(
                        Code::BadMetadata,
                        "metadata.kind cannot change",
                    ));
                }
                Some(group_context_extensions(&validate_metadata(meta, g)?)?)
            }
            None => None,
        };

        if key_packages.is_empty()
            && removed_idx.is_empty()
            && proposal_removed.is_empty()
            && gce.is_none()
            && !ops.self_update
        {
            return Err(MlsError::new(
                Code::BadInput,
                "empty commit: set at least one op",
            ));
        }

        let mut all_removed: Vec<u32> = proposal_removed.iter().copied().collect();
        all_removed.extend(removed_idx.iter().map(|i| i.u32()));
        let removed_json: Vec<Value> = all_removed
            .iter()
            .filter_map(|i| {
                st.mls
                    .member_at(LeafNodeIndex::new(*i))
                    .map(|m| member_json(&m))
            })
            .collect();
        let add_indices = predict_add_indices(&st.mls, &all_removed, key_packages.len());
        let added_json: Vec<Value> = key_packages
            .iter()
            .zip(add_indices.iter())
            .map(|(kp, idx)| leaf_node_json(*idx, kp.leaf_node()))
            .collect();

        // Credential refresh rides on an explicit self-update.
        let leaf_params = match (&cwk, ops.self_update) {
            (Some(cwk), true) => {
                let current = st.mls.own_leaf_node().map(|l| identity_of(l.credential()));
                if current.as_deref() != identity.as_deref() {
                    Some(
                        LeafNodeParameters::builder()
                            .with_credential_with_key(cwk.clone())
                            .with_capabilities(leaf_capabilities())
                            .build(),
                    )
                } else {
                    None
                }
            }
            _ => None,
        };

        let include = ops.include_pending_proposals;
        let mut builder = st
            .mls
            .commit_builder()
            .consume_proposal_store(include)
            .propose_adds(key_packages)
            .propose_removals(removed_idx.iter().copied());
        if let Some(gce) = gce {
            builder = builder
                .propose_group_context_extensions(gce)
                .map_err(|e| MlsError::mls("metadata proposal", e))?;
        }
        if ops.self_update {
            builder = builder.force_self_update(true);
        }
        if let Some(params) = leaf_params {
            builder = builder.leaf_node_parameters(params);
        }
        let bundle = builder
            .load_psks(provider.storage())
            .map_err(|e| MlsError::mls("load psks", e))?
            .build(provider.rand(), provider.crypto(), signer, |qp| {
                if qp.proposal_or_ref_type() == ProposalOrRefType::Proposal {
                    return true;
                }
                match qp.proposal() {
                    Proposal::Remove(rp) => rp.removed() != own_index,
                    _ => false,
                }
            })
            .map_err(|e| MlsError::mls("build commit", e))?
            .stage_commit(provider)
            .map_err(|e| MlsError::mls("stage commit", e))?;

        let commit_bytes = bundle
            .commit()
            .to_bytes()
            .map_err(|e| MlsError::internal("serialize commit", e))?;
        let welcome = match bundle.to_welcome_msg() {
            Some(msg) => Some(
                msg.to_bytes()
                    .map_err(|e| MlsError::internal("serialize welcome", e))?,
            ),
            None => None,
        };

        let result = (|| -> Result<Value> {
            let pending = st
                .mls
                .pending_commit()
                .ok_or_else(|| MlsError::new(Code::Internal, "commit was not staged"))?;
            let (next_key, commitment, new_fp) = staged_declared(provider, pending, &gb)?;
            let new_epoch = pending.epoch().as_u64();
            let (entry, entry_hash) = Self::make_entry(
                provider,
                &st.mls,
                &gb,
                KIND_COMMIT,
                &commit_bytes,
                &commitment,
                &next_key,
            )?;
            st.aux.pending = Some(PendingOwn {
                entry_hash: codec::hex0x(&entry_hash),
                epoch: st.mls.epoch().as_u64(),
            });
            Ok(json!({
                "entry": entry,
                "welcome": welcome.as_ref().map(|w| codec::b64(w)),
                "ratchet_tree": Value::Null,
                "added": added_json,
                "removed": removed_json,
                "new_epoch": new_epoch,
                "new_epoch_fp": new_fp,
                // Local diagnostics (benchmarks); never part of the request.
                "mls_commit_len": commit_bytes.len(),
            }))
        })();
        match result {
            Ok(v) => Ok(v.to_string()),
            Err(e) => {
                let _ = st.mls.clear_pending_commit(provider.storage());
                st.aux.pending = None;
                Err(e)
            }
        }
    }

    pub fn merge_pending(&mut self, g: &str) -> Result<String> {
        let gb = codec::parse_g(g)?;
        {
            let Device {
                provider, groups, ..
            } = self;
            let st = groups
                .get_mut(g)
                .ok_or_else(|| MlsError::new(Code::NoGroup, "no such group on this device"))?;
            let pending_info = st
                .aux
                .pending
                .clone()
                .ok_or_else(|| MlsError::new(Code::NoPending, "no pending commit"))?;
            {
                let own = st.mls.own_leaf_index();
                let staged_ref = st
                    .mls
                    .pending_commit()
                    .ok_or_else(|| MlsError::new(Code::NoPending, "no pending commit"))?;
                record_transition(provider, &st.mls, &mut st.aux, &gb, staged_ref, Some(own))?;
            }
            st.mls
                .merge_pending_commit(provider)
                .map_err(|e| MlsError::mls("merge pending commit", e))?;
            st.aux.pending = None;
            st.aux.own_proposals.clear();
            st.aux.last_own_commit = Some(OwnMerged {
                entry_hash: pending_info.entry_hash,
                epoch: pending_info.epoch,
            });
        }
        self.group_summary(g)
    }

    pub fn discard_pending(&mut self, g: &str) -> Result<()> {
        let Device {
            provider, groups, ..
        } = self;
        let st = groups
            .get_mut(g)
            .ok_or_else(|| MlsError::new(Code::NoGroup, "no such group on this device"))?;
        st.mls
            .clear_pending_commit(provider.storage())
            .map_err(|e| MlsError::internal("clear pending commit", e))?;
        st.aux.pending = None;
        Ok(())
    }

    // -- proposals ---------------------------------------------------------

    pub fn propose_remove(&mut self, g: &str, device_keys_json: &str) -> Result<String> {
        let gb = codec::parse_g(g)?;
        let keys = parse_device_keys(device_keys_json)?;
        if keys.is_empty() {
            return Err(MlsError::new(Code::BadInput, "no device keys"));
        }
        let Device {
            provider,
            signer,
            groups,
            ..
        } = self;
        let st = groups
            .get_mut(g)
            .ok_or_else(|| MlsError::new(Code::NoGroup, "no such group on this device"))?;
        if !st.mls.is_active() {
            return Err(MlsError::new(
                Code::NotMember,
                "this device is no longer a member",
            ));
        }
        if st.mls.pending_commit().is_some() {
            return Err(MlsError::new(
                Code::PendingExists,
                "a pending commit exists",
            ));
        }
        let own_index = st.mls.own_leaf_index();
        let mut targets = Vec::with_capacity(keys.len());
        for key in &keys {
            let member = st
                .mls
                .members()
                .find(|m| m.signature_key.as_slice() == key)
                .ok_or_else(|| {
                    MlsError::new(
                        Code::NotMember,
                        format!("{} is not a member", codec::hex0x(key)),
                    )
                })?;
            targets.push(member.index);
        }
        let mut entries = Vec::with_capacity(targets.len());
        for idx in targets {
            let before: BTreeSet<Vec<u8>> = st
                .mls
                .pending_proposals()
                .map(|qp| qp.proposal_reference_ref().as_slice().to_vec())
                .collect();
            let msg = if idx == own_index {
                st.mls
                    .leave_group(provider, signer)
                    .map_err(|e| MlsError::mls("leave proposal", e))?
            } else {
                st.mls
                    .propose_remove_member(provider, signer, idx)
                    .map_err(|e| MlsError::mls("remove proposal", e))?
                    .0
            };
            // Keep our own proposal out of the store until the delivery
            // service sequences it (it is re-added in process_entry).
            let new_qp = st
                .mls
                .pending_proposals()
                .find(|qp| !before.contains(qp.proposal_reference_ref().as_slice()))
                .cloned()
                .ok_or_else(|| MlsError::new(Code::Internal, "proposal not queued"))?;
            st.mls
                .remove_pending_proposal(provider.storage(), new_qp.proposal_reference_ref())
                .map_err(|e| MlsError::internal("unqueue own proposal", e))?;
            let bytes = msg
                .to_bytes()
                .map_err(|e| MlsError::internal("serialize proposal", e))?;
            let (entry, entry_hash) = Self::make_entry(
                provider,
                &st.mls,
                &gb,
                KIND_PROPOSAL,
                &bytes,
                &[0u8; 32],
                &[0u8; 32],
            )?;
            st.aux.own_proposals.push(OwnProposal {
                entry_hash: codec::hex0x(&entry_hash),
                epoch: st.mls.epoch().as_u64(),
                proposal: new_qp,
            });
            entries.push(entry);
        }
        Ok(Value::Array(entries).to_string())
    }

    /// Drop pending Remove proposals that target `device_key` (policy
    /// rejection by the engine, contract 8.1.2). Returns how many were dropped.
    pub fn drop_proposals(&mut self, g: &str, device_key: &str) -> Result<u32> {
        let key = parse_device_key(device_key)?;
        let Device {
            provider, groups, ..
        } = self;
        let st = groups
            .get_mut(g)
            .ok_or_else(|| MlsError::new(Code::NoGroup, "no such group on this device"))?;
        let refs: Vec<ProposalRef> = st
            .mls
            .pending_proposals()
            .filter(|qp| match qp.proposal() {
                Proposal::Remove(rp) => st
                    .mls
                    .member_at(rp.removed())
                    .is_some_and(|m| m.signature_key.as_slice() == key),
                _ => false,
            })
            .map(|qp| qp.proposal_reference_ref().clone())
            .collect();
        for r in &refs {
            st.mls
                .remove_pending_proposal(provider.storage(), r)
                .map_err(|e| MlsError::internal("drop proposal", e))?;
        }
        Ok(refs.len() as u32)
    }

    // -- incoming entries --------------------------------------------------

    pub fn process_entry(&mut self, g: &str, item_json: &str) -> Result<String> {
        let gb = codec::parse_g(g)?;
        let entry = parse_log_entry(item_json)?;
        let entry_hash_hex = codec::hex0x(&entry.entry_hash);

        // Our own commit, already merged (e.g. merged right after the 200).
        {
            let st = self.state(g)?;
            if entry.kind == KIND_COMMIT
                && st
                    .aux
                    .last_own_commit
                    .as_ref()
                    .is_some_and(|o| o.entry_hash == entry_hash_hex && o.epoch == entry.epoch)
            {
                let mut v = self.summary_value(g, st)?;
                v["kind"] = Value::String("own".into());
                v["already_merged"] = Value::Bool(true);
                return Ok(v.to_string());
            }
            if !st.mls.is_active() {
                return Err(MlsError::new(
                    Code::NotMember,
                    "this device is no longer a member",
                ));
            }
            let n = st.mls.epoch().as_u64();
            if entry.epoch != n {
                return Err(MlsError::new(
                    Code::WrongEpoch,
                    format!("entry epoch {} but device epoch {n}", entry.epoch),
                ));
            }
            if codec::keccak256(&entry.data) != entry.entry_hash {
                return Err(MlsError::new(
                    Code::BadEntry,
                    "entry_hash != keccak256(data)",
                ));
            }
            if !ENTRY_BUCKETS.contains(&entry.data.len()) {
                return Err(MlsError::new(
                    Code::BadEntry,
                    "data length is not an entry bucket",
                ));
            }
            if entry.kind == KIND_PROPOSAL
                && (entry.epoch_commitment != [0u8; 32] || entry.next_commit_key != [0u8; 32])
            {
                return Err(MlsError::new(
                    Code::BadEntry,
                    "proposal must declare zero values",
                ));
            }
            let digest = codec::entry_digest(
                &gb,
                codec::epoch_u32(n)?,
                entry.kind,
                &entry.entry_hash,
                &entry.epoch_commitment,
                &entry.next_commit_key,
                entry.data.len() as u64,
            );
            let k_n = commit_signing_key(&self.provider, &st.mls, &gb)?;
            if !codec::verify32(k_n.verifying_key().as_bytes(), &digest, &entry.signature) {
                return Err(MlsError::new(
                    Code::BadSignature,
                    "entry signature does not verify under pub(K_epoch)",
                ));
            }
        }

        // Our own pending commit: merge it.
        if entry.kind == KIND_COMMIT {
            let is_own = self
                .state(g)?
                .aux
                .pending
                .as_ref()
                .is_some_and(|p| p.entry_hash == entry_hash_hex);
            if is_own {
                let summary = self.merge_pending(g)?;
                let mut v: Value =
                    serde_json::from_str(&summary).map_err(|e| MlsError::internal("summary", e))?;
                v["kind"] = Value::String("own".into());
                v["already_merged"] = Value::Bool(false);
                return Ok(v.to_string());
            }
        }

        let Device {
            provider, groups, ..
        } = self;
        let st = groups
            .get_mut(g)
            .ok_or_else(|| MlsError::new(Code::NoGroup, "no such group on this device"))?;

        // Our own proposal, now sequenced: queue it.
        if entry.kind == KIND_PROPOSAL {
            if let Some(pos) = st
                .aux
                .own_proposals
                .iter()
                .position(|p| p.entry_hash == entry_hash_hex)
            {
                let own = st.aux.own_proposals.remove(pos);
                let remove = match own.proposal.proposal() {
                    Proposal::Remove(rp) => st.mls.member_at(rp.removed()).map(|m| member_json(&m)),
                    _ => None,
                };
                st.mls
                    .store_pending_proposal(provider.storage(), own.proposal)
                    .map_err(|e| MlsError::internal("queue own proposal", e))?;
                let sender = st
                    .mls
                    .member_at(st.mls.own_leaf_index())
                    .map(|m| member_json(&m))
                    .unwrap_or(Value::Null);
                return Ok(json!({
                    "kind": "proposal",
                    "sender": sender,
                    "remove": remove,
                    "stored": true,
                    "own": true,
                })
                .to_string());
            }
        }

        if st.aux.staged.is_some() {
            return Err(MlsError::new(
                Code::StagedExists,
                "accept or reject the staged commit first",
            ));
        }

        let n = st.mls.epoch().as_u64();
        let wrap_key = export32(provider, &st.mls, LABEL_ENTRY_WRAP, &gb)?;
        let mls_bytes = codec::unwrap(
            &wrap_key,
            &codec::aad_entry(&gb, n, entry.kind),
            &entry.data,
            &ENTRY_BUCKETS,
        )
        .map_err(|e| {
            MlsError::new(
                if e.code == Code::DecryptFailed {
                    Code::DecryptFailed
                } else {
                    Code::BadEntry
                },
                e.message,
            )
        })?;
        let msg_in = parse_mls_message(&mls_bytes, Code::BadEntry)?;
        let protocol = msg_in
            .try_into_protocol_message()
            .map_err(|_| MlsError::new(Code::BadEntry, "not a protocol message"))?;
        if !matches!(protocol, ProtocolMessage::PrivateMessage(_)) {
            return Err(MlsError::new(
                Code::BadEntry,
                "entries must be PrivateMessages",
            ));
        }
        if protocol.group_id() != st.mls.group_id() || protocol.epoch().as_u64() != n {
            return Err(MlsError::new(Code::BadEntry, "MLS group or epoch mismatch"));
        }
        let expected = if entry.kind == KIND_COMMIT {
            ContentType::Commit
        } else {
            ContentType::Proposal
        };
        if protocol.content_type() != expected {
            return Err(MlsError::new(
                Code::BadEntry,
                "MLS content type does not match kind",
            ));
        }
        let processed = st
            .mls
            .process_message(provider, protocol)
            .map_err(|e| MlsError::new(Code::DecryptFailed, format!("process: {e:?}")))?;
        let sender_idx = match processed.sender() {
            Sender::Member(idx) => *idx,
            _ => return Err(MlsError::new(Code::BadEntry, "sender is not a member")),
        };
        let sender_json = st
            .mls
            .member_at(sender_idx)
            .map(|m| member_json(&m))
            .ok_or_else(|| MlsError::new(Code::BadEntry, "unknown sender leaf"))?;

        match processed.into_content() {
            ProcessedMessageContent::StagedCommitMessage(staged) => {
                if entry.kind != KIND_COMMIT {
                    return Err(MlsError::new(Code::BadEntry, "commit sent as proposal"));
                }
                let staged = *staged;
                let removed: Vec<u32> = staged
                    .remove_proposals()
                    .map(|rp| rp.remove_proposal().removed().u32())
                    .collect();
                let removed_json: Vec<Value> = removed
                    .iter()
                    .filter_map(|i| {
                        st.mls
                            .member_at(LeafNodeIndex::new(*i))
                            .map(|m| member_json(&m))
                    })
                    .collect();
                let adds: Vec<Value> = {
                    let leaves: Vec<LeafNode> = staged
                        .add_proposals()
                        .map(|ap| ap.add_proposal().key_package().leaf_node().clone())
                        .collect();
                    let idx = predict_add_indices(&st.mls, &removed, leaves.len());
                    leaves
                        .iter()
                        .zip(idx.iter())
                        .map(|(leaf, i)| leaf_node_json(*i, leaf))
                        .collect()
                };
                let self_removed = staged.self_removed();
                let metadata_before = metadata_of(st.mls.extensions());
                let metadata_after = metadata_of(staged.group_context().extensions());
                let new_epoch = staged.epoch().as_u64();
                let (declared_ok, new_fp) = if self_removed {
                    (Value::Null, Value::Null)
                } else {
                    let (next_key, commitment, fp) = staged_declared(provider, &staged, &gb)?;
                    (
                        Value::Bool(
                            next_key == entry.next_commit_key
                                && commitment == entry.epoch_commitment,
                        ),
                        Value::String(fp),
                    )
                };
                let path_leaf = staged
                    .update_path_leaf_node()
                    .map(|l| leaf_node_json(sender_idx.u32(), l));
                st.aux.staged = Some(StagedIncoming {
                    entry_hash: entry_hash_hex,
                    epoch: n,
                    sender: sender_idx.u32(),
                    commit: staged,
                });
                Ok(json!({
                    "kind": "commit",
                    "sender": sender_json,
                    "added": adds,
                    "removed": removed_json,
                    "metadata_before": metadata_before,
                    "metadata_after": metadata_after,
                    "self_removed": self_removed,
                    "new_epoch": new_epoch,
                    "new_epoch_fp": new_fp,
                    "declared_ok": declared_ok,
                    "sender_leaf_after": path_leaf,
                })
                .to_string())
            }
            ProcessedMessageContent::ProposalMessage(qp) => {
                if entry.kind != KIND_PROPOSAL {
                    return Err(MlsError::new(Code::BadEntry, "proposal sent as commit"));
                }
                let qp = *qp;
                match qp.proposal() {
                    Proposal::Remove(rp) => {
                        let remove = st.mls.member_at(rp.removed()).map(|m| member_json(&m));
                        let stored = remove.is_some();
                        if stored {
                            st.mls
                                .store_pending_proposal(provider.storage(), qp)
                                .map_err(|e| MlsError::internal("queue proposal", e))?;
                        }
                        Ok(json!({
                            "kind": "proposal",
                            "sender": sender_json,
                            "remove": remove,
                            "stored": stored,
                            "own": false,
                        })
                        .to_string())
                    }
                    _ => Ok(json!({
                        "kind": "proposal",
                        "sender": sender_json,
                        "remove": Value::Null,
                        "stored": false,
                        "own": false,
                    })
                    .to_string()),
                }
            }
            ProcessedMessageContent::OwnPrivateMessage => Err(MlsError::new(
                Code::BadEntry,
                "entry authored by this device but unknown to it",
            )),
            _ => Err(MlsError::new(Code::BadEntry, "unexpected content in entry")),
        }
    }

    pub fn accept_staged(&mut self, g: &str) -> Result<String> {
        let gb = codec::parse_g(g)?;
        {
            let Device {
                provider, groups, ..
            } = self;
            let st = groups
                .get_mut(g)
                .ok_or_else(|| MlsError::new(Code::NoGroup, "no such group on this device"))?;
            let staged = st
                .aux
                .staged
                .take()
                .ok_or_else(|| MlsError::new(Code::NoStaged, "no staged commit"))?;
            let committer = LeafNodeIndex::new(staged.sender);
            let res = record_transition(
                provider,
                &st.mls,
                &mut st.aux,
                &gb,
                &staged.commit,
                Some(committer),
            );
            if let Err(e) = res {
                st.aux.staged = Some(staged);
                return Err(e);
            }
            st.mls
                .merge_staged_commit(provider, staged.commit)
                .map_err(|e| MlsError::mls("merge staged commit", e))?;
            st.aux.pending = None;
            st.aux.own_proposals.clear();
        }
        self.group_summary(g)
    }

    pub fn reject_staged(&mut self, g: &str) -> Result<()> {
        let st = self
            .groups
            .get_mut(g)
            .ok_or_else(|| MlsError::new(Code::NoGroup, "no such group on this device"))?;
        st.aux.staged = None;
        Ok(())
    }

    // -- welcomes ----------------------------------------------------------

    pub fn join_welcome(
        &mut self,
        g: &str,
        welcome: &[u8],
        ratchet_tree: Option<&[u8]>,
    ) -> Result<String> {
        let gb = codec::parse_g(g)?;
        if let Some(existing) = self.groups.get(g) {
            if existing.mls.is_active() {
                return Err(MlsError::new(
                    Code::BadWelcome,
                    "already a member of this group",
                ));
            }
        }
        let welcome = match parse_mls_message(welcome, Code::BadWelcome)?.extract() {
            MlsMessageBodyIn::Welcome(w) => w,
            _ => return Err(MlsError::new(Code::BadWelcome, "not a Welcome")),
        };
        if welcome.ciphersuite() != CIPHERSUITE {
            return Err(MlsError::new(Code::BadWelcome, "wrong ciphersuite"));
        }
        // Find our KeyPackage without consuming it.
        let mut found: Option<(KeyPackageRef, KeyPackageBundle)> = None;
        for egs in welcome.secrets() {
            let r = egs.new_member();
            let bundle: Option<KeyPackageBundle> = self
                .provider
                .storage()
                .key_package(&r)
                .map_err(|e| MlsError::internal("read key package", e))?;
            if let Some(b) = bundle {
                found = Some((r, b));
                break;
            }
        }
        let (kp_ref, bundle) = found.ok_or_else(|| {
            MlsError::new(Code::NoKeyPackage, "no local KeyPackage for this Welcome")
        })?;
        let last_resort = bundle.key_package().last_resort();

        let scratch = Provider::default();
        scratch
            .storage()
            .write_key_package(&kp_ref, &bundle)
            .map_err(|e| MlsError::internal("scratch key package", e))?;
        let ratchet_tree_in = match ratchet_tree {
            Some(bytes) => Some(
                RatchetTreeIn::tls_deserialize_exact(bytes)
                    .map_err(|_| MlsError::new(Code::BadWelcome, "bad ratchet tree"))?,
            ),
            None => None,
        };
        let mut join = StagedWelcome::build_from_welcome(&scratch, &Self::join_config(), welcome)
            .map_err(|e| MlsError::new(Code::BadWelcome, format!("{e:?}")))?
            .skip_lifetime_validation();
        if let Some(tree) = ratchet_tree_in {
            join = join.with_ratchet_tree(tree);
        }
        let staged = join
            .build()
            .map_err(|e| MlsError::new(Code::BadWelcome, format!("{e:?}")))?;

        let metadata = metadata_of(staged.group_context().extensions());
        if metadata.get("g").and_then(Value::as_str) != Some(g) {
            return Err(MlsError::new(
                Code::BadWelcome,
                "metadata.g does not match the handle",
            ));
        }
        let own_leaf = staged
            .own_leaf_node()
            .ok_or_else(|| MlsError::new(Code::BadWelcome, "own leaf missing"))?;
        if own_leaf.signature_key().as_slice() != self.signer.public() {
            return Err(MlsError::new(
                Code::BadWelcome,
                "own leaf has another signature key",
            ));
        }
        let sender_idx = staged.welcome_sender_index();
        let sender = staged
            .welcome_sender()
            .map(|l| leaf_node_json(sender_idx.u32(), l))
            .map_err(|e| MlsError::new(Code::BadWelcome, format!("{e:?}")))?;
        let members: Vec<Value> = staged.members().map(|m| member_json(&m)).collect();
        let group_id = staged.group_context().group_id().clone();

        let mls = staged
            .into_group(&scratch)
            .map_err(|e| MlsError::new(Code::BadWelcome, format!("{e:?}")))?;
        let k = commit_signing_key(&scratch, &mls, &gb)?;
        let summary = json!({
            "g": g,
            "epoch": mls.epoch().as_u64(),
            "epoch_fp": codec::fp(mls.epoch_authenticator().as_slice()),
            "metadata": metadata,
            "members": members,
            "sender": sender,
            "commit_key": codec::hex0x(k.verifying_key().as_bytes()),
            "own_leaf": mls.own_leaf_index().u32(),
        });
        self.staged_welcomes.insert(
            g.to_string(),
            StagedJoin {
                scratch: scratch.storage,
                group_id,
                kp_ref,
                last_resort,
                summary: summary.clone(),
            },
        );
        Ok(summary.to_string())
    }

    pub fn accept_welcome(&mut self, g: &str) -> Result<String> {
        let staged = self
            .staged_welcomes
            .remove(g)
            .ok_or_else(|| MlsError::new(Code::NoStagedWelcome, "no staged welcome"))?;
        // Replace an inactive copy (re-added after removal).
        if let Some(mut old) = self.groups.remove(g) {
            if old.mls.is_active() {
                self.groups.insert(g.to_string(), old);
                return Err(MlsError::new(
                    Code::BadWelcome,
                    "already a member of this group",
                ));
            }
            old.mls
                .delete(self.provider.storage())
                .map_err(|e| MlsError::internal("delete old group", e))?;
        }
        if let Some(mut stale) = MlsGroup::load(self.provider.storage(), &staged.group_id)
            .map_err(|e| MlsError::internal("load group", e))?
        {
            stale
                .delete(self.provider.storage())
                .map_err(|e| MlsError::internal("delete stale group", e))?;
        }
        self.provider.merge_from(&staged.scratch)?;
        if !staged.last_resort {
            self.provider
                .storage()
                .delete_key_package(&staged.kp_ref)
                .map_err(|e| MlsError::internal("consume key package", e))?;
        }
        let mls = MlsGroup::load(self.provider.storage(), &staged.group_id)
            .map_err(|e| MlsError::internal("load joined group", e))?
            .ok_or_else(|| MlsError::new(Code::Internal, "joined group missing"))?;
        let aux = GroupAux {
            group_id: hex::encode(staged.group_id.as_slice()),
            ..GroupAux::default()
        };
        let _ = staged.summary;
        self.groups.insert(g.to_string(), GroupState { mls, aux });
        self.group_summary(g)
    }

    pub fn reject_welcome(&mut self, g: &str) -> Result<()> {
        let staged = self
            .staged_welcomes
            .remove(g)
            .ok_or_else(|| MlsError::new(Code::NoStagedWelcome, "no staged welcome"))?;
        if !staged.last_resort {
            self.provider
                .storage()
                .delete_key_package(&staged.kp_ref)
                .map_err(|e| MlsError::internal("consume key package", e))?;
        }
        Ok(())
    }

    // -- application messages ----------------------------------------------

    pub fn encrypt_message(&mut self, g: &str, body: &[u8]) -> Result<String> {
        let gb = codec::parse_g(g)?;
        if body.len() + 69 + MESSAGE_FRAMING_RESERVE > codec::max_payload(&MESSAGE_BUCKETS) {
            return Err(MlsError::new(Code::TooLarge, "message body too large"));
        }
        let Device {
            provider,
            signer,
            sign_key,
            groups,
            ..
        } = self;
        let st = groups
            .get_mut(g)
            .ok_or_else(|| MlsError::new(Code::NoGroup, "no such group on this device"))?;
        if !st.mls.is_active() {
            return Err(MlsError::new(
                Code::NotMember,
                "this device is no longer a member",
            ));
        }
        if st.mls.pending_proposals().next().is_some() {
            return Err(MlsError::new(
                Code::PendingProposals,
                "commit pending proposals first",
            ));
        }
        let n = codec::epoch_u32(st.mls.epoch().as_u64())?;
        let sig = codec::sign32(sign_key, &codec::message_digest(&gb, n, body));
        let inner = codec::encode_inner(body, &sig)?;
        let msg = st
            .mls
            .create_message(provider, signer, &inner)
            .map_err(|e| MlsError::mls("create message", e))?;
        let bytes = msg
            .to_bytes()
            .map_err(|e| MlsError::internal("serialize message", e))?;
        let wrap_key = export32(provider, &st.mls, LABEL_MESSAGE_WRAP, &gb)?;
        let data = codec::wrap(
            &wrap_key,
            &codec::aad_message(&gb, n),
            &bytes,
            &MESSAGE_BUCKETS,
            provider.random12()?,
        )?;
        Ok(json!({
            "epoch": n,
            "data": codec::b64(&data),
            "epoch_fp": codec::fp(st.mls.epoch_authenticator().as_slice()),
            "padded_len": data.len(),
        })
        .to_string())
    }

    pub fn decrypt_message(&mut self, g: &str, item_json: &str) -> Result<String> {
        let gb = codec::parse_g(g)?;
        let item: Value = serde_json::from_str(item_json)
            .map_err(|_| MlsError::new(Code::BadMessage, "item is not JSON"))?;
        let obj = item
            .as_object()
            .ok_or_else(|| MlsError::new(Code::BadMessage, "item must be an object"))?;
        if let Some(t) = obj.get("type").and_then(Value::as_str) {
            if t != "message" {
                return Err(MlsError::new(Code::BadMessage, "item type is not message"));
            }
        }
        let m = obj
            .get("epoch")
            .and_then(Value::as_u64)
            .ok_or_else(|| MlsError::new(Code::BadMessage, "missing field epoch"))?;
        let data = codec::unb64(str_field(obj, "data", Code::BadMessage)?, "data")
            .map_err(|e| MlsError::new(Code::BadMessage, e.message))?;

        let Device {
            provider, groups, ..
        } = self;
        let st = groups
            .get_mut(g)
            .ok_or_else(|| MlsError::new(Code::NoGroup, "no such group on this device"))?;
        if !st.mls.is_active() {
            return Err(MlsError::new(
                Code::NotMember,
                "this device is no longer a member",
            ));
        }
        let n = st.mls.epoch().as_u64();
        let (wrap_key, our_fp): (Zeroizing<[u8; 32]>, String) = if m == n {
            (
                export32(provider, &st.mls, LABEL_MESSAGE_WRAP, &gb)?,
                codec::fp(st.mls.epoch_authenticator().as_slice()),
            )
        } else if let Some(past) = st.aux.past_epochs.iter().find(|p| p.epoch == m) {
            let raw = codec::unb64(&past.wrap_m, "wrap key")?;
            let mut key = Zeroizing::new([0u8; 32]);
            if raw.len() != 32 {
                return Err(MlsError::new(Code::BadState, "stored wrap key length"));
            }
            key.copy_from_slice(&raw);
            (key, past.epoch_fp.clone())
        } else {
            return Err(MlsError::new(
                Code::WrongEpoch,
                format!("no keys for epoch {m} (device epoch {n})"),
            ));
        };
        let mls_bytes = codec::unwrap(
            &wrap_key,
            &codec::aad_message(&gb, m),
            &data,
            &MESSAGE_BUCKETS,
        )
        .map_err(|e| {
            MlsError::new(
                if e.code == Code::DecryptFailed {
                    Code::DecryptFailed
                } else {
                    Code::BadMessage
                },
                e.message,
            )
        })?;
        let protocol = parse_mls_message(&mls_bytes, Code::BadMessage)?
            .try_into_protocol_message()
            .map_err(|_| MlsError::new(Code::BadMessage, "not a protocol message"))?;
        if !matches!(protocol, ProtocolMessage::PrivateMessage(_))
            || protocol.content_type() != ContentType::Application
        {
            return Err(MlsError::new(
                Code::BadMessage,
                "not an application PrivateMessage",
            ));
        }
        if protocol.group_id() != st.mls.group_id() || protocol.epoch().as_u64() != m {
            return Err(MlsError::new(
                Code::BadMessage,
                "MLS group or epoch mismatch",
            ));
        }
        let processed = st
            .mls
            .process_message(provider, protocol)
            .map_err(|e| MlsError::new(Code::DecryptFailed, format!("process: {e:?}")))?;
        let sender_idx = match processed.sender() {
            Sender::Member(idx) => *idx,
            _ => return Err(MlsError::new(Code::BadMessage, "sender is not a member")),
        };
        let sender_credential = processed.credential().clone();
        let inner = match processed.into_content() {
            ProcessedMessageContent::ApplicationMessage(am) => am.into_bytes(),
            ProcessedMessageContent::OwnPrivateMessage => {
                return Err(MlsError::new(Code::OwnMessage, "sent by this device"))
            }
            _ => {
                return Err(MlsError::new(
                    Code::BadMessage,
                    "not an application message",
                ))
            }
        };
        // Sender leaf as of epoch m.
        let historic = st
            .aux
            .past_leaves
            .iter()
            .filter(|p| p.leaf == sender_idx.u32() && p.until_epoch >= m)
            .min_by_key(|p| p.until_epoch);
        let (device_key, identity) = match historic {
            Some(p) if m < n => (p.device_key.clone(), p.identity.clone()),
            _ => {
                let member = st
                    .mls
                    .member_at(sender_idx)
                    .ok_or_else(|| MlsError::new(Code::BadMessage, "unknown sender leaf"))?;
                (
                    codec::hex0x(&member.signature_key),
                    identity_of(&member.credential),
                )
            }
        };
        if identity != identity_of(&sender_credential) {
            return Err(MlsError::new(
                Code::BadMessage,
                "sender credential mismatch",
            ));
        }
        let (body, sig) = codec::decode_inner(&inner)?;
        let pubkey = parse_device_key(&device_key)?;
        let sig_ok = codec::verify32(&pubkey, &codec::message_digest(&gb, m, &body), &sig);
        Ok(json!({
            "sender": { "leaf": sender_idx.u32(), "device_key": device_key, "identity": identity },
            "body": codec::b64(&body),
            "sig_ok": sig_ok,
            "signature": codec::hex0x(&sig),
            "sig": codec::hex0x(&sig),
            "epoch": m,
            "epoch_fp": our_fp,
        })
        .to_string())
    }

    pub fn sign_roster(&self, g: &str, device_keys_json: &str) -> Result<String> {
        let gb = codec::parse_g(g)?;
        let keys = parse_device_keys(device_keys_json)?;
        let st = self.state(g)?;
        if !st.mls.is_active() {
            return Err(MlsError::new(
                Code::NotMember,
                "this device is no longer a member",
            ));
        }
        let n = codec::epoch_u32(st.mls.epoch().as_u64())?;
        let digest = codec::roster_digest(&gb, n, &keys);
        let k_n = commit_signing_key(&self.provider, &st.mls, &gb)?;
        Ok(json!({
            "epoch": n,
            "signature": codec::hex0x(&codec::sign32(&k_n, &digest)),
            "digest": codec::hex0x(&digest),
        })
        .to_string())
    }

    /// Native-only test hook (not exported to JS): sign a digest with K_n of
    /// the current epoch, to build adversarial entries in tests.
    #[doc(hidden)]
    pub fn sign_with_commit_key(&self, g: &str, digest: &[u8; 32]) -> Result<[u8; 64]> {
        let gb = codec::parse_g(g)?;
        let st = self.state(g)?;
        let k_n = commit_signing_key(&self.provider, &st.mls, &gb)?;
        Ok(codec::sign32(&k_n, digest))
    }

    /// Native-only test hook (not exported to JS): encrypt an arbitrary inner
    /// envelope, to test inner-signature checks.
    #[doc(hidden)]
    pub fn encrypt_inner_unchecked(&mut self, g: &str, inner: &[u8]) -> Result<String> {
        let gb = codec::parse_g(g)?;
        let Device {
            provider,
            signer,
            groups,
            ..
        } = self;
        let st = groups
            .get_mut(g)
            .ok_or_else(|| MlsError::new(Code::NoGroup, "no such group on this device"))?;
        let n = st.mls.epoch().as_u64();
        let msg = st
            .mls
            .create_message(provider, signer, inner)
            .map_err(|e| MlsError::mls("create message", e))?;
        let bytes = msg
            .to_bytes()
            .map_err(|e| MlsError::internal("serialize message", e))?;
        let wrap_key = export32(provider, &st.mls, LABEL_MESSAGE_WRAP, &gb)?;
        let data = codec::wrap(
            &wrap_key,
            &codec::aad_message(&gb, n),
            &bytes,
            &MESSAGE_BUCKETS,
            provider.random12()?,
        )?;
        Ok(json!({ "epoch": n, "data": codec::b64(&data) }).to_string())
    }

    /// Test and diagnostics helper: the epoch commitment of the current epoch.
    pub fn current_epoch_commitment(&self, g: &str) -> Result<String> {
        let gb = codec::parse_g(g)?;
        let st = self.state(g)?;
        Ok(codec::hex0x(&context_commitment(
            &gb,
            st.mls.public_group().group_context(),
        )?))
    }
}

/// Record what a merge is about to make unreachable: this epoch's message
/// wrap key and fingerprint (for late messages of this epoch), and the old
/// content of leaves that the commit removes or changes.
fn record_transition(
    provider: &Provider,
    mls: &MlsGroup,
    aux: &mut GroupAux,
    gb: &[u8; 32],
    staged: &StagedCommit,
    committer: Option<LeafNodeIndex>,
) -> Result<()> {
    let n = mls.epoch().as_u64();
    if mls.is_active() {
        let wrap_m = export32(provider, mls, LABEL_MESSAGE_WRAP, gb)?;
        aux.past_epochs.retain(|p| p.epoch != n);
        aux.past_epochs.push(PastEpoch {
            epoch: n,
            wrap_m: codec::b64(&wrap_m[..]),
            epoch_fp: codec::fp(mls.epoch_authenticator().as_slice()),
        });
    }
    let mut push_old = |idx: LeafNodeIndex, m: &Member| {
        aux.past_leaves.push(PastLeaf {
            until_epoch: n,
            leaf: idx.u32(),
            device_key: codec::hex0x(&m.signature_key),
            identity: identity_of(&m.credential),
        });
    };
    for rp in staged.remove_proposals() {
        let idx = rp.remove_proposal().removed();
        if let Some(m) = mls.member_at(idx) {
            push_old(idx, &m);
        }
    }
    if let (Some(idx), Some(new_leaf)) = (committer, staged.update_path_leaf_node()) {
        if let Some(m) = mls.member_at(idx) {
            if identity_of(&m.credential) != identity_of(new_leaf.credential())
                || m.signature_key.as_slice() != new_leaf.signature_key().as_slice()
            {
                push_old(idx, &m);
            }
        }
    }
    let keep_from = (n + 1).saturating_sub(MAX_PAST_EPOCHS as u64);
    aux.past_epochs.retain(|p| p.epoch >= keep_from);
    aux.past_leaves.retain(|p| p.until_epoch >= keep_from);
    Ok(())
}

/// `H(name, ...)` over raw words, for helpers exposed to JS.
pub fn h_words(name: &str, words: &[Word<'_>]) -> [u8; 32] {
    codec::h(name, words)
}
