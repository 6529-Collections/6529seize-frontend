//! Ciphersuites: 0x004F (default) and 0x004E (AES-256-GCM, SHA-384) on one
//! device key. A group never changes suite.

mod common;

use common::*;
use mls_wasm::device::{supported_ciphersuite, CIPHERSUITE, CIPHERSUITE_AES256};
use mls_wasm::{Code, Device};
use openmls::prelude::Ciphersuite;
use serde_json::json;

const SUITES: [Ciphersuite; 2] = [CIPHERSUITE, CIPHERSUITE_AES256];

#[test]
fn dm_and_group_flows_run_on_each_suite() {
    for (i, suite) in SUITES.into_iter().enumerate() {
        let seed = 100 + 10 * i as u8;
        let mut ds = Ds::default();
        let (mut alice, mut bob, mut carol) = (
            Client::new("alice"),
            Client::new("bob"),
            Client::new("carol"),
        );

        let dm = new_g(seed);
        let created = alice.create_group_on(&mut ds, &dm, "dm", suite);
        assert_eq!(created["ciphersuite"], u16::from(suite));
        let res = alice
            .commit(
                &mut ds,
                &dm,
                json!({ "add_key_packages": [bob.key_package_on(suite)] }),
            )
            .unwrap();
        let joined = bob.join(&ds, &dm, res["welcome"].as_str().unwrap());
        assert_eq!(joined["ciphersuite"], u16::from(suite));
        alice.send(&mut ds, &dm, "hi bob");
        assert_eq!(body_text(&bob.sync(&ds, &dm)[0]), "hi bob");
        bob.send(&mut ds, &dm, "hi alice");
        assert_eq!(body_text(&alice.sync(&ds, &dm)[0]), "hi alice");

        let group = new_g(seed + 1);
        alice.create_group_on(&mut ds, &group, "group", suite);
        let res = alice
            .commit(
                &mut ds,
                &group,
                json!({ "add_key_packages": [bob.key_package_on(suite), carol.key_package_on(suite)] }),
            )
            .unwrap();
        bob.join(&ds, &group, res["welcome"].as_str().unwrap());
        carol.join(&ds, &group, res["welcome"].as_str().unwrap());
        bob.commit(&mut ds, &group, json!({ "self_update": true }))
            .unwrap();
        alice.sync(&ds, &group);
        carol.sync(&ds, &group);
        alice
            .commit(
                &mut ds,
                &group,
                json!({ "remove_device_keys": [carol.key()] }),
            )
            .unwrap();
        bob.sync(&ds, &group);
        carol.sync(&ds, &group);
        assert_eq!(carol.summary(&group)["active"], false);
        bob.send(&mut ds, &group, "after removal");
        let got = alice.sync(&ds, &group);
        assert_eq!(body_text(got.last().unwrap()), "after removal");
        assert_eq!(alice.summary(&group)["ciphersuite"], u16::from(suite));
    }
}

#[test]
fn one_device_holds_groups_of_both_suites_across_reload() {
    let mut ds = Ds::default();
    let (mut alice, mut bob) = (Client::new("alice"), Client::new("bob"));
    let old = new_g(130);
    let new = new_g(131);
    for (g, suite) in [(&old, CIPHERSUITE), (&new, CIPHERSUITE_AES256)] {
        alice.create_group_on(&mut ds, g, "dm", suite);
        let res = alice
            .commit(
                &mut ds,
                g,
                json!({ "add_key_packages": [bob.key_package_on(suite)] }),
            )
            .unwrap();
        bob.join(&ds, g, res["welcome"].as_str().unwrap());
    }
    // Same device key (Ed25519) in both groups.
    for g in [&old, &new] {
        let members = alice.summary(g)["members"].clone();
        assert!(members
            .as_array()
            .unwrap()
            .iter()
            .any(|m| m["device_key"] == alice.key()));
    }
    let state = bob.dev.export_state().unwrap();
    bob.dev = Device::load(&state).unwrap();
    assert_eq!(bob.summary(&old)["ciphersuite"], 0x004F);
    assert_eq!(bob.summary(&new)["ciphersuite"], 0x004E);
    alice.send(&mut ds, &old, "on 4f");
    alice.send(&mut ds, &new, "on 4e");
    assert_eq!(body_text(&bob.sync(&ds, &old)[0]), "on 4f");
    assert_eq!(body_text(&bob.sync(&ds, &new)[0]), "on 4e");
}

#[test]
fn refuses_key_packages_of_another_suite() {
    for (suite, other) in [
        (CIPHERSUITE, CIPHERSUITE_AES256),
        (CIPHERSUITE_AES256, CIPHERSUITE),
    ] {
        let mut ds = Ds::default();
        let (mut alice, bob) = (Client::new("alice"), Client::new("bob"));
        let g = new_g(140 + u16::from(suite) as u8);
        alice.create_group_on(&mut ds, &g, "dm", suite);
        let ops = json!({ "add_key_packages": [bob.key_package_on(other)] });
        let err = alice.dev.create_commit(&g, &ops.to_string()).unwrap_err();
        assert_eq!(err.code, Code::BadKeyPackage);
        assert!(err.to_string().contains("wrong ciphersuite"));
    }
}

#[test]
fn defaults_to_0x004f_and_refuses_other_suites() {
    let mut ds = Ds::default();
    let mut alice = Client::new("alice");
    let g = new_g(150);
    assert_eq!(alice.create_group(&mut ds, &g, "dm")["ciphersuite"], 0x004F);
    for code in [0x0001u16, 0x004D, 0x0052, 0xFFFF] {
        assert_eq!(
            supported_ciphersuite(code).unwrap_err().code,
            Code::BadInput
        );
    }
    assert_eq!(u16::from(supported_ciphersuite(0x004E).unwrap()), 0x004E);
    let classical = Ciphersuite::MLS_128_DHKEMX25519_AES128GCM_SHA256_Ed25519;
    assert_eq!(
        alice
            .dev
            .create_key_packages_for(classical, 1, false, 30 * DAY)
            .unwrap_err()
            .code,
        Code::BadInput
    );
    let g2 = new_g(151);
    assert_eq!(
        alice
            .dev
            .create_group_for(classical, &g2, &metadata(&g2, "dm", None))
            .unwrap_err()
            .code,
        Code::BadInput
    );
}
