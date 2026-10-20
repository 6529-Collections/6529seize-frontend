//! wasm-bindgen surface (contract section 10). Thin: every method forwards to
//! [`Device`] and turns errors into `Error("E2EE_WASM:<CODE>: <message>")`.

use wasm_bindgen::prelude::*;

use crate::codec;
use crate::device::Device;
use crate::error::{Code, MlsError};

fn js_err(e: MlsError) -> JsValue {
    js_sys::Error::new(&e.to_string()).into()
}

fn bad(msg: &str) -> JsValue {
    js_err(MlsError::new(Code::BadInput, msg))
}

type JsResult<T> = Result<T, JsValue>;

/// One MLS device (signature key, credential, groups).
#[wasm_bindgen]
pub struct MlsDevice {
    inner: Device,
}

#[wasm_bindgen]
impl MlsDevice {
    /// Fresh device with a new Ed25519 signature key.
    pub fn create() -> JsResult<MlsDevice> {
        Ok(MlsDevice {
            inner: Device::create().map_err(js_err)?,
        })
    }

    /// Restore a device from `exportState()` bytes.
    pub fn load(state: &[u8]) -> JsResult<MlsDevice> {
        Ok(MlsDevice {
            inner: Device::load(state).map_err(js_err)?,
        })
    }

    /// Signer, credential, all MLS storage, pending and staged commits.
    /// Staged Welcomes are not included (call `joinWelcome` again).
    #[wasm_bindgen(js_name = exportState)]
    pub fn export_state(&self) -> JsResult<Vec<u8>> {
        self.inner.export_state().map_err(js_err)
    }

    #[wasm_bindgen(js_name = deviceKey)]
    pub fn device_key(&self) -> String {
        self.inner.device_key()
    }

    #[wasm_bindgen(js_name = setCredential)]
    pub fn set_credential(&mut self, identity: &str) -> JsResult<()> {
        self.inner.set_credential(identity).map_err(js_err)
    }

    #[wasm_bindgen(js_name = credentialIdentity)]
    pub fn credential_identity(&self) -> Option<String> {
        self.inner.credential_identity()
    }

    #[wasm_bindgen(js_name = signDigest)]
    pub fn sign_digest(&self, digest32: &[u8]) -> JsResult<String> {
        self.inner.sign_digest(digest32).map_err(js_err)
    }

    #[wasm_bindgen(js_name = createKeyPackages)]
    pub fn create_key_packages(
        &mut self,
        count: u32,
        last_resort: bool,
        lifetime_secs: f64,
    ) -> JsResult<String> {
        if !(lifetime_secs.is_finite() && lifetime_secs >= 0.0 && lifetime_secs.fract() == 0.0) {
            return Err(bad("lifetimeSecs must be a non-negative integer"));
        }
        self.inner
            .create_key_packages(count, last_resort, lifetime_secs as u64)
            .map_err(js_err)
    }

    #[wasm_bindgen(js_name = createGroup)]
    pub fn create_group(&mut self, g: &str, metadata_json: &str) -> JsResult<String> {
        self.inner.create_group(g, metadata_json).map_err(js_err)
    }

    #[wasm_bindgen(js_name = groupSummary)]
    pub fn group_summary(&self, g: &str) -> JsResult<String> {
        self.inner.group_summary(g).map_err(js_err)
    }

    #[wasm_bindgen(js_name = hasGroup)]
    pub fn has_group(&self, g: &str) -> bool {
        self.inner.has_group(g)
    }

    #[wasm_bindgen(js_name = deleteGroup)]
    pub fn delete_group(&mut self, g: &str) -> JsResult<()> {
        self.inner.delete_group(g).map_err(js_err)
    }

    #[wasm_bindgen(js_name = createCommit)]
    pub fn create_commit(&mut self, g: &str, ops_json: &str) -> JsResult<String> {
        self.inner.create_commit(g, ops_json).map_err(js_err)
    }

    #[wasm_bindgen(js_name = mergePending)]
    pub fn merge_pending(&mut self, g: &str) -> JsResult<String> {
        self.inner.merge_pending(g).map_err(js_err)
    }

    #[wasm_bindgen(js_name = discardPending)]
    pub fn discard_pending(&mut self, g: &str) -> JsResult<()> {
        self.inner.discard_pending(g).map_err(js_err)
    }

    #[wasm_bindgen(js_name = proposeRemove)]
    pub fn propose_remove(&mut self, g: &str, device_keys_json: &str) -> JsResult<String> {
        self.inner
            .propose_remove(g, device_keys_json)
            .map_err(js_err)
    }

    /// Addition to contract 10: drop pending Remove proposals targeting
    /// `deviceKey` (engine policy rejection, 8.1.2). Returns the count.
    #[wasm_bindgen(js_name = dropProposals)]
    pub fn drop_proposals(&mut self, g: &str, device_key: &str) -> JsResult<u32> {
        self.inner.drop_proposals(g, device_key).map_err(js_err)
    }

    #[wasm_bindgen(js_name = processEntry)]
    pub fn process_entry(&mut self, g: &str, item_json: &str) -> JsResult<String> {
        self.inner.process_entry(g, item_json).map_err(js_err)
    }

    #[wasm_bindgen(js_name = acceptStaged)]
    pub fn accept_staged(&mut self, g: &str) -> JsResult<String> {
        self.inner.accept_staged(g).map_err(js_err)
    }

    #[wasm_bindgen(js_name = rejectStaged)]
    pub fn reject_staged(&mut self, g: &str) -> JsResult<()> {
        self.inner.reject_staged(g).map_err(js_err)
    }

    #[wasm_bindgen(js_name = joinWelcome)]
    pub fn join_welcome(
        &mut self,
        g: &str,
        welcome: &[u8],
        ratchet_tree: Option<Vec<u8>>,
    ) -> JsResult<String> {
        self.inner
            .join_welcome(g, welcome, ratchet_tree.as_deref())
            .map_err(js_err)
    }

    #[wasm_bindgen(js_name = acceptWelcome)]
    pub fn accept_welcome(&mut self, g: &str) -> JsResult<String> {
        self.inner.accept_welcome(g).map_err(js_err)
    }

    #[wasm_bindgen(js_name = rejectWelcome)]
    pub fn reject_welcome(&mut self, g: &str) -> JsResult<()> {
        self.inner.reject_welcome(g).map_err(js_err)
    }

    #[wasm_bindgen(js_name = encryptMessage)]
    pub fn encrypt_message(&mut self, g: &str, body: &[u8]) -> JsResult<String> {
        self.inner.encrypt_message(g, body).map_err(js_err)
    }

    #[wasm_bindgen(js_name = decryptMessage)]
    pub fn decrypt_message(&mut self, g: &str, item_json: &str) -> JsResult<String> {
        self.inner.decrypt_message(g, item_json).map_err(js_err)
    }

    #[wasm_bindgen(js_name = signRoster)]
    pub fn sign_roster(&self, g: &str, device_keys_json: &str) -> JsResult<String> {
        self.inner.sign_roster(g, device_keys_json).map_err(js_err)
    }
}

/// `TAG(name) = keccak256(ASCII name)`, `0x` hex.
#[wasm_bindgen(js_name = hTag)]
pub fn h_tag(name: &str) -> String {
    codec::hex0x(&codec::tag(name))
}

/// Strict Ed25519 verification over 32 raw digest bytes. False on any
/// malformed input.
#[wasm_bindgen(js_name = verifyEd25519)]
pub fn verify_ed25519(public_key: &str, digest32: &[u8], sig: &str) -> bool {
    let Ok(pk) = codec::parse_hex_n::<32>(public_key, "public key") else {
        return false;
    };
    let Ok(sig) = codec::parse_hex_n::<64>(sig, "signature") else {
        return false;
    };
    if digest32.len() != 32 {
        return false;
    }
    codec::verify32(&pk, digest32, &sig)
}

fn epoch_arg(epoch: f64) -> JsResult<u64> {
    if !(epoch.is_finite() && epoch >= 0.0 && epoch.fract() == 0.0 && epoch <= f64::from(u32::MAX))
    {
        return Err(bad("epoch must be a uint32"));
    }
    Ok(epoch as u64)
}

fn u64_arg(value: JsValue, what: &str) -> JsResult<u64> {
    if let Some(n) = value.as_f64() {
        if n.is_finite() && n >= 0.0 && n.fract() == 0.0 && n <= 9_007_199_254_740_991.0 {
            return Ok(n as u64);
        }
        return Err(bad(&format!("{what} must be a non-negative integer")));
    }
    if value.is_bigint() {
        return u64::try_from(value).map_err(|_| bad(&format!("{what} must fit uint64")));
    }
    Err(bad(&format!("{what} must be a number or bigint")))
}

/// `H("6529.MlsMessageSig.v1", bytes32 g, uint32 epoch, bytes32 keccak256(body))`.
#[wasm_bindgen(js_name = messageDigest)]
pub fn message_digest(g: &str, epoch: f64, body: &[u8]) -> JsResult<String> {
    let gb = codec::parse_g(g).map_err(js_err)?;
    Ok(codec::hex0x(&codec::message_digest(
        &gb,
        epoch_arg(epoch)?,
        body,
    )))
}

/// `H("6529.MlsDeviceRevoke.v1", bytes32 target, bytes32 revoker, uint64 revokedAt)`.
#[wasm_bindgen(js_name = revokeDigest)]
pub fn revoke_digest(
    target: &str,
    revoker: &str,
    #[wasm_bindgen(unchecked_param_type = "bigint | number")] revoked_at_secs: JsValue,
) -> JsResult<String> {
    let t = codec::parse_hex_n::<32>(target, "target").map_err(js_err)?;
    let r = codec::parse_hex_n::<32>(revoker, "revoker").map_err(js_err)?;
    let at = u64_arg(revoked_at_secs, "revokedAtSecs")?;
    Ok(codec::hex0x(&codec::revoke_digest(&t, &r, at)))
}

/// `entry_digest` (contract 3.2). `kind`: "commit" | "proposal".
#[wasm_bindgen(js_name = entryDigest)]
pub fn entry_digest(
    g: &str,
    epoch: f64,
    kind: &str,
    entry_hash: &str,
    epoch_commitment: &str,
    next_commit_key: &str,
    padded_len: u32,
) -> JsResult<String> {
    let gb = codec::parse_g(g).map_err(js_err)?;
    let kind = match kind {
        "commit" => codec::KIND_COMMIT,
        "proposal" => codec::KIND_PROPOSAL,
        _ => return Err(bad("kind must be commit or proposal")),
    };
    let eh = codec::parse_hex_n::<32>(entry_hash, "entry_hash").map_err(js_err)?;
    let ec = codec::parse_hex_n::<32>(epoch_commitment, "epoch_commitment").map_err(js_err)?;
    let nk = codec::parse_hex_n::<32>(next_commit_key, "next_commit_key").map_err(js_err)?;
    Ok(codec::hex0x(&codec::entry_digest(
        &gb,
        epoch_arg(epoch)?,
        kind,
        &eh,
        &ec,
        &nk,
        u64::from(padded_len),
    )))
}

/// Roster repair digest (ApiE2eeRosterRepairRequest).
#[wasm_bindgen(js_name = rosterDigest)]
pub fn roster_digest(g: &str, epoch: f64, device_keys_json: &str) -> JsResult<String> {
    let gb = codec::parse_g(g).map_err(js_err)?;
    let list: Vec<String> = serde_json::from_str(device_keys_json)
        .map_err(|_| bad("deviceKeysJson must be a JSON array"))?;
    let mut keys = Vec::with_capacity(list.len());
    for k in &list {
        let key = codec::parse_hex_n::<32>(k, "device key").map_err(js_err)?;
        if keys.contains(&key) {
            return Err(bad("duplicate device key"));
        }
        keys.push(key);
    }
    Ok(codec::hex0x(&codec::roster_digest(
        &gb,
        epoch_arg(epoch)?,
        &keys,
    )))
}

/// `epochCommitment = H("6529.MlsEpoch.v1", g, epoch, groupContextHash)`.
#[wasm_bindgen(js_name = epochCommitment)]
pub fn epoch_commitment(g: &str, epoch: f64, group_context_hash: &str) -> JsResult<String> {
    let gb = codec::parse_g(g).map_err(js_err)?;
    let hash = codec::parse_hex_n::<32>(group_context_hash, "groupContextHash").map_err(js_err)?;
    Ok(codec::hex0x(&codec::epoch_commitment(
        &gb,
        epoch_arg(epoch)?,
        &hash,
    )))
}

/// Module facts: versions and constants (JSON).
#[wasm_bindgen(js_name = moduleInfo)]
pub fn module_info() -> String {
    crate::module_info()
}
