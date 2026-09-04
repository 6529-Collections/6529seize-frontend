param(
  [Parameter(Position = 0)]
  [ValidateSet("read", "store")]
  [string]$Action = "read"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$credentialTarget = "6529seize-frontend-github-packages"

Add-Type -TypeDefinition @'
using System;
using System.ComponentModel;
using System.Runtime.InteropServices;
using System.Text;

public static class SeizeCredentialManager
{
    private const uint CredentialTypeGeneric = 1;
    // Persists across this user's logon sessions without making the credential machine-wide.
    private const uint CredentialPersistLocalMachine = 2;
    private const int ErrorNotFound = 1168;
    private const int MaximumCredentialBlobSize = 5 * 512;

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    private struct Credential
    {
        public uint Flags;
        public uint Type;
        [MarshalAs(UnmanagedType.LPWStr)] public string TargetName;
        [MarshalAs(UnmanagedType.LPWStr)] public string Comment;
        public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten;
        public uint CredentialBlobSize;
        public IntPtr CredentialBlob;
        public uint Persist;
        public uint AttributeCount;
        public IntPtr Attributes;
        [MarshalAs(UnmanagedType.LPWStr)] public string TargetAlias;
        [MarshalAs(UnmanagedType.LPWStr)] public string UserName;
    }

    [DllImport("advapi32.dll", EntryPoint = "CredReadW", CharSet = CharSet.Unicode, SetLastError = true)]
    private static extern bool CredRead(string target, uint type, uint reservedFlag, out IntPtr credentialPointer);

    [DllImport("advapi32.dll", EntryPoint = "CredWriteW", CharSet = CharSet.Unicode, SetLastError = true)]
    private static extern bool CredWrite([In] ref Credential credential, uint flags);

    [DllImport("advapi32.dll", SetLastError = true)]
    private static extern void CredFree(IntPtr buffer);

    public static string Read(string target)
    {
        IntPtr credentialPointer;
        if (!CredRead(target, CredentialTypeGeneric, 0, out credentialPointer))
        {
            int error = Marshal.GetLastWin32Error();
            if (error == ErrorNotFound)
            {
                return null;
            }
            throw new Win32Exception(error);
        }

        try
        {
            Credential credential = (Credential)Marshal.PtrToStructure(
                credentialPointer,
                typeof(Credential)
            );
            if (credential.CredentialBlobSize == 0)
            {
                return string.Empty;
            }
            return Marshal.PtrToStringUni(
                credential.CredentialBlob,
                checked((int)credential.CredentialBlobSize / 2)
            );
        }
        finally
        {
            CredFree(credentialPointer);
        }
    }

    public static void Write(string target, string secret)
    {
        byte[] secretBytes = Encoding.Unicode.GetBytes(secret);
        if (secretBytes.Length > MaximumCredentialBlobSize)
        {
            throw new ArgumentException("The credential is too large for Windows Credential Manager.");
        }

        IntPtr secretPointer = Marshal.AllocHGlobal(secretBytes.Length);
        try
        {
            Marshal.Copy(secretBytes, 0, secretPointer, secretBytes.Length);
            Credential credential = new Credential
            {
                Type = CredentialTypeGeneric,
                TargetName = target,
                Comment = "Read-only GitHub Packages token for 6529seize-frontend",
                CredentialBlobSize = checked((uint)secretBytes.Length),
                CredentialBlob = secretPointer,
                Persist = CredentialPersistLocalMachine,
                UserName = Environment.UserName
            };

            if (!CredWrite(ref credential, 0))
            {
                throw new Win32Exception(Marshal.GetLastWin32Error());
            }
        }
        finally
        {
            Array.Clear(secretBytes, 0, secretBytes.Length);
            for (int index = 0; index < secretBytes.Length; index++)
            {
                Marshal.WriteByte(secretPointer, index, 0);
            }
            Marshal.FreeHGlobal(secretPointer);
        }
    }
}
'@

if ($Action -eq "read") {
  $token = [SeizeCredentialManager]::Read($credentialTarget)
  if ([string]::IsNullOrEmpty($token)) {
    exit 1
  }

  [Console]::Out.Write($token)
  exit 0
}

$secureToken = Read-Host "GitHub Packages read token" -AsSecureString
$tokenPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureToken)
try {
  $token = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($tokenPointer)
  if ([string]::IsNullOrEmpty($token)) {
    throw "GitHub Packages read token cannot be empty."
  }
  [SeizeCredentialManager]::Write($credentialTarget, $token)
}
finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($tokenPointer)
  $token = $null
}

Write-Host "Stored the GitHub Packages read token in Windows Credential Manager."
