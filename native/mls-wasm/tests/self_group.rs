//! Self groups (D175, design P60): a group whose members are only one user's
//! own devices, used to sync read positions between them. The module accepts
//! the "self" kind and an optional `created` time; the engine enforces who
//! may be a member.

mod common;

use common::*;
use mls_wasm::codec::{self, MESSAGE_BUCKETS};
use mls_wasm::device::{key_package_info, CIPHERSUITE_AES256, METADATA_EXTENSION};
use mls_wasm::Code;
use openmls::prelude::*;
use openmls_basic_credential::SignatureKeyPair;
use openmls_rust_crypto::OpenMlsRustCrypto;
use serde_json::{json, Value};
use tls_codec::Serialize as _;

/// A KeyPackage as a client built before self groups makes it: its leaf
/// lists the metadata extension but not the self-group capability.
fn legacy_key_package() -> String {
    let provider = OpenMlsRustCrypto::default();
    let suite = CIPHERSUITE_AES256;
    let signer = SignatureKeyPair::new(suite.signature_algorithm()).unwrap();
    let credential = CredentialWithKey {
        credential: BasicCredential::new(b"6529-e2ee-v1:legacy".to_vec()).into(),
        signature_key: signer.public().into(),
    };
    let capabilities = Capabilities::builder()
        .ciphersuites(vec![suite])
        .extensions(vec![ExtensionType::Unknown(METADATA_EXTENSION)])
        .credentials(vec![CredentialType::Basic])
        .build();
    let bundle = KeyPackage::builder()
        .leaf_node_capabilities(capabilities)
        .build(suite, &provider, &signer, credential)
        .unwrap();
    let bytes = bundle.key_package().tls_serialize_detached().unwrap();
    codec::b64(&bytes)
}

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

#[test]
fn self_groups_admit_only_key_packages_that_support_them() {
    let mut ds = Ds::default();
    let phone = Client::new("alice-phone");
    let current = phone.key_package_on(CIPHERSUITE_AES256);
    let legacy = legacy_key_package();

    // The engine can tell the two apart before claiming them into a group.
    let info = |kp: &str| parse(&key_package_info(&codec::unb64(kp, "kp").unwrap()).unwrap());
    assert_eq!(info(&current)["self_sync"], true);
    assert_eq!(info(&current)["ciphersuite"], u16::from(CIPHERSUITE_AES256));
    assert_eq!(info(&legacy)["self_sync"], false);

    let mut phone = phone;
    let g = new_g(204);
    let created = parse(
        &phone
            .dev
            .create_group_for(CIPHERSUITE_AES256, &g, &self_metadata(&g, json!(1)))
            .unwrap(),
    );
    ds.create_group(&g, created["commit_key"].as_str().unwrap());
    phone.cursor.insert(g.clone(), 0);
    let err = phone
        .dev
        .create_commit(&g, &json!({ "add_key_packages": [legacy] }).to_string())
        .unwrap_err();
    assert_eq!(err.code, Code::BadKeyPackage);

    // The same older device can still join an ordinary chat.
    let dm = new_g(205);
    phone.create_group_on(&mut ds, &dm, "dm", CIPHERSUITE_AES256);
    phone
        .commit(
            &mut ds,
            &dm,
            json!({ "add_key_packages": [legacy_key_package()] }),
        )
        .unwrap();
}
