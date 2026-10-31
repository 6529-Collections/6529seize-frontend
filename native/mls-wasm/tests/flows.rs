//! End-to-end flows through the simulated delivery service.

mod common;

use common::*;
use mls_wasm::codec::{self, ENTRY_BUCKETS, MESSAGE_BUCKETS};
use mls_wasm::{Code, Device};
use serde_json::{json, Value};

#[test]
fn dm_two_party_flow() {
    let mut ds = Ds::default();
    let g = new_g(1);
    let mut alice = Client::new("alice");
    let mut bob = Client::new("bob");

    let created = alice.create_group(&mut ds, &g, "dm");
    assert_eq!(created["epoch"], 0);
    assert_eq!(created["members"].as_array().unwrap().len(), 1);
    assert_eq!(created["metadata"]["kind"], "dm");

    let res = alice
        .commit(
            &mut ds,
            &g,
            json!({ "add_key_packages": [bob.key_package()] }),
        )
        .unwrap();
    assert_eq!(res["new_epoch"], 1);
    assert_eq!(res["added"][0]["device_key"], bob.key());
    assert_eq!(res["added"][0]["leaf"], 1);
    let welcome = res["welcome"].as_str().unwrap().to_string();

    // Welcome summary before accepting.
    let wb = codec::unb64(&welcome, "w").unwrap();
    let ws = parse(&bob.dev.join_welcome(&g, &wb, None).unwrap());
    assert_eq!(ws["g"], g.as_str());
    assert_eq!(ws["epoch"], 1);
    assert_eq!(ws["sender"]["device_key"], alice.key());
    assert_eq!(ws["metadata"]["g"], g.as_str());
    assert_eq!(ws["commit_key"], res["entry"]["next_commit_key"]);
    assert_eq!(ws["epoch_fp"], res["new_epoch_fp"]);
    bob.dev.accept_welcome(&g).unwrap();
    bob.cursor.insert(g.clone(), ds.len(&g));

    let a = alice.summary(&g);
    let b = bob.summary(&g);
    assert_eq!(a["epoch"], 1);
    assert_eq!(a["epoch_fp"], b["epoch_fp"]);
    assert_eq!(a["commit_key"], b["commit_key"]);
    assert_eq!(a["commit_key"], res["entry"]["next_commit_key"]);
    // Declared epoch commitment equals what both members compute after merge.
    assert_eq!(
        alice.dev.current_epoch_commitment(&g).unwrap(),
        res["entry"]["epoch_commitment"].as_str().unwrap()
    );
    assert_eq!(
        bob.dev.current_epoch_commitment(&g).unwrap(),
        res["entry"]["epoch_commitment"].as_str().unwrap()
    );

    alice.send(&mut ds, &g, "hi bob");
    let got = bob.sync(&ds, &g);
    assert_eq!(got.len(), 1);
    assert_eq!(body_text(&got[0]), "hi bob");
    assert_eq!(got[0]["sig_ok"], true);
    assert_eq!(got[0]["sender"]["device_key"], alice.key());
    assert_eq!(got[0]["epoch_fp"], a["epoch_fp"]);

    bob.send(&mut ds, &g, "hi alice");
    let got = alice.sync(&ds, &g);
    assert_eq!(body_text(&got[0]), "hi alice");
    assert_eq!(got[0]["sender"]["device_key"], bob.key());
}

#[test]
fn three_members_exchange() {
    let mut ds = Ds::default();
    let g = new_g(2);
    let (mut a, mut b, mut c) = (
        Client::new("alice"),
        Client::new("bob"),
        Client::new("carol"),
    );
    group_of(&mut ds, &g, &mut a, &mut [&mut b, &mut c]);
    for (sender, text) in [("a", "from a"), ("b", "from b"), ("c", "from c")] {
        match sender {
            "a" => a.send(&mut ds, &g, text),
            "b" => b.send(&mut ds, &g, text),
            _ => c.send(&mut ds, &g, text),
        };
    }
    let ra: Vec<String> = a.sync(&ds, &g).iter().map(body_text).collect();
    let rb: Vec<String> = b.sync(&ds, &g).iter().map(body_text).collect();
    let rc: Vec<String> = c.sync(&ds, &g).iter().map(body_text).collect();
    assert_eq!(ra, vec!["from b", "from c"]);
    // send() syncs first, so bob already read "from a" and carol read both.
    assert_eq!(rb, vec!["from c"]);
    assert!(rc.is_empty());
    assert_eq!(a.summary(&g)["members"].as_array().unwrap().len(), 3);
}

#[test]
fn add_and_remove_members() {
    let mut ds = Ds::default();
    let g = new_g(3);
    let (mut a, mut b, mut c) = (
        Client::new("alice"),
        Client::new("bob"),
        Client::new("carol"),
    );
    group_of(&mut ds, &g, &mut a, &mut [&mut b]);
    // Add carol later.
    let res = a
        .commit(
            &mut ds,
            &g,
            json!({ "add_key_packages": [c.key_package()] }),
        )
        .unwrap();
    c.join(&ds, &g, res["welcome"].as_str().unwrap());
    let staged = b.sync(&ds, &g);
    assert_eq!(staged[0]["kind"], "commit");
    assert_eq!(staged[0]["added"][0]["device_key"], c.key());
    assert_eq!(staged[0]["added"][0]["leaf"], 2);
    assert_eq!(b.summary(&g)["members"].as_array().unwrap().len(), 3);

    // Remove carol.
    let res = a
        .commit(&mut ds, &g, json!({ "remove_device_keys": [c.key()] }))
        .unwrap();
    assert_eq!(res["removed"][0]["device_key"], c.key());
    assert!(res["welcome"].is_null());
    let staged = b.sync(&ds, &g);
    assert_eq!(staged[0]["removed"][0]["device_key"], c.key());
    assert_eq!(staged[0]["self_removed"], false);
    let removal = c.sync(&ds, &g);
    assert_eq!(removal[0]["self_removed"], true);
    assert!(removal[0]["declared_ok"].is_null());
    let cs = c.summary(&g);
    assert_eq!(cs["active"], false);
    assert!(cs["commit_key"].is_null());
    assert_eq!(a.summary(&g)["members"].as_array().unwrap().len(), 2);
    assert_eq!(a.summary(&g)["epoch_fp"], b.summary(&g)["epoch_fp"]);
}

#[test]
fn removed_member_cannot_decrypt_later_messages() {
    let mut ds = Ds::default();
    let g = new_g(4);
    let (mut a, mut b, mut c) = (
        Client::new("alice"),
        Client::new("bob"),
        Client::new("carol"),
    );
    group_of(&mut ds, &g, &mut a, &mut [&mut b, &mut c]);
    // Carol keeps a copy of her state from before the removal.
    let carol_before = c.dev.export_state().unwrap();
    a.commit(&mut ds, &g, json!({ "remove_device_keys": [c.key()] }))
        .unwrap();
    let seq = a.send(&mut ds, &g, "after removal");
    let item = ds.item(&g, seq);
    b.sync(&ds, &g);
    // Removed carol (state advanced) is no longer a member.
    c.sync(&ds, &g);
    let err = c.dev.decrypt_message(&g, &item.to_string()).unwrap_err();
    assert_eq!(err.code, Code::NotMember);
    // Carol's pre-removal state has no keys for the new epoch.
    let mut old = Device::load(&carol_before).unwrap();
    let err = old.decrypt_message(&g, &item.to_string()).unwrap_err();
    assert_eq!(err.code, Code::WrongEpoch);
    // Forcing the message into her old epoch fails to unwrap.
    let mut forged = item.clone();
    forged["epoch"] = json!(1);
    let err = old.decrypt_message(&g, &forged.to_string()).unwrap_err();
    assert_eq!(err.code, Code::DecryptFailed);
}

#[test]
fn new_member_cannot_decrypt_earlier_messages() {
    let mut ds = Ds::default();
    let g = new_g(5);
    let (mut a, mut b, mut c) = (
        Client::new("alice"),
        Client::new("bob"),
        Client::new("carol"),
    );
    group_of(&mut ds, &g, &mut a, &mut [&mut b]);
    let seq = b.send(&mut ds, &g, "before carol");
    let early = ds.item(&g, seq);
    let res = a
        .commit(
            &mut ds,
            &g,
            json!({ "add_key_packages": [c.key_package()] }),
        )
        .unwrap();
    c.join(&ds, &g, res["welcome"].as_str().unwrap());
    let err = c.dev.decrypt_message(&g, &early.to_string()).unwrap_err();
    assert_eq!(err.code, Code::WrongEpoch);
    // Even with the epoch relabelled, the wrap key differs.
    let mut forged = early.clone();
    forged["epoch"] = json!(c.summary(&g)["epoch"]);
    assert!(c.dev.decrypt_message(&g, &forged.to_string()).is_err());
}

#[test]
fn conflicting_commits_first_wins() {
    let mut ds = Ds::default();
    let g = new_g(6);
    let (mut a, mut b, mut c) = (
        Client::new("alice"),
        Client::new("bob"),
        Client::new("carol"),
    );
    group_of(&mut ds, &g, &mut a, &mut [&mut b, &mut c]);
    let epoch = a.summary(&g)["epoch"].as_u64().unwrap();

    // Alice and bob both commit in the same epoch.
    let ca = parse(&a.dev.create_commit(&g, r#"{"self_update":true}"#).unwrap());
    let cb = parse(&b.dev.create_commit(&g, r#"{"self_update":true}"#).unwrap());
    assert_eq!(
        b.dev
            .create_commit(&g, r#"{"self_update":true}"#)
            .unwrap_err()
            .code,
        Code::PendingExists
    );
    assert!(ds.submit_entry(&g, &ca["entry"]).is_ok());
    assert_eq!(
        ds.submit_entry(&g, &cb["entry"]),
        Err(DsError::EpochConflict)
    );

    // Loser discards its pending commit and processes the winner.
    b.dev.discard_pending(&g).unwrap();
    let got = b.sync(&ds, &g);
    assert_eq!(got[0]["kind"], "commit");
    assert_eq!(got[0]["sender"]["device_key"], a.key());
    // Carol never committed.
    c.sync(&ds, &g);
    // Alice sees her own commit come back and merges it.
    let own = a.sync(&ds, &g);
    assert_eq!(own[0]["kind"], "own");
    for s in [a.summary(&g), b.summary(&g), c.summary(&g)] {
        assert_eq!(s["epoch"], epoch + 1);
    }
    assert_eq!(a.summary(&g)["epoch_fp"], b.summary(&g)["epoch_fp"]);
    assert_eq!(a.summary(&g)["epoch_fp"], c.summary(&g)["epoch_fp"]);
    b.send(&mut ds, &g, "after conflict");
    assert_eq!(body_text(&a.sync(&ds, &g)[0]), "after conflict");
    assert_eq!(body_text(&c.sync(&ds, &g)[0]), "after conflict");
}

#[test]
fn conflicting_commit_loser_without_discard() {
    // The loser may also process the winner while its own commit is pending;
    // accepting the winner clears the pending commit.
    let mut ds = Ds::default();
    let g = new_g(7);
    let (mut a, mut b) = (Client::new("alice"), Client::new("bob"));
    group_of(&mut ds, &g, &mut a, &mut [&mut b]);
    let ca = parse(&a.dev.create_commit(&g, r#"{"self_update":true}"#).unwrap());
    let _cb = parse(&b.dev.create_commit(&g, r#"{"self_update":true}"#).unwrap());
    ds.submit_entry(&g, &ca["entry"]).unwrap();
    let got = b.sync(&ds, &g);
    assert_eq!(got[0]["kind"], "commit");
    assert_eq!(b.summary(&g)["pending_commit"], false);
    a.sync(&ds, &g);
    assert_eq!(a.summary(&g)["epoch_fp"], b.summary(&g)["epoch_fp"]);
    a.send(&mut ds, &g, "ok");
    assert_eq!(body_text(&b.sync(&ds, &g)[0]), "ok");
}

#[test]
fn proposal_based_leave() {
    let mut ds = Ds::default();
    let g = new_g(8);
    let (mut a, mut b, mut c) = (
        Client::new("alice"),
        Client::new("bob"),
        Client::new("carol"),
    );
    group_of(&mut ds, &g, &mut a, &mut [&mut b, &mut c]);
    let entries = parse(
        &c.dev
            .propose_remove(&g, &json!([c.key()]).to_string())
            .unwrap(),
    );
    assert_eq!(entries.as_array().unwrap().len(), 1);
    let e = &entries[0];
    assert_eq!(e["kind"], "proposal");
    assert_eq!(e["epoch_commitment"], codec::hex0x(&[0u8; 32]));
    assert_eq!(e["next_commit_key"], codec::hex0x(&[0u8; 32]));
    // Carol can still send until the DS sequences her proposal.
    ds.submit_entry(&g, e).unwrap();

    let got = b.sync(&ds, &g);
    assert_eq!(got[0]["kind"], "proposal");
    assert_eq!(got[0]["remove"]["device_key"], c.key());
    assert_eq!(got[0]["sender"]["device_key"], c.key());
    assert_eq!(got[0]["stored"], true);
    let bs = b.summary(&g);
    assert_eq!(bs["pending_proposals"][0]["remove"]["device_key"], c.key());
    // Commit-before-send: pending proposals block messages.
    let err = b.dev.encrypt_message(&g, b"{}").unwrap_err();
    assert_eq!(err.code, Code::PendingProposals);

    let own = c.sync(&ds, &g);
    assert_eq!(own[0]["own"], true);

    // Alice commits the leave.
    let res = a
        .commit(&mut ds, &g, json!({ "include_pending_proposals": true }))
        .unwrap();
    assert_eq!(res["removed"][0]["device_key"], c.key());
    let got = b.sync(&ds, &g);
    assert_eq!(got[0]["removed"][0]["device_key"], c.key());
    let got = c.sync(&ds, &g);
    assert_eq!(got[0]["self_removed"], true);
    assert_eq!(c.summary(&g)["active"], false);
    b.send(&mut ds, &g, "bye carol");
    assert_eq!(body_text(&a.sync(&ds, &g)[0]), "bye carol");
}

#[test]
fn dropped_proposal_is_not_committed() {
    let mut ds = Ds::default();
    let g = new_g(9);
    let (mut a, mut b, mut c) = (
        Client::new("alice"),
        Client::new("bob"),
        Client::new("carol"),
    );
    group_of(&mut ds, &g, &mut a, &mut [&mut b, &mut c]);
    // Bob proposes removing carol (not his principal): alice's engine drops it.
    let entries = parse(
        &b.dev
            .propose_remove(&g, &json!([c.key()]).to_string())
            .unwrap(),
    );
    ds.submit_entry(&g, &entries[0]).unwrap();
    a.sync(&ds, &g);
    assert_eq!(a.dev.drop_proposals(&g, &c.key()).unwrap(), 1);
    assert!(a.summary(&g)["pending_proposals"]
        .as_array()
        .unwrap()
        .is_empty());
    a.send(&mut ds, &g, "still here");
    let res = a
        .commit(
            &mut ds,
            &g,
            json!({ "self_update": true, "include_pending_proposals": true }),
        )
        .unwrap();
    assert!(res["removed"].as_array().unwrap().is_empty());
}

#[test]
fn metadata_rename() {
    let mut ds = Ds::default();
    let g = new_g(10);
    let (mut a, mut b) = (Client::new("alice"), Client::new("bob"));
    group_of(&mut ds, &g, &mut a, &mut [&mut b]);
    let meta: Value = parse(&metadata(&g, "dm", Some("Renamed")));
    a.commit(&mut ds, &g, json!({ "metadata": meta })).unwrap();
    let got = b.sync(&ds, &g);
    assert!(got[0]["metadata_before"]["name"].is_null());
    assert_eq!(got[0]["metadata_after"]["name"], "Renamed");
    assert_eq!(b.summary(&g)["metadata"]["name"], "Renamed");
    assert_eq!(a.summary(&g)["metadata"]["name"], "Renamed");
    // Kind and g cannot change.
    let bad_kind: Value = parse(&metadata(&g, "group", Some("x")));
    let err = a
        .dev
        .create_commit(&g, &json!({ "metadata": bad_kind }).to_string())
        .unwrap_err();
    assert_eq!(err.code, Code::BadMetadata);
    let bad_g: Value = parse(&metadata(&new_g(99), "dm", Some("x")));
    let err = a
        .dev
        .create_commit(&g, &json!({ "metadata": bad_g }).to_string())
        .unwrap_err();
    assert_eq!(err.code, Code::BadMetadata);
    // Members still talk after the GCE commit.
    b.send(&mut ds, &g, "renamed ok");
    assert_eq!(body_text(&a.sync(&ds, &g)[0]), "renamed ok");
    // A later add still works (leaf capabilities keep 0xF529).
    let mut c = Client::new("carol");
    let res = a
        .commit(
            &mut ds,
            &g,
            json!({ "add_key_packages": [c.key_package()] }),
        )
        .unwrap();
    let cs = c.join(&ds, &g, res["welcome"].as_str().unwrap());
    assert_eq!(cs["metadata"]["name"], "Renamed");
}

#[test]
fn self_update_changes_epoch_secrets() {
    let mut ds = Ds::default();
    let g = new_g(11);
    let (mut a, mut b) = (Client::new("alice"), Client::new("bob"));
    group_of(&mut ds, &g, &mut a, &mut [&mut b]);
    let before = a.summary(&g);
    let res = b
        .commit(&mut ds, &g, json!({ "self_update": true }))
        .unwrap();
    assert!(res["added"].as_array().unwrap().is_empty());
    let got = a.sync(&ds, &g);
    assert!(got[0]["sender_leaf_after"].is_object());
    let after = a.summary(&g);
    assert_ne!(before["epoch_fp"], after["epoch_fp"]);
    assert_ne!(before["commit_key"], after["commit_key"]);
    assert_eq!(after["epoch_fp"], b.summary(&g)["epoch_fp"]);
    a.send(&mut ds, &g, "post update");
    assert_eq!(body_text(&b.sync(&ds, &g)[0]), "post update");
}

#[test]
fn credential_refresh_on_self_update() {
    let mut ds = Ds::default();
    let g = new_g(12);
    let (mut a, mut b) = (Client::new("alice"), Client::new("bob"));
    group_of(&mut ds, &g, &mut a, &mut [&mut b]);
    let renewed = "6529-e2ee-v1:0x00000000000000000000000000000000000000aa:0xrenewed";
    b.dev.set_credential(renewed).unwrap();
    b.commit(&mut ds, &g, json!({ "self_update": true }))
        .unwrap();
    let got = a.sync(&ds, &g);
    assert_eq!(got[0]["sender_leaf_after"]["identity"], renewed);
    let members = a.summary(&g)["members"].clone();
    assert!(members
        .as_array()
        .unwrap()
        .iter()
        .any(|m| m["identity"] == renewed));
}

#[test]
fn wrong_commit_key_signature_rejected() {
    let mut ds = Ds::default();
    let g = new_g(13);
    let (mut a, mut b) = (Client::new("alice"), Client::new("bob"));
    group_of(&mut ds, &g, &mut a, &mut [&mut b]);
    let res = parse(&a.dev.create_commit(&g, r#"{"self_update":true}"#).unwrap());
    let mut item = res["entry"].clone();
    item["type"] = json!("entry");
    // Signed by a random key instead of K_n.
    let other = Device::create().unwrap();
    let gb = codec::parse_g(&g).unwrap();
    let digest = codec::entry_digest(
        &gb,
        item["epoch"].as_u64().unwrap(),
        codec::KIND_COMMIT,
        &codec::parse_hex_n::<32>(item["entry_hash"].as_str().unwrap(), "h").unwrap(),
        &codec::parse_hex_n::<32>(item["epoch_commitment"].as_str().unwrap(), "h").unwrap(),
        &codec::parse_hex_n::<32>(item["next_commit_key"].as_str().unwrap(), "h").unwrap(),
        item["padded_len"].as_u64().unwrap(),
    );
    item["signature"] = json!(other.sign_digest(&digest).unwrap());
    let err = b.dev.process_entry(&g, &item.to_string()).unwrap_err();
    assert_eq!(err.code, Code::BadSignature);
    // The DS rejects it too.
    assert_eq!(ds.submit_entry(&g, &item), Err(DsError::BadSignature));
    // Wrong epoch.
    let mut wrong = res["entry"].clone();
    wrong["epoch"] = json!(item["epoch"].as_u64().unwrap() + 1);
    assert_eq!(
        b.dev
            .process_entry(&g, &wrong.to_string())
            .unwrap_err()
            .code,
        Code::WrongEpoch
    );
    // The genuine entry still processes.
    let ok = parse(&b.dev.process_entry(&g, &res["entry"].to_string()).unwrap());
    assert_eq!(ok["declared_ok"], true);
}

#[test]
fn tampered_entry_data_rejected() {
    let mut ds = Ds::default();
    let g = new_g(14);
    let (mut a, mut b) = (Client::new("alice"), Client::new("bob"));
    group_of(&mut ds, &g, &mut a, &mut [&mut b]);
    let res = parse(&a.dev.create_commit(&g, r#"{"self_update":true}"#).unwrap());
    let entry = res["entry"].clone();
    let mut data = codec::unb64(entry["data"].as_str().unwrap(), "d").unwrap();
    data[40] ^= 0x01;
    // 1. Hash no longer matches.
    let mut t1 = entry.clone();
    t1["data"] = json!(codec::b64(&data));
    assert_eq!(
        b.dev.process_entry(&g, &t1.to_string()).unwrap_err().code,
        Code::BadEntry
    );
    // 2. Hash recomputed but signature not: K_n signature fails.
    let new_hash = codec::keccak256(&data);
    let mut t2 = t1.clone();
    t2["entry_hash"] = json!(codec::hex0x(&new_hash));
    assert_eq!(
        b.dev.process_entry(&g, &t2.to_string()).unwrap_err().code,
        Code::BadSignature
    );
    // 3. A member re-signs the tampered entry with K_n: unwrap fails.
    let gb = codec::parse_g(&g).unwrap();
    let digest = codec::entry_digest(
        &gb,
        entry["epoch"].as_u64().unwrap(),
        codec::KIND_COMMIT,
        &new_hash,
        &codec::parse_hex_n::<32>(entry["epoch_commitment"].as_str().unwrap(), "h").unwrap(),
        &codec::parse_hex_n::<32>(entry["next_commit_key"].as_str().unwrap(), "h").unwrap(),
        data.len() as u64,
    );
    let mut t3 = t2.clone();
    t3["signature"] = json!(codec::hex0x(
        &a.dev.sign_with_commit_key(&g, &digest).unwrap()
    ));
    assert_eq!(
        b.dev.process_entry(&g, &t3.to_string()).unwrap_err().code,
        Code::DecryptFailed
    );
    // 4. Wrong kind label (aad binds kind).
    let mut t4 = entry.clone();
    t4["kind"] = json!("proposal");
    assert!(b.dev.process_entry(&g, &t4.to_string()).is_err());
    // Genuine entry still processes after the failed attempts.
    let ok = parse(&b.dev.process_entry(&g, &entry.to_string()).unwrap());
    assert_eq!(ok["declared_ok"], true);
}

#[test]
fn declared_next_key_mismatch_detected() {
    let mut ds = Ds::default();
    let g = new_g(15);
    let (mut a, mut b) = (Client::new("alice"), Client::new("bob"));
    group_of(&mut ds, &g, &mut a, &mut [&mut b]);
    let res = parse(&a.dev.create_commit(&g, r#"{"self_update":true}"#).unwrap());
    let gb = codec::parse_g(&g).unwrap();
    for field in ["next_commit_key", "epoch_commitment"] {
        let mut entry = res["entry"].clone();
        entry[field] = json!(codec::hex0x(&[0x42u8; 32]));
        let digest = codec::entry_digest(
            &gb,
            entry["epoch"].as_u64().unwrap(),
            codec::KIND_COMMIT,
            &codec::parse_hex_n::<32>(entry["entry_hash"].as_str().unwrap(), "h").unwrap(),
            &codec::parse_hex_n::<32>(entry["epoch_commitment"].as_str().unwrap(), "h").unwrap(),
            &codec::parse_hex_n::<32>(entry["next_commit_key"].as_str().unwrap(), "h").unwrap(),
            entry["padded_len"].as_u64().unwrap(),
        );
        entry["signature"] = json!(codec::hex0x(
            &a.dev.sign_with_commit_key(&g, &digest).unwrap()
        ));
        // Bob is a fresh copy for each attempt: processing consumes ratchet state.
        let mut bob2 = Device::load(&b.dev.export_state().unwrap()).unwrap();
        let staged = parse(&bob2.process_entry(&g, &entry.to_string()).unwrap());
        assert_eq!(staged["declared_ok"], false, "{field}");
        bob2.reject_staged(&g).unwrap();
    }
}

#[test]
fn bucket_sizes_exact() {
    let mut ds = Ds::default();
    let g = new_g(16);
    let (mut a, mut b) = (Client::new("alice"), Client::new("bob"));
    group_of(&mut ds, &g, &mut a, &mut [&mut b]);
    let res = parse(&a.dev.create_commit(&g, r#"{"self_update":true}"#).unwrap());
    let len = res["entry"]["padded_len"].as_u64().unwrap() as usize;
    let data = codec::unb64(res["entry"]["data"].as_str().unwrap(), "d").unwrap();
    assert_eq!(data.len(), len);
    assert!(ENTRY_BUCKETS.contains(&len));
    // A 2-member self-update carries an X-Wing leaf key (1216 bytes) and one
    // X-Wing ciphertext (1120 bytes), so it fills the 8 KiB bucket.
    assert_eq!(len, 8192);
    a.dev.discard_pending(&g).unwrap();

    for (body_len, bucket) in [
        (10usize, 512usize),
        (2000, 4096),
        (15000, 16384),
        (60000, 65536),
    ] {
        let body = vec![b'x'; body_len];
        let out = parse(&a.dev.encrypt_message(&g, &body).unwrap());
        let data = codec::unb64(out["data"].as_str().unwrap(), "d").unwrap();
        assert_eq!(data.len(), bucket, "body {body_len}");
        assert!(MESSAGE_BUCKETS.contains(&data.len()));
        assert_eq!(out["padded_len"], bucket);
    }
    let err = a.dev.encrypt_message(&g, &vec![b'x'; 65000]).unwrap_err();
    assert_eq!(err.code, Code::TooLarge);
}

#[test]
fn export_load_round_trip() {
    let mut ds = Ds::default();
    let g = new_g(17);
    let (mut a, mut b) = (Client::new("alice"), Client::new("bob"));
    group_of(&mut ds, &g, &mut a, &mut [&mut b]);
    a.send(&mut ds, &g, "one");
    b.sync(&ds, &g);

    // Reload both devices from their blobs and keep going.
    let blob = a.dev.export_state().unwrap();
    assert_eq!(&blob[..8], b"6529MLS1");
    let key = a.key();
    a.dev = Device::load(&blob).unwrap();
    assert_eq!(a.key(), key);
    assert!(a
        .dev
        .credential_identity()
        .unwrap()
        .starts_with("6529-e2ee-v1:"));
    b.dev = Device::load(&b.dev.export_state().unwrap()).unwrap();
    a.send(&mut ds, &g, "two");
    assert_eq!(body_text(&b.sync(&ds, &g)[0]), "two");
    b.send(&mut ds, &g, "three");
    assert_eq!(body_text(&a.sync(&ds, &g)[0]), "three");

    // Pending own commit survives a reload.
    let res = parse(&a.dev.create_commit(&g, r#"{"self_update":true}"#).unwrap());
    a.dev = Device::load(&a.dev.export_state().unwrap()).unwrap();
    assert_eq!(a.summary(&g)["pending_commit"], true);
    ds.submit_entry(&g, &res["entry"]).unwrap();
    let own = a.sync(&ds, &g);
    assert_eq!(own[0]["kind"], "own");

    // Staged incoming commit survives a reload.
    let item = ds.item(&g, ds.len(&g) as u64);
    let staged = parse(&b.dev.process_entry(&g, &item.to_string()).unwrap());
    assert_eq!(staged["declared_ok"], true);
    b.dev = Device::load(&b.dev.export_state().unwrap()).unwrap();
    assert_eq!(b.summary(&g)["staged_commit"], true);
    b.dev.accept_staged(&g).unwrap();
    b.cursor.insert(g.clone(), ds.len(&g));
    assert_eq!(a.summary(&g)["epoch_fp"], b.summary(&g)["epoch_fp"]);
    a.send(&mut ds, &g, "four");
    assert_eq!(body_text(&b.sync(&ds, &g)[0]), "four");

    // Unused key packages survive a reload and can be joined with.
    let mut c = Client::new("carol");
    let kp = c.key_package();
    c.dev = Device::load(&c.dev.export_state().unwrap()).unwrap();
    let res = a
        .commit(&mut ds, &g, json!({ "add_key_packages": [kp] }))
        .unwrap();
    c.join(&ds, &g, res["welcome"].as_str().unwrap());
    b.sync(&ds, &g);
    c.send(&mut ds, &g, "five");
    assert_eq!(body_text(&a.sync(&ds, &g)[0]), "five");

    assert_eq!(
        Device::load(b"6529MLS2").err().unwrap().code,
        Code::BadState
    );
    assert_eq!(
        Device::load(&blob[..blob.len() - 1]).err().unwrap().code,
        Code::BadState
    );
}

#[test]
fn inner_signature_verification() {
    let mut ds = Ds::default();
    let g = new_g(18);
    let (mut a, mut b) = (Client::new("alice"), Client::new("bob"));
    group_of(&mut ds, &g, &mut a, &mut [&mut b]);
    let epoch = a.summary(&g)["epoch"].as_u64().unwrap();
    let gb = codec::parse_g(&g).unwrap();
    let body = br#"{"v":1,"t":"msg","id":"01","ts":0,"text":"forged"}"#;
    // Signed by a different key than alice's leaf.
    let mallory = Device::create().unwrap();
    let digest = codec::message_digest(&gb, epoch, body);
    let sig = codec::parse_hex_n::<64>(&mallory.sign_digest(&digest).unwrap(), "s").unwrap();
    let inner = codec::encode_inner(body, &sig).unwrap();
    let out = parse(&a.dev.encrypt_inner_unchecked(&g, &inner).unwrap());
    let mut msg = out.clone();
    msg["epoch_fp"] = json!(null);
    ds.send_message(&g, &msg).unwrap();
    let got = b.sync(&ds, &g);
    assert_eq!(got[0]["sig_ok"], false);
    // Signature over another epoch is also rejected.
    let sig2 = codec::parse_hex_n::<64>(
        &a.dev
            .sign_digest(&codec::message_digest(&gb, epoch + 7, body))
            .unwrap(),
        "s",
    )
    .unwrap();
    let out = parse(
        &a.dev
            .encrypt_inner_unchecked(&g, &codec::encode_inner(body, &sig2).unwrap())
            .unwrap(),
    );
    ds.send_message(&g, &out).unwrap();
    assert_eq!(b.sync(&ds, &g)[0]["sig_ok"], false);
    // Malformed envelope.
    let out = parse(&a.dev.encrypt_inner_unchecked(&g, b"\x02garbage").unwrap());
    ds.send_message(&g, &out).unwrap();
    let item = ds.item(&g, ds.len(&g) as u64);
    assert_eq!(
        b.dev
            .decrypt_message(&g, &item.to_string())
            .unwrap_err()
            .code,
        Code::BadMessage
    );
    // Decrypting consumed the ratchet secret: a replay fails.
    assert_eq!(
        b.dev
            .decrypt_message(&g, &item.to_string())
            .unwrap_err()
            .code,
        Code::DecryptFailed
    );
    b.cursor.insert(g.clone(), ds.len(&g));
    // A genuine message verifies and its signature checks out with the helper.
    a.send(&mut ds, &g, "genuine");
    let got = b.sync(&ds, &g);
    assert_eq!(got[0]["sig_ok"], true);
    let body = codec::unb64(got[0]["body"].as_str().unwrap(), "b").unwrap();
    let sig = codec::parse_hex_n::<64>(got[0]["signature"].as_str().unwrap(), "s").unwrap();
    assert!(codec::verify32(
        &a.dev.device_key_bytes(),
        &codec::message_digest(&gb, epoch, &body),
        &sig
    ));
}

#[test]
fn late_message_from_previous_epoch() {
    // Bob's message is sequenced before alice's commit; alice merges her
    // commit first and decrypts bob's message with the retained epoch keys.
    let mut ds = Ds::default();
    let g = new_g(19);
    let (mut a, mut b, mut c) = (
        Client::new("alice"),
        Client::new("bob"),
        Client::new("carol"),
    );
    group_of(&mut ds, &g, &mut a, &mut [&mut b, &mut c]);
    let seq_b = b.send(&mut ds, &g, "late from bob");
    let seq_c = c.send(&mut ds, &g, "late from carol");
    let res = parse(
        &a.dev
            .create_commit(&g, &json!({ "remove_device_keys": [c.key()] }).to_string())
            .unwrap(),
    );
    ds.submit_entry(&g, &res["entry"]).unwrap();
    a.dev.merge_pending(&g).unwrap();
    for (seq, text, key) in [
        (seq_b, "late from bob", b.key()),
        (seq_c, "late from carol", c.key()),
    ] {
        let m = parse(
            &a.dev
                .decrypt_message(&g, &ds.item(&g, seq).to_string())
                .unwrap(),
        );
        assert_eq!(body_text(&m), text);
        assert_eq!(m["sig_ok"], true);
        assert_eq!(m["sender"]["device_key"], key);
    }
    // The own commit from the log is recognised as already merged.
    let item = ds.item(&g, ds.len(&g) as u64);
    let own = parse(&a.dev.process_entry(&g, &item.to_string()).unwrap());
    assert_eq!(own["kind"], "own");
    assert_eq!(own["already_merged"], true);
}

#[test]
fn add_leaf_indices_match_tree() {
    let mut ds = Ds::default();
    let g = new_g(20);
    let mut a = Client::new("alice");
    let mut others: Vec<Client> = ["b", "c", "d"].iter().map(|n| Client::new(n)).collect();
    {
        let mut refs: Vec<&mut Client> = others.iter_mut().collect();
        group_of(&mut ds, &g, &mut a, &mut refs);
    }
    let (e, f) = (Client::new("e"), Client::new("f"));
    // Remove leaf 1 and add two members in one commit: they take leaf 1 and 4.
    let res = a
        .commit(
            &mut ds,
            &g,
            json!({ "remove_device_keys": [others[0].key()], "add_key_packages": [e.key_package(), f.key_package()] }),
        )
        .unwrap();
    let predicted: Vec<(u64, String)> = res["added"]
        .as_array()
        .unwrap()
        .iter()
        .map(|l| {
            (
                l["leaf"].as_u64().unwrap(),
                l["device_key"].as_str().unwrap().to_string(),
            )
        })
        .collect();
    assert_eq!(predicted, vec![(1, e.key()), (4, f.key())]);
    let members = a.summary(&g)["members"].clone();
    for (leaf, key) in predicted {
        assert!(members
            .as_array()
            .unwrap()
            .iter()
            .any(|m| m["leaf"] == leaf && m["device_key"] == key.as_str()));
    }
    // Others see the same prediction in their staged summary.
    let got = others[1].sync(&ds, &g);
    assert_eq!(got[0]["added"][0]["leaf"], 1);
    assert_eq!(got[0]["added"][1]["leaf"], 4);
}

#[test]
fn welcome_for_other_handle_rejected_and_kp_kept() {
    let mut ds = Ds::default();
    let g = new_g(21);
    let (mut a, mut b) = (Client::new("alice"), Client::new("bob"));
    a.create_group(&mut ds, &g, "dm");
    let res = a
        .commit(
            &mut ds,
            &g,
            json!({ "add_key_packages": [b.key_package()] }),
        )
        .unwrap();
    let w = codec::unb64(res["welcome"].as_str().unwrap(), "w").unwrap();
    let err = b.dev.join_welcome(&new_g(22), &w, None).unwrap_err();
    assert_eq!(err.code, Code::BadWelcome);
    // The KeyPackage was not consumed by the failed attempt.
    let ws = parse(&b.dev.join_welcome(&g, &w, None).unwrap());
    assert_eq!(ws["g"], g.as_str());
    // Staged welcome is not in the exported state, but the KeyPackage is,
    // so a reload can join again.
    let blob = b.dev.export_state().unwrap();
    let mut reloaded = Device::load(&blob).unwrap();
    assert_eq!(
        reloaded.accept_welcome(&g).unwrap_err().code,
        Code::NoStagedWelcome
    );
    reloaded.join_welcome(&g, &w, None).unwrap();
    reloaded.accept_welcome(&g).unwrap();
    // After accepting, the one-time KeyPackage is gone.
    b.dev.accept_welcome(&g).unwrap();
    let mut fresh = Device::load(&b.dev.export_state().unwrap()).unwrap();
    fresh.delete_group(&g).unwrap();
    assert_eq!(
        fresh.join_welcome(&g, &w, None).unwrap_err().code,
        Code::NoKeyPackage
    );
}

#[test]
fn last_resort_key_package_reusable() {
    let mut ds = Ds::default();
    let (mut a, mut b) = (Client::new("alice"), Client::new("bob"));
    let kps = parse(&b.dev.create_key_packages(1, true, 90 * DAY).unwrap());
    assert_eq!(kps[0]["last_resort"], true);
    let expires = kps[0]["expires_at"].as_u64().unwrap();
    assert!(expires > 89 * DAY);
    assert!(kps[0]["ref"].as_str().unwrap().starts_with("0x"));
    let kp = kps[0]["data"].as_str().unwrap().to_string();
    for seed in [30u8, 31u8] {
        let g = new_g(seed);
        a.create_group(&mut ds, &g, "dm");
        let res = a
            .commit(&mut ds, &g, json!({ "add_key_packages": [kp.clone()] }))
            .unwrap();
        b.join(&ds, &g, res["welcome"].as_str().unwrap());
        a.send(&mut ds, &g, "lr");
        assert_eq!(body_text(&b.sync(&ds, &g)[0]), "lr");
    }
}

#[test]
fn uses_only_the_x_wing_ciphersuite() {
    // 0x004F: MLS_128_MLKEM768X25519_AES128GCM_SHA256_Ed25519 (contract 3.6).
    assert_eq!(u16::from(mls_wasm::device::CIPHERSUITE), 0x004F);
    let info: Value = serde_json::from_str(&mls_wasm::module_info()).unwrap();
    assert_eq!(info["ciphersuite"], 0x004F);
}

#[test]
fn key_packages_shape_and_validation() {
    let a = Client::new("alice");
    let list = parse(&a.dev.create_key_packages(3, false, 30 * DAY).unwrap());
    assert_eq!(list.as_array().unwrap().len(), 3);
    for kp in list.as_array().unwrap() {
        let data = codec::unb64(kp["data"].as_str().unwrap(), "kp").unwrap();
        assert!(data.len() < 4096);
        assert_eq!(kp["last_resort"], false);
    }
    let mut ds = Ds::default();
    let g = new_g(40);
    let mut alice = Client::new("alice2");
    alice.create_group(&mut ds, &g, "group");
    // Garbage key package.
    let err = alice
        .dev
        .create_commit(
            &g,
            &json!({ "add_key_packages": [codec::b64(b"nope")] }).to_string(),
        )
        .unwrap_err();
    assert_eq!(err.code, Code::BadKeyPackage);
    // Device without credential cannot create key packages.
    let bare = Device::create().unwrap();
    assert_eq!(
        bare.create_key_packages(1, false, DAY).unwrap_err().code,
        Code::NoCredential
    );
}

#[test]
fn roster_signature_verifies_under_commit_key() {
    let mut ds = Ds::default();
    let g = new_g(41);
    let (mut a, mut b) = (Client::new("alice"), Client::new("bob"));
    group_of(&mut ds, &g, &mut a, &mut [&mut b]);
    let keys = json!([b.key(), a.key()]).to_string();
    let out = parse(&a.dev.sign_roster(&g, &keys).unwrap());
    let gb = codec::parse_g(&g).unwrap();
    let mut list = vec![a.dev.device_key_bytes(), b.dev.device_key_bytes()];
    list.reverse();
    let digest = codec::roster_digest(&gb, out["epoch"].as_u64().unwrap(), &list);
    let commit_key =
        codec::parse_hex_n::<32>(a.summary(&g)["commit_key"].as_str().unwrap(), "k").unwrap();
    let sig = codec::parse_hex_n::<64>(out["signature"].as_str().unwrap(), "s").unwrap();
    assert!(codec::verify32(&commit_key, &digest, &sig));
    assert_eq!(
        a.dev
            .sign_roster(&g, &json!([a.key(), a.key()]).to_string())
            .unwrap_err()
            .code,
        Code::BadInput
    );
}

#[test]
fn rejoin_after_removal() {
    let mut ds = Ds::default();
    let g = new_g(42);
    let (mut a, mut b) = (Client::new("alice"), Client::new("bob"));
    let mut c = Client::new("carol");
    group_of(&mut ds, &g, &mut a, &mut [&mut b, &mut c]);
    a.commit(&mut ds, &g, json!({ "remove_device_keys": [c.key()] }))
        .unwrap();
    c.sync(&ds, &g);
    assert_eq!(c.summary(&g)["active"], false);
    let res = a
        .commit(
            &mut ds,
            &g,
            json!({ "add_key_packages": [c.key_package()] }),
        )
        .unwrap();
    c.join(&ds, &g, res["welcome"].as_str().unwrap());
    b.sync(&ds, &g);
    assert_eq!(c.summary(&g)["active"], true);
    a.send(&mut ds, &g, "welcome back");
    assert_eq!(body_text(&c.sync(&ds, &g)[0]), "welcome back");
}
