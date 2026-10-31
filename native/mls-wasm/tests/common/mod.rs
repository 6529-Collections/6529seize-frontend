//! Test harness: an in-memory delivery service that applies the server checks
//! of contract 3.2 (K_n signature, epoch, hash, bucket, first commit wins) and
//! 7 (messages only for the current epoch), plus small client helpers.

#![allow(dead_code)]

use std::collections::HashMap;

use mls_wasm::codec::{self, ENTRY_BUCKETS, MESSAGE_BUCKETS};
use mls_wasm::{Code, Device};
use serde_json::{json, Value};

pub const DAY: u64 = 24 * 3600;

pub fn new_g(seed: u8) -> String {
    format!("0x{}", hex::encode([seed; 32]))
}

pub fn metadata(g: &str, kind: &str, name: Option<&str>) -> String {
    json!({
        "v": 1, "g": g, "kind": kind, "name": name,
        "admins": ["p-alice"], "created_by": "p-alice", "history": "from_join"
    })
    .to_string()
}

pub fn parse(s: &str) -> Value {
    serde_json::from_str(s).expect("json")
}

#[derive(Default)]
pub struct DsGroup {
    pub epoch: u64,
    pub commit_key: [u8; 32],
    pub items: Vec<Value>,
    pub proposals_this_epoch: u32,
}

#[derive(Default)]
pub struct Ds {
    pub groups: HashMap<String, DsGroup>,
}

#[derive(Debug, PartialEq, Eq)]
pub enum DsError {
    NoGroup,
    EpochConflict,
    EpochStale,
    BadSignature,
    BadHash,
    BadBucket,
    TooManyProposals,
}

impl Ds {
    pub fn create_group(&mut self, g: &str, commit_key_hex: &str) {
        let key = codec::parse_hex_n::<32>(commit_key_hex, "commit key").unwrap();
        self.groups.insert(
            g.to_string(),
            DsGroup {
                epoch: 0,
                commit_key: key,
                ..DsGroup::default()
            },
        );
    }

    pub fn submit_entry(&mut self, g: &str, entry: &Value) -> Result<u64, DsError> {
        let gb = codec::parse_g(g).unwrap();
        let grp = self.groups.get_mut(g).ok_or(DsError::NoGroup)?;
        let epoch = entry["epoch"].as_u64().unwrap();
        let kind = entry["kind"].as_str().unwrap();
        let data = codec::unb64(entry["data"].as_str().unwrap(), "data").unwrap();
        let entry_hash =
            codec::parse_hex_n::<32>(entry["entry_hash"].as_str().unwrap(), "h").unwrap();
        let ec =
            codec::parse_hex_n::<32>(entry["epoch_commitment"].as_str().unwrap(), "ec").unwrap();
        let nk =
            codec::parse_hex_n::<32>(entry["next_commit_key"].as_str().unwrap(), "nk").unwrap();
        let sig = codec::parse_hex_n::<64>(entry["signature"].as_str().unwrap(), "sig").unwrap();
        if epoch != grp.epoch {
            // A second commit for an epoch that already moved is a conflict.
            return Err(if kind == "commit" && epoch + 1 == grp.epoch {
                DsError::EpochConflict
            } else {
                DsError::EpochStale
            });
        }
        if codec::keccak256(&data) != entry_hash {
            return Err(DsError::BadHash);
        }
        if !ENTRY_BUCKETS.contains(&data.len())
            || entry["padded_len"].as_u64() != Some(data.len() as u64)
        {
            return Err(DsError::BadBucket);
        }
        let kind_n = if kind == "commit" {
            codec::KIND_COMMIT
        } else {
            codec::KIND_PROPOSAL
        };
        let digest =
            codec::entry_digest(&gb, epoch, kind_n, &entry_hash, &ec, &nk, data.len() as u64);
        if !codec::verify32(&grp.commit_key, &digest, &sig) {
            return Err(DsError::BadSignature);
        }
        if kind == "proposal" {
            if grp.proposals_this_epoch >= 64 {
                return Err(DsError::TooManyProposals);
            }
            grp.proposals_this_epoch += 1;
        }
        let seq = grp.items.len() as u64 + 1;
        grp.items.push(json!({
            "seq": seq, "type": "entry", "epoch": epoch, "kind": kind,
            "data": entry["data"], "entry_hash": entry["entry_hash"],
            "epoch_commitment": entry["epoch_commitment"],
            "next_commit_key": entry["next_commit_key"],
            "signature": entry["signature"],
            "roster_add": [], "roster_remove": [], "epoch_fp": null, "created_at": 0
        }));
        if kind == "commit" {
            grp.epoch += 1;
            grp.commit_key = nk;
            grp.proposals_this_epoch = 0;
        }
        Ok(seq)
    }

    pub fn send_message(&mut self, g: &str, msg: &Value) -> Result<u64, DsError> {
        let grp = self.groups.get_mut(g).ok_or(DsError::NoGroup)?;
        let epoch = msg["epoch"].as_u64().unwrap();
        if epoch != grp.epoch {
            return Err(DsError::EpochStale);
        }
        let data = codec::unb64(msg["data"].as_str().unwrap(), "data").unwrap();
        if !MESSAGE_BUCKETS.contains(&data.len()) {
            return Err(DsError::BadBucket);
        }
        let seq = grp.items.len() as u64 + 1;
        grp.items.push(json!({
            "seq": seq, "type": "message", "epoch": epoch, "kind": null,
            "data": msg["data"], "entry_hash": null, "epoch_commitment": null,
            "next_commit_key": null, "signature": null, "roster_add": [],
            "roster_remove": [], "epoch_fp": msg["epoch_fp"], "created_at": 0
        }));
        Ok(seq)
    }

    pub fn len(&self, g: &str) -> usize {
        self.groups[g].items.len()
    }

    pub fn item(&self, g: &str, seq: u64) -> Value {
        self.groups[g].items[(seq - 1) as usize].clone()
    }
}

pub struct Client {
    pub name: &'static str,
    pub dev: Device,
    pub cursor: HashMap<String, usize>,
}

impl Client {
    pub fn new(name: &'static str) -> Self {
        let mut dev = Device::create().unwrap();
        let wallet = format!(
            "0x{}",
            &hex::encode(codec::keccak256(name.as_bytes()))[..40]
        );
        let grant = codec::hex0x(&codec::keccak256(format!("grant-{name}").as_bytes()));
        dev.set_credential(&format!("6529-e2ee-v1:{wallet}:{grant}"))
            .unwrap();
        Self {
            name,
            dev,
            cursor: HashMap::new(),
        }
    }

    pub fn key(&self) -> String {
        self.dev.device_key()
    }

    pub fn key_package(&self) -> String {
        let list = parse(&self.dev.create_key_packages(1, false, 30 * DAY).unwrap());
        list[0]["data"].as_str().unwrap().to_string()
    }

    pub fn summary(&self, g: &str) -> Value {
        parse(&self.dev.group_summary(g).unwrap())
    }

    /// Create a group and register it with the DS.
    pub fn create_group(&mut self, ds: &mut Ds, g: &str, kind: &str) -> Value {
        let s = parse(&self.dev.create_group(g, &metadata(g, kind, None)).unwrap());
        ds.create_group(g, s["commit_key"].as_str().unwrap());
        self.cursor.insert(g.to_string(), 0);
        s
    }

    /// Create a commit, submit it, and on success merge it by processing our
    /// own entry from the log (the normal path).
    pub fn commit(&mut self, ds: &mut Ds, g: &str, ops: Value) -> Result<Value, DsError> {
        self.sync(ds, g);
        let res = parse(&self.dev.create_commit(g, &ops.to_string()).unwrap());
        match ds.submit_entry(g, &res["entry"]) {
            Ok(_) => {
                self.sync(ds, g);
                Ok(res)
            }
            Err(e) => {
                self.dev.discard_pending(g).unwrap();
                Err(e)
            }
        }
    }

    pub fn join(&mut self, ds: &Ds, g: &str, welcome_b64: &str) -> Value {
        let welcome = codec::unb64(welcome_b64, "welcome").unwrap();
        let ws = parse(&self.dev.join_welcome(g, &welcome, None).unwrap());
        let s = parse(&self.dev.accept_welcome(g).unwrap());
        assert_eq!(ws["epoch"], s["epoch"]);
        assert_eq!(ws["commit_key"], s["commit_key"]);
        // The server's log window starts after the entry that added us.
        self.cursor.insert(g.to_string(), ds.len(g));
        s
    }

    pub fn send(&mut self, ds: &mut Ds, g: &str, text: &str) -> u64 {
        self.sync(ds, g);
        let body = json!({"v": 1, "t": "msg", "id": "00", "ts": 0, "text": text}).to_string();
        let out = parse(&self.dev.encrypt_message(g, body.as_bytes()).unwrap());
        ds.send_message(g, &out).unwrap()
    }

    /// Process every log item after the cursor. Commits from others are
    /// accepted when their declared values match. Returns the summaries and
    /// decrypted messages in order.
    pub fn sync(&mut self, ds: &Ds, g: &str) -> Vec<Value> {
        let mut out = Vec::new();
        let start = *self.cursor.get(g).unwrap_or(&0);
        let items: Vec<Value> = ds.groups[g].items[start..].to_vec();
        for item in items {
            let seq = item["seq"].as_u64().unwrap() as usize;
            if item["type"] == "entry" {
                let r = parse(
                    &self
                        .dev
                        .process_entry(g, &item.to_string())
                        .unwrap_or_else(|e| panic!("{} process_entry seq {seq}: {e}", self.name)),
                );
                if r["kind"] == "commit" {
                    if r["self_removed"] == true {
                        self.dev.accept_staged(g).unwrap();
                    } else {
                        assert_eq!(r["declared_ok"], true, "{} declared values", self.name);
                        self.dev.accept_staged(g).unwrap();
                    }
                }
                out.push(r);
            } else {
                match self.dev.decrypt_message(g, &item.to_string()) {
                    Ok(m) => out.push(parse(&m)),
                    Err(e) if e.code == Code::OwnMessage => {}
                    Err(e) => panic!("{} decrypt seq {seq}: {e}", self.name),
                }
            }
            self.cursor.insert(g.to_string(), seq);
            if !self.dev.has_group(g) || self.summary(g)["active"] == false {
                break;
            }
        }
        out
    }
}

pub fn body_text(msg: &Value) -> String {
    let body = codec::unb64(msg["body"].as_str().unwrap(), "body").unwrap();
    let v: Value = serde_json::from_slice(&body).unwrap();
    v["text"].as_str().unwrap().to_string()
}

/// Alice creates a group and adds the others in one commit.
pub fn group_of(ds: &mut Ds, g: &str, alice: &mut Client, others: &mut [&mut Client]) {
    alice.create_group(ds, g, if others.len() == 1 { "dm" } else { "group" });
    let kps: Vec<String> = others.iter().map(|c| c.key_package()).collect();
    let res = alice
        .commit(ds, g, json!({ "add_key_packages": kps }))
        .unwrap();
    let welcome = res["welcome"].as_str().unwrap().to_string();
    for c in others.iter_mut() {
        c.join(ds, g, &welcome);
    }
}
