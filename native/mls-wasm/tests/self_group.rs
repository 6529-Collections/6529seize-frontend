//! Self groups (D175, design P60): a group whose members are only one user's
//! own devices, used to sync read positions between them. The module accepts
//! the "self" kind and an optional `created` time; the engine enforces who
//! may be a member.

mod common;

use common::*;
use mls_wasm::codec::{self, MESSAGE_BUCKETS};
use mls_wasm::device::CIPHERSUITE_AES256;
use mls_wasm::Code;
use serde_json::{json, Value};

/// Read-sync payloads are padded to this length (P60 §3) so every one
/// encrypts into the same message bucket.
const READ_SYNC_BODY_BYTES: usize = 3072;
const READ_SYNC_BUCKET: usize = 4096;

fn self_metadata(g: &str, created: Value) -> String {
    json!({
        "v": 1, "g": g, "kind": "self", "name": null,
        "admins": ["p-alice"], "created_by": "p-alice",
        "history": "from_join", "created": created
    })
    .to_string()
}

#[test]
fn self_group_joins_and_carries_fixed_size_payloads() {
    let mut ds = Ds::default();
    let g = new_g(200);
    let mut phone = Client::new("alice-phone");
    let mut laptop = Client::new("alice-laptop");

    let created = parse(
        &phone
            .dev
            .create_group_for(
                CIPHERSUITE_AES256,
                &g,
                &self_metadata(&g, json!(1_762_790_400_000u64)),
            )
            .unwrap(),
    );
    assert_eq!(created["metadata"]["kind"], "self");
    assert_eq!(created["metadata"]["created"], 1_762_790_400_000u64);
    assert_eq!(created["ciphersuite"], u16::from(CIPHERSUITE_AES256));
    ds.create_group(&g, created["commit_key"].as_str().unwrap());
    phone.cursor.insert(g.clone(), 0);

    let res = phone
        .commit(
            &mut ds,
            &g,
            json!({ "add_key_packages": [laptop.key_package_on(CIPHERSUITE_AES256)] }),
        )
        .unwrap();
    let joined = laptop.join(&ds, &g, res["welcome"].as_str().unwrap());
    assert_eq!(joined["metadata"]["kind"], "self");
    assert_eq!(joined["metadata"]["created"], 1_762_790_400_000u64);

    // Every read-sync payload is padded to the same length, so its
    // ciphertext always lands in the same bucket, whatever it carries.
    for filler in [b' ', b'0'] {
        let mut body = br#"{"v":1,"t":"read","r":[],"p":""#.to_vec();
        body.resize(READ_SYNC_BODY_BYTES - 2, filler);
        body.extend_from_slice(br#""}"#);
        assert_eq!(body.len(), READ_SYNC_BODY_BYTES);
        let out = parse(&phone.dev.encrypt_message(&g, &body).unwrap());
        let data = codec::unb64(out["data"].as_str().unwrap(), "d").unwrap();
        assert_eq!(data.len(), READ_SYNC_BUCKET);
        assert!(MESSAGE_BUCKETS.contains(&data.len()));
        ds.send_message(&g, &out).unwrap();
        let got = laptop.sync(&ds, &g);
        let plain = codec::unb64(got[0]["body"].as_str().unwrap(), "b").unwrap();
        assert_eq!(plain, body);
        assert_eq!(got[0]["sender"]["device_key"], phone.key());
        assert_eq!(got[0]["sig_ok"], true);
    }
}

#[test]
fn self_kind_cannot_change_and_unknown_kinds_still_fail() {
    let mut ds = Ds::default();
    let g = new_g(201);
    let mut phone = Client::new("alice-phone");
    let created = parse(
        &phone
            .dev
            .create_group_for(CIPHERSUITE_AES256, &g, &self_metadata(&g, json!(1)))
            .unwrap(),
    );
    ds.create_group(&g, created["commit_key"].as_str().unwrap());
    phone.cursor.insert(g.clone(), 0);

    // A self group never turns into a chat, nor a chat into a self group.
    let as_group: Value = parse(&metadata(&g, "group", Some("Renamed")));
    let err = phone
        .dev
        .create_commit(&g, &json!({ "metadata": as_group }).to_string())
        .unwrap_err();
    assert_eq!(err.code, Code::BadMetadata);

    let dm = new_g(202);
    let mut bob = Client::new("bob");
    group_of(&mut ds, &dm, &mut phone, &mut [&mut bob]);
    let as_self: Value = parse(&self_metadata(&dm, json!(1)));
    let err = phone
        .dev
        .create_commit(&dm, &json!({ "metadata": as_self }).to_string())
        .unwrap_err();
    assert_eq!(err.code, Code::BadMetadata);

    for (kind, created) in [
        ("channel", json!(1)),
        ("self", json!(-1)),
        ("self", json!("2026")),
        ("self", json!(1.5)),
    ] {
        let other = new_g(203);
        let meta = json!({
            "v": 1, "g": other, "kind": kind, "name": null,
            "admins": ["p-alice"], "created_by": "p-alice",
            "history": "from_join", "created": created
        })
        .to_string();
        let err = phone
            .dev
            .create_group_for(CIPHERSUITE_AES256, &other, &meta)
            .unwrap_err();
        assert_eq!(err.code, Code::BadMetadata, "{kind} {created}");
    }
}
