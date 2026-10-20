//! OpenMLS (RFC 9420) device for 6529 end-to-end encrypted DMs and groups
//! (decision D109). See `README.md` and the shared E2EE contract, sections 1,
//! 3, 10 and 11.
//!
//! - [`codec`]: H()/TAG(), digests, wrap/pad, envelopes.
//! - [`device`]: the MLS device (target independent).
//! - `wasm`: the wasm-bindgen surface used by `lib/e2ee/wasm`.

#![forbid(unsafe_code)]

pub mod codec;
pub mod device;
pub mod error;
mod wasm;

pub use device::Device;
pub use error::{Code, MlsError};

/// Module facts as JSON (versions, suite, extension type, state format).
pub fn module_info() -> String {
    serde_json::json!({
        "crate": env!("CARGO_PKG_VERSION"),
        "openmls": "0.9.1",
        "ciphersuite": u16::from(device::CIPHERSUITE),
        "metadata_extension": device::METADATA_EXTENSION,
        "state_format": "6529MLS1",
        "max_past_epochs": device::MAX_PAST_EPOCHS,
        "entry_buckets": codec::ENTRY_BUCKETS,
        "message_buckets": codec::MESSAGE_BUCKETS,
    })
    .to_string()
}
