//! Stable error codes. JS sees `Error("E2EE_WASM:<CODE>: <message>")`.

use std::fmt;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Code {
    /// Malformed argument (hex, base64, JSON, lengths).
    BadInput,
    /// No group with this handle on this device.
    NoGroup,
    /// The group already exists on this device.
    GroupExists,
    /// A pending own commit exists (merge or discard it first).
    PendingExists,
    /// No pending own commit.
    NoPending,
    /// A staged incoming commit exists (accept or reject it first).
    StagedExists,
    /// No staged incoming commit.
    NoStaged,
    /// No staged Welcome for this handle.
    NoStagedWelcome,
    /// Entry failed a structural, hash, bucket or kind check.
    BadEntry,
    /// The entry signature does not verify under pub(K_epoch).
    BadSignature,
    /// The item is for another epoch than the device's current one.
    WrongEpoch,
    /// Unwrap or MLS decryption failed.
    DecryptFailed,
    /// Application message is malformed.
    BadMessage,
    /// The message was sent by this device (MLS cannot decrypt own messages).
    OwnMessage,
    /// Exceeds the largest bucket.
    TooLarge,
    /// Not (or no longer) a member, or unknown member device key.
    NotMember,
    /// Welcome is malformed or for another handle.
    BadWelcome,
    /// No local KeyPackage matches the Welcome.
    NoKeyPackage,
    /// KeyPackage failed validation.
    BadKeyPackage,
    /// Metadata JSON (contract 3.5) failed validation.
    BadMetadata,
    /// The credential identity has not been set.
    NoCredential,
    /// Pending proposals must be committed before sending messages.
    PendingProposals,
    /// The commit was rejected by OpenMLS while building or processing it.
    MlsError,
    /// State blob is malformed or of an unknown version.
    BadState,
    /// Unexpected internal failure.
    Internal,
}

impl Code {
    pub fn as_str(self) -> &'static str {
        match self {
            Code::BadInput => "BAD_INPUT",
            Code::NoGroup => "NO_GROUP",
            Code::GroupExists => "GROUP_EXISTS",
            Code::PendingExists => "PENDING_EXISTS",
            Code::NoPending => "NO_PENDING",
            Code::StagedExists => "STAGED_EXISTS",
            Code::NoStaged => "NO_STAGED",
            Code::NoStagedWelcome => "NO_STAGED_WELCOME",
            Code::BadEntry => "BAD_ENTRY",
            Code::BadSignature => "BAD_SIGNATURE",
            Code::WrongEpoch => "WRONG_EPOCH",
            Code::DecryptFailed => "DECRYPT_FAILED",
            Code::BadMessage => "BAD_MESSAGE",
            Code::OwnMessage => "OWN_MESSAGE",
            Code::TooLarge => "TOO_LARGE",
            Code::NotMember => "NOT_MEMBER",
            Code::BadWelcome => "BAD_WELCOME",
            Code::NoKeyPackage => "NO_KEY_PACKAGE",
            Code::BadKeyPackage => "BAD_KEY_PACKAGE",
            Code::BadMetadata => "BAD_METADATA",
            Code::NoCredential => "NO_CREDENTIAL",
            Code::PendingProposals => "PENDING_PROPOSALS",
            Code::MlsError => "MLS_ERROR",
            Code::BadState => "BAD_STATE",
            Code::Internal => "INTERNAL",
        }
    }
}

#[derive(Debug, Clone)]
pub struct MlsError {
    pub code: Code,
    pub message: String,
}

impl MlsError {
    pub fn new(code: Code, message: impl Into<String>) -> Self {
        Self {
            code,
            message: message.into(),
        }
    }

    /// Wrap a library error by its Debug text (OpenMLS error values carry
    /// no secret material).
    pub fn mls(context: &str, err: impl fmt::Debug) -> Self {
        Self::new(Code::MlsError, format!("{context}: {}", terse(&err)))
    }

    pub fn internal(context: &str, err: impl fmt::Debug) -> Self {
        Self::new(Code::Internal, format!("{context}: {}", terse(&err)))
    }
}

/// Debug text of a library error, cut at 300 chars (on a char boundary).
fn terse(err: &impl fmt::Debug) -> String {
    let text = format!("{err:?}");
    match text.char_indices().nth(300) {
        Some((cut, _)) => text[..cut].to_string(),
        None => text,
    }
}

impl fmt::Display for MlsError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "E2EE_WASM:{}: {}", self.code.as_str(), self.message)
    }
}

impl std::error::Error for MlsError {}

pub type Result<T> = std::result::Result<T, MlsError>;
