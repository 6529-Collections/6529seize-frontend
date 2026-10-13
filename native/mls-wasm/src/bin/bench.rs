//! Contract section 11 benchmark (native). `bench/bench.mjs` runs the same
//! scenario against the wasm build under Node.
//!
//! cargo run --release --bin bench -- [sizes...] [--reps N]   (default 2 87 174 1024, 3 reps)
//!
//! For each group size N (leaves): create a group and add N-1 members in one
//! commit, and again in commits of at most 200 adds; one member joins from the
//! Welcome; the creator removes one member; a member self-updates; members
//! process those commits; application messages are encrypted and decrypted.

use std::time::Instant;

use mls_wasm::codec;
use mls_wasm::Device;
use serde_json::{json, Value};

const DAY: u64 = 24 * 3600;
const SPLIT: usize = 200;
const MESSAGES: usize = 50;

fn parse(s: &str) -> Value {
    serde_json::from_str(s).expect("json")
}

fn ms(start: Instant) -> f64 {
    start.elapsed().as_secs_f64() * 1000.0
}

fn device(name: &str) -> Device {
    let mut d = Device::create().expect("device");
    let wallet = &hex::encode(codec::keccak256(name.as_bytes()))[..40];
    d.set_credential(&format!(
        "6529-e2ee-v1:0x{wallet}:0x{}",
        hex::encode(codec::keccak256(name.as_bytes()))
    ))
    .expect("credential");
    d
}

fn key_package(d: &Device) -> String {
    parse(&d.create_key_packages(1, false, 30 * DAY).expect("kp"))[0]["data"]
        .as_str()
        .expect("kp data")
        .to_string()
}

fn metadata(g: &str) -> String {
    json!({"v":1,"g":g,"kind":"group","name":"bench","admins":["p0"],"created_by":"p0","history":"from_join"})
        .to_string()
}

fn entry_item(entry: &Value) -> String {
    let mut item = entry.clone();
    item["type"] = json!("entry");
    item.to_string()
}

fn b64_len(v: &Value) -> usize {
    v.as_str()
        .map(|s| codec::unb64(s, "b64").expect("b64").len())
        .unwrap_or(0)
}

fn run(n: usize, g_seed: u8) -> Value {
    let g = format!("0x{}", hex::encode([g_seed; 32]));
    let mut creator = device("creator");
    let members: Vec<Device> = (1..n).map(|i| device(&format!("m{i}"))).collect();
    let kps: Vec<String> = members.iter().map(key_package).collect();
    creator.create_group(&g, &metadata(&g)).expect("group");

    // 1. One commit adding everyone.
    let t = Instant::now();
    let res = parse(
        &creator
            .create_commit(&g, &json!({ "add_key_packages": kps }).to_string())
            .expect("commit"),
    );
    let add_all_ms = ms(t);
    let add_all_entry = res["entry"]["padded_len"].as_u64().unwrap_or(0);
    let add_all_mls = res["mls_commit_len"].as_u64().unwrap_or(0);
    let welcome_b64 = res["welcome"].as_str().unwrap_or_default().to_string();
    let welcome_len = b64_len(&res["welcome"]);
    let t = Instant::now();
    creator.merge_pending(&g).expect("merge");
    let merge_ms = ms(t);

    // 2. One member joins from the Welcome.
    let mut joiner = members.into_iter().next();
    let mut join_ms = 0.0;
    if let Some(j) = joiner.as_mut() {
        let w = codec::unb64(&welcome_b64, "welcome").expect("welcome");
        let t = Instant::now();
        j.join_welcome(&g, &w, None).expect("join");
        j.accept_welcome(&g).expect("accept");
        join_ms = ms(t);
    }

    // 3. Messages (creator -> joiner).
    let (mut enc_ms, mut dec_ms, mut msg_len) = (0.0, 0.0, 0usize);
    if let Some(j) = joiner.as_mut() {
        let body = vec![b'x'; 200];
        for _ in 0..MESSAGES {
            let t = Instant::now();
            let m = parse(&creator.encrypt_message(&g, &body).expect("enc"));
            enc_ms += ms(t);
            msg_len = b64_len(&m["data"]);
            let item = json!({"type":"message","epoch":m["epoch"],"data":m["data"]}).to_string();
            let t = Instant::now();
            let d = parse(&j.decrypt_message(&g, &item).expect("dec"));
            dec_ms += ms(t);
            assert_eq!(d["sig_ok"], true);
        }
        enc_ms /= MESSAGES as f64;
        dec_ms /= MESSAGES as f64;
    }

    // 4. Removal commit (first commit with a path after creation) and its processing.
    let summary = parse(&creator.group_summary(&g).expect("summary"));
    let joiner_key = joiner.as_ref().map(|j| j.device_key());
    let victim = summary["members"]
        .as_array()
        .expect("members")
        .iter()
        .map(|m| m["device_key"].as_str().unwrap_or_default().to_string())
        .find(|k| *k != creator.device_key() && Some(k) != joiner_key.as_ref());
    let (mut rm_ms, mut rm_len, mut rm_proc_ms) = (0.0, 0u64, 0.0);
    if let Some(victim) = victim {
        let t = Instant::now();
        let r = parse(
            &creator
                .create_commit(&g, &json!({ "remove_device_keys": [victim] }).to_string())
                .expect("rm"),
        );
        rm_ms = ms(t);
        rm_len = r["entry"]["padded_len"].as_u64().unwrap_or(0);
        if let Some(j) = joiner.as_mut() {
            let t = Instant::now();
            let s = parse(
                &j.process_entry(&g, &entry_item(&r["entry"]))
                    .expect("process rm"),
            );
            assert_eq!(s["declared_ok"], true);
            j.accept_staged(&g).expect("accept rm");
            rm_proc_ms = ms(t);
        }
        creator.merge_pending(&g).expect("merge rm");
    }

    // 5. Self-update by the joiner, processed by the creator.
    let (mut su_ms, mut su_len, mut su_proc_ms) = (0.0, 0u64, 0.0);
    if let Some(j) = joiner.as_mut() {
        let t = Instant::now();
        let r = parse(&j.create_commit(&g, r#"{"self_update":true}"#).expect("su"));
        su_ms = ms(t);
        su_len = r["entry"]["padded_len"].as_u64().unwrap_or(0);
        let t = Instant::now();
        let s = parse(
            &creator
                .process_entry(&g, &entry_item(&r["entry"]))
                .expect("process su"),
        );
        assert_eq!(s["declared_ok"], true);
        creator.accept_staged(&g).expect("accept su");
        su_proc_ms = ms(t);
        j.merge_pending(&g).expect("merge su");
    }

    // 6. Same group size with adds split into commits of at most 200.
    let g2 = format!("0x{}", hex::encode([g_seed.wrapping_add(100); 32]));
    let mut creator2 = device("creator2");
    let members2: Vec<Device> = (1..n).map(|i| device(&format!("s{i}"))).collect();
    let kps2: Vec<String> = members2.iter().map(key_package).collect();
    creator2.create_group(&g2, &metadata(&g2)).expect("group2");
    let (mut split_ms, mut split_max_entry, mut split_max_welcome, mut split_commits) =
        (0.0, 0u64, 0usize, 0usize);
    for chunk in kps2.chunks(SPLIT) {
        let t = Instant::now();
        let r = parse(
            &creator2
                .create_commit(&g2, &json!({ "add_key_packages": chunk }).to_string())
                .expect("split"),
        );
        creator2.merge_pending(&g2).expect("merge split");
        split_ms += ms(t);
        split_commits += 1;
        split_max_entry = split_max_entry.max(r["entry"]["padded_len"].as_u64().unwrap_or(0));
        split_max_welcome = split_max_welcome.max(b64_len(&r["welcome"]));
    }

    let state_len = creator.export_state().map(|s| s.len()).unwrap_or(0);
    json!({
        "leaves": n,
        "add_all_commit_ms": add_all_ms,
        "add_all_merge_ms": merge_ms,
        "add_all_entry_bytes": add_all_entry,
        "add_all_mls_bytes": add_all_mls,
        "welcome_bytes": welcome_len,
        "join_ms": join_ms,
        "split_commits": split_commits,
        "split_total_ms": split_ms,
        "split_max_entry_bytes": split_max_entry,
        "split_max_welcome_bytes": split_max_welcome,
        "remove_commit_ms": rm_ms,
        "remove_entry_bytes": rm_len,
        "remove_process_ms": rm_proc_ms,
        "self_update_commit_ms": su_ms,
        "self_update_entry_bytes": su_len,
        "self_update_process_ms": su_proc_ms,
        "message_bytes": msg_len,
        "encrypt_ms": enc_ms,
        "decrypt_ms": dec_ms,
        "creator_state_bytes": state_len,
    })
}

/// Median of every numeric field over repeated runs (sizes are constant).
fn median(runs: &[Value]) -> Value {
    let mut out = runs[0].clone();
    if let Some(obj) = out.as_object_mut() {
        for (key, value) in obj.iter_mut() {
            let mut xs: Vec<f64> = runs.iter().filter_map(|r| r[key].as_f64()).collect();
            if xs.len() == runs.len() && value.is_number() {
                xs.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
                let m = xs[xs.len() / 2];
                *value = if key.ends_with("_ms") {
                    json!((m * 1000.0).round() / 1000.0)
                } else {
                    json!(m as u64)
                };
            }
        }
    }
    out
}

fn main() {
    let args: Vec<String> = std::env::args().skip(1).collect();
    let mut reps = 3usize;
    let mut sizes = Vec::new();
    let mut i = 0;
    while i < args.len() {
        if args[i] == "--reps" {
            reps = args
                .get(i + 1)
                .and_then(|v| v.parse().ok())
                .unwrap_or(3)
                .max(1);
            i += 2;
            continue;
        }
        if let Ok(n) = args[i].parse::<usize>() {
            sizes.push(n);
        }
        i += 1;
    }
    if sizes.is_empty() {
        sizes = vec![2, 87, 174, 1024];
    }
    let mut results = Vec::new();
    for (i, n) in sizes.iter().enumerate() {
        let runs: Vec<Value> = (0..reps).map(|r| run(*n, (i * 10 + r) as u8 + 1)).collect();
        let m = median(&runs);
        eprintln!("{m}");
        results.push(m);
    }
    let profile = if cfg!(debug_assertions) {
        "debug"
    } else {
        "optimized"
    };
    println!(
        "{}",
        serde_json::to_string_pretty(
            &json!({ "target": "native", "build": profile, "reps": reps, "results": results })
        )
        .expect("json")
    );
}
